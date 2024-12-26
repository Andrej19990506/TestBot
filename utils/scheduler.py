import logging
import asyncio
from telegram.ext import CallbackContext, JobQueue
from datetime import datetime, time, timedelta
import pytz
import json
import argparse
import os
import sys
import traceback
from telegram import Bot
from config import bot_token
from utils.bot_types import BotInterface

# Получаем путь к директории проекта
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Добавляем путь проекта в sys.path
sys.path.append(PROJECT_ROOT)

# Теперь импортируем локальные модули
from utils.access_control import AccessControl  # Изменим на относительный импорт
from utils.chat_manager import ChatManager
from utils.mediator import Mediator
from components.inventory_manager import InventoryManager

# Настраиваем пути к файлам
EVENTS_FILE = os.path.join(PROJECT_ROOT, 'events.json')

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Для тестирования нам не нужны все импорты, создадим упрощенную версию:
if __name__ == "__main__":
    # Отключаем ненужные импорты при тестировании
    AccessControl = None
    ChatManager = None
    Mediator = None
    InventoryManager = None

class Scheduler:
    def __init__(self, bot=None):
        if bot is not None and not isinstance(bot, BotInterface):
            raise TypeError("Bot must implement BotInterface")
            
        self.bot = bot
        self.tasks = {}
        self.timezone = pytz.timezone('Asia/Krasnoyarsk')
        self.is_running = True
        self.tasks_file = 'scheduled_tasks.json'
        self.job_queue = None
        self.current_loop = None  # Добавляем отслеживание текущего loop

    async def save_scheduled_tasks(self):
        """Сохранение запланированных задач в файл"""
        try:
            tasks_data = {}
            for notification_time, chat_tasks in self.tasks.items():
                tasks_data[notification_time.isoformat()] = {
                    'chats': list(chat_tasks.keys()),
                    'messages': {
                        chat: task['message']
                        for chat, task in chat_tasks.items()
                    }
                }
            
            with open(self.tasks_file, 'w', encoding='utf-8') as f:
                json.dump(tasks_data, f, ensure_ascii=False, indent=2)
            
            if tasks_data:
                logging.info(f"✅ Saved {len(tasks_data)} scheduled tasks")
            else:
                logging.info("📅 No tasks to save")
            
        except Exception as e:
            logging.error(f"❌ Error saving scheduled tasks: {str(e)}\n{traceback.format_exc()}")

    async def load_scheduled_tasks(self):
        """Загрузка запланированных задач из файла"""
        try:
            if not os.path.exists(self.tasks_file):
                return

            with open(self.tasks_file, 'r', encoding='utf-8') as f:
                tasks_data = json.load(f)

            for time_str, task_info in tasks_data.items():
                notification_time = datetime.fromisoformat(time_str)
                if notification_time > datetime.now(self.timezone):  # Загружаем только будущие задачи
                    self.tasks[notification_time] = {}
                    for chat_name in task_info['chats']:
                        if chat_name in task_info['messages']:
                            self.tasks[notification_time][chat_name] = {
                                'message': task_info['messages'][chat_name],
                                'scheduled_at': datetime.now(self.timezone).isoformat()
                            }

            if self.tasks:
                logging.info(f"✅ Loaded {len(self.tasks)} scheduled tasks")
            else:
                logging.info("📅 No scheduled tasks to load")
            
        except Exception as e:
            logging.error(f"❌ Error loading scheduled tasks: {str(e)}\n{traceback.format_exc()}")

    def get_task_message(self, task):
        """Получение сообщения из задачи"""
        try:
            return task.get('message', '')
        except Exception:
            return ''

    def attach_inventory_manager(self, inventory_manager):
        """Привязка inventory manager к планировщику"""
        self.inventory_manager = inventory_manager
        logging.info("✅ Inventory manager attached to scheduler")

    def set_job_queue(self, job_queue):
        """Установка job_queue для планировщика"""
        try:
            self.job_queue = job_queue
            if self.job_queue:
                self.schedule_daily_check()
                logging.info("✅ Job queue initialized and daily check scheduled")
            else:
                logging.warning("⚠️ Job queue is None, daily checks will not be scheduled")
        except Exception as e:
            logging.error(f"❌ Error setting job queue: {str(e)}\n{traceback.format_exc()}")

    def schedule_daily_check(self):
        """Планирование ежедневной проверки"""
        if self.job_queue:
            # Устанавливаем время проверки на 9:00 утра
            check_time = time(9, 0, tzinfo=self.timezone)
            self.job_queue.run_daily(
                self._daily_check_callback,
                check_time,
                days=(0, 1, 2, 3, 4, 5, 6)
            )
            logging.info("✅ Daily check scheduled")
        else:
            logging.warning("⚠️ Job queue not set, daily check not scheduled")

    def schedule_daily_update(self):
        """Планирование ежедневного обновления"""
        if self.job_queue:
            self.job_queue.run_daily(
                callback=self._daily_update_callback,
                time=time(hour=10, minute=0),
                days=(0, 1, 2, 3, 4, 5, 6),
                name='daily_update'
            )
            logging.info("✅ Daily update scheduled")

    def schedule_daily_clear_inventory(self):
        """Планирование ежедневной очистки инвентаря"""
        if self.job_queue:
            self.job_queue.run_daily(
                callback=self._daily_clear_inventory_callback,
                time=time(hour=23, minute=0),
                days=(0, 1, 2, 3, 4, 5, 6),
                name='daily_clear_inventory'
            )
            logging.info("✅ Daily clear inventory scheduled")

    async def _daily_check_callback(self, context):
        """Callback для ежедневной проверки инвентаря"""
        if self.inventory_manager:
            await self.inventory_manager.daily_check()
            logging.info("✅ Daily inventory check completed")
        else:
            logging.warning("⚠️ Inventory manager not set, daily check skipped")

    async def _daily_update_callback(self, context):
        """Callback для ежедневного обновления данных"""
        if self.inventory_manager:
            await self.inventory_manager.daily_update()
            logging.info("✅ Daily data update completed")

    async def _daily_clear_inventory_callback(self, context):
        """Callback для ежедневной очистки устаревших данных"""
        if self.inventory_manager:
            await self.inventory_manager.daily_clear()
            logging.info("✅ Daily cleanup completed")

    async def load_events(self):
        """Загрузка событий из файла"""
        try:
            with open('events.json', 'r', encoding='utf-8') as f:
                self.events = json.load(f)
            logging.info("✅ Events loaded successfully")
        except FileNotFoundError:
            self.events = []
            logging.warning("⚠️ Events file not found, starting with empty list")
        except Exception as e:
            logging.error(f"❌ Error loading events: {str(e)}")
            self.events = []

    def show_upcoming_events(self):
        """Показать предстоящие события на ближайшие 7 дней"""
        now = datetime.now(self.timezone)
        seven_days_later = now + timedelta(days=7)
        
        upcoming_events = []
        for event in self.events:
            try:
                event_date = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
                event_date = self.timezone.localize(event_date)
                
                if now <= event_date <= seven_days_later:
                    upcoming_events.append({
                        'description': event['description'],
                        'date': event_date.strftime('%d.%m.%Y %H:%M'),
                        'chats': event['chat_ids']
                    })
            except Exception as e:
                logging.error(f"Error processing event: {str(e)}")
                continue

        if upcoming_events:
            logging.info("\n📅 Upcoming events for the next 7 days:")
            for event in sorted(upcoming_events, key=lambda x: datetime.strptime(x['date'], '%d.%m.%Y %H:%M')):
                logging.info(f"""
🕒 {event['date']}
📝 {event['description']}
📱 Chats: {', '.join(event['chats'])}
------------------------""")
        else:
            logging.info("📅 No upcoming events for the next 7 days")

    async def start(self):
        """Запуск планировщика"""
        logging.info("🚀 Scheduler started")
        self.current_loop = asyncio.get_running_loop()  # Сохраняем текущий loop
        await self.load_events()
        self.show_upcoming_events()
        
        # Восстанавливаем сохраненные задачи
        await self.load_scheduled_tasks()
        
        last_tasks_check = None
        
        while self.is_running:
            try:
                now = datetime.now(self.timezone)
                
                # ��роверяем все запланированные задачи
                for notification_time, chat_tasks in list(self.tasks.items()):
                    if last_tasks_check is None or (now - last_tasks_check).seconds >= 60:
                        if chat_tasks:
                            logging.info(f"⏰ Active tasks found for {notification_time.strftime('%H:%M')}")
                        last_tasks_check = now
                    
                    if now >= notification_time:
                        # Выполняем все задачи для этого времени
                        await self.execute_tasks(notification_time, chat_tasks)
                        
                        # Удаляем выполненные задачи
                        del self.tasks[notification_time]
                        logging.info(f"🗑️ Removed completed tasks for {notification_time}")

                await asyncio.sleep(1)
                
            except Exception as e:
                logging.error(f"❌ Error in scheduler loop: {str(e)}\n{traceback.format_exc()}")
                await asyncio.sleep(5)

    async def execute_tasks(self, notification_time, chat_tasks):
        """Выполнение всех задач для указанного времени"""
        for chat_name, task in list(chat_tasks.items()):
            try:
                if isinstance(task, dict) and 'message' in task:
                    # Используем именно текст уведомления из task['message']
                    notification_message = task['message']
                    
                    if not self.bot:
                        logging.error(f"❌ No bot available for {chat_name}")
                        continue
                        
                    # Отправляем текст уведомления
                    await self.bot.send_notification(chat_name, notification_message)
                    logging.info(f"✅ Notification sent to {chat_name}")
            except Exception as e:
                logging.error(f"❌ Error sending notification to {chat_name}: {str(e)}\n{traceback.format_exc()}")

    async def stop(self):
        """Остановка планировщика"""
        if not self.is_running:
            return
            
        self.is_running = False
        
        try:
            # Создаем список задач для выполнения
            tasks = []
            
            # Добавляем сохранение состояния
            tasks.append(self.save_scheduled_tasks())
            
            # Отменяем все активные задачи
            tasks_count = 0
            for notification_time, chat_tasks in list(self.tasks.items()):
                for chat_name, task in list(chat_tasks.items()):
                    try:
                        if isinstance(task, dict):
                            tasks_count += 1
                    except Exception as e:
                        logging.error(f"❌ Error cancelling task for {chat_name}: {str(e)}")

            # Очищаем словарь задач
            self.tasks.clear()
            
            # Дожидаемся выполнения всех задач
            if tasks:
                await asyncio.gather(*tasks)
                
            if tasks_count > 0:
                logging.info(f"✅ Cancelled {tasks_count} active tasks")
                
        except Exception as e:
            logging.error(f"❌ Error stopping scheduler: {str(e)}")
        finally:
            logging.info("🛑 Scheduler stopped")

    async def schedule_notification(self, notification_time, chat_names, task_data):
        """Планирование уведомления"""
        try:
            if notification_time.tzinfo is None:
                notification_time = self.timezone.localize(notification_time)
            
            if notification_time not in self.tasks:
                self.tasks[notification_time] = {}
            
            # Добавляем задачу для каждого чата
            for chat_name in chat_names:
                self.tasks[notification_time][chat_name] = task_data
            
            await self.save_scheduled_tasks()
            logging.info(f"📅 Notification scheduled for {notification_time} for {len(chat_names)} chats")
            
        except Exception as e:
            logging.error(f"❌ Error scheduling notification: {str(e)}")

    async def _schedule_notification_task(self, notification_time, chat_name, message):
        """Выполнение запланированного уведомления"""
        try:
            if notification_time.tzinfo is None:
                notification_time = self.timezone.localize(notification_time)

            now = datetime.now(self.timezone)
            wait_time = (notification_time - now).total_seconds()
            
            if wait_time > 0:
                logging.info(f"⏳ Waiting {wait_time:.0f} seconds to send notification to {chat_name}")
                await asyncio.sleep(wait_time)

            logging.info(f"🔔 Sending notification to {chat_name} at {notification_time}")
            
            # Отправляем уведомление через бота
            success = await self.bot.send_notification(chat_name, message)
            
            if success:
                logging.info(f"✅ Notification sent successfully to {chat_name}")
            else:
                logging.error(f"❌ Failed to send notification to {chat_name}")

            # Удаляем выполненную задачу
            if notification_time in self.tasks and chat_name in self.tasks[notification_time]:
                del self.tasks[notification_time][chat_name]
                if not self.tasks[notification_time]:
                    del self.tasks[notification_time]

        except Exception as e:
            logging.error(f"❌ Error in notification task for {chat_name}: {str(e)}\n{traceback.format_exc()}")

    async def _get_chat_id(self, chat_name):
        """Получение chat_id из файла"""
        try:
            with open('chat_ids.json', 'r', encoding='utf-8') as f:
                chat_ids = json.load(f)
                return chat_ids.get(chat_name)
        except Exception as e:
            logging.error(f"❌ Error getting chat_id for {chat_name}: {str(e)}")
            return None

    async def cancel_notification(self, notification_time, chat_name):
        """Отмена запланированного уведомления"""
        try:
            if notification_time.tzinfo is None:
                notification_time = self.timezone.localize(notification_time)

            # Если время уже прошло, просто возвращаем успех
            if notification_time <= datetime.now(self.timezone):
                return True

            # Ищем и удаляем задачу
            for time_key, chat_tasks in list(self.tasks.items()):
                if (time_key.year == notification_time.year and 
                    time_key.month == notification_time.month and
                    time_key.day == notification_time.day and
                    time_key.hour == notification_time.hour and
                    time_key.minute == notification_time.minute):
                    
                    # Удаляем задачу для этого чата если она есть
                    if chat_name in chat_tasks:
                        del chat_tasks[chat_name]
                        
                        # Если для этого времени больше нет задач, удаляем запись
                        if not chat_tasks:
                            del self.tasks[time_key]
                        
                        # Сохраняем обновленные задачи
                        await self.save_scheduled_tasks()

            # Всегда возвращаем True, так как задача либо удалена, либо её не было
            return True

        except Exception as e:
            logging.error(f"❌ Error cancelling notification: {str(e)}")
            return False

    async def remove_event_tasks(self, event_id):
        """Удаление всех задач для события"""
        try:
            # Загружаем событие
            with open('events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
                event = next((e for e in events if e.get('id') == event_id), None)

            if event:
                # Получаем время события
                notification_time = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
                
                # Удаляем все уведомления для этого события
                for chat_id in event['chat_ids']:
                    await self.cancel_notification(notification_time, chat_id)

                # Обновляем список событий
                await self.load_events()

            return True

        except Exception as e:
            logging.error(f"❌ Error removing event tasks: {str(e)}")
            return False

    def show_active_tasks(self):
        """Показать активные задачи"""
        if not self.tasks:
            logging.info("📅 No active tasks")
            return

        logging.info("\n📅 Active tasks:")
        for notification_time, chat_tasks in self.tasks.items():
            logging.info(f"""
⏰ Time: {notification_time.strftime('%Y-%m-%d %H:%M')}
📱 Chats: {', '.join(chat_tasks.keys())}
 Status: {'Pending' if any(not task.done() for task in chat_tasks.values()) else 'Completed'}
------------------------""")

    def get_repeat_dates(self, event_data):
        """Получить даты для повторяющихся событий"""
        start_date = datetime.strptime(event_data['date'], '%Y-%m-%d %H:%M')
        repeat = event_data.get('repeat', {'type': 'none'})
        repeat_type = repeat['type']
        
        if repeat_type == 'none':
            return [start_date]
        elif repeat_type == 'daily':
            return self.get_daily_dates(start_date)
        elif repeat_type == 'weekly':
            weekdays = repeat['weekdays']
            return self.get_weekly_dates(start_date, weekdays)
        elif repeat_type == 'monthly':
            month_day = repeat['monthDay']
            return self.get_monthly_dates(start_date, month_day)
        
        return [start_date]

    def get_daily_dates(self, start_date):
        """Получение дат для ежедневных событий"""
        dates = []
        current = start_date
        # Используем timezone-aware даты
        end_date = start_date + timedelta(days=7)
        
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)
        
        return dates

    def get_weekly_dates(self, start_date, weekdays):
        """Получение дат для еженедельных событий"""
        dates = []
        current = start_date
        end_date = start_date + timedelta(days=30)  # На месяц вперед
        
        while current <= end_date:
            if current.weekday() in weekdays:
                dates.append(current)
            current += timedelta(days=1)
        
        return dates

    def get_monthly_dates(self, start_date, day):
        """Получение дат для ежемесячных событий"""
        dates = []
        current = start_date
        end_date = start_date + timedelta(days=90)  # На 3 месяца вперед
        
        while current <= end_date:
            if current.day == day:
                dates.append(current)
            # Переходим к следующему дню
            current += timedelta(days=1)
        
        return dates

    async def replan_repeating_events(self):
        """Перепланирование повторяющихся событий"""
        try:
            with open('events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
            
            now = datetime.now(self.timezone)
            status_updated = False
            
            for event in events:
                repeat = event.get('repeat', {'type': 'none'})
                if repeat['type'] != 'none':
                    event_date = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
                    
                    # Проверяем активность и обновляем статус
                    is_active = self.is_event_active(event, now)
                    event['scheduling_status'] = {
                        'active': is_active,
                        'last_check': now.isoformat()
                    }
                    status_updated = True
                    
                    if is_active and event_date < now:
                        # Перепланируем событие
                        new_dates = self.get_repeat_dates(event)
                        if new_dates:
                            event['date'] = new_dates[0].strftime('%Y-%m-%d %H:%M')
                            await self.schedule_notifications_for_dates(event, new_dates)
            
            if status_updated:
                # Сохраняем обновленные события
                with open('events.json', 'w', encoding='utf-8') as f:
                    json.dump(events, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logging.error(f"Error replanning events: {str(e)}")

    async def check_tasks(self):
        """Проверка и выполнение запланированных задач"""
        try:
            now = datetime.now(self.timezone)
            
            # Загружаем события для обновления статусов
            with open('events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
            
            status_updated = False
            
            # Проверяем все запланированные задачи
            for notification_time, chat_tasks in list(self.tasks.items()):
                if notification_time <= now:
                    # Выполняем задачи
                    await self.execute_tasks(notification_time, chat_tasks)
                    del self.tasks[notification_time]
                    
                    # Обновляем статус для соответствующих событий
                    for event in events:
                        if self.is_event_active(event, now):
                            event['scheduling_status'] = {
                                'active': True,
                                'last_check': now.isoformat()
                            }
                            status_updated = True
                        else:
                            event['scheduling_status'] = {
                                'active': False,
                                'last_check': now.isoformat()
                            }
                            status_updated = True
            
            if status_updated:
                # Сохраняем обновленные статусы
                with open('events.json', 'w', encoding='utf-8') as f:
                    json.dump(events, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logging.error(f"Error checking tasks: {str(e)}")

    def is_event_active(self, event, now):
        """Проверка активности события"""
        try:
            # Конвертируем дату события в timezone-aware
            event_date = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
            event_date = self.timezone.localize(event_date)
            
            repeat = event.get('repeat', {'type': 'none'})
            
            if repeat['type'] == 'none':
                # Для разовых событий
                return event_date > now
            else:
                # Для повторяющихся событий проверяем наличие будущих дат
                future_dates = []
                if repeat['type'] == 'daily':
                    future_dates = self.get_daily_dates(event_date)
                elif repeat['type'] == 'weekly':
                    future_dates = self.get_weekly_dates(event_date, repeat['weekdays'])
                elif repeat['type'] == 'monthly':
                    future_dates = self.get_monthly_dates(event_date, repeat['monthDay'])
                    
                return any(date > now for date in future_dates)
            
        except Exception as e:
            logging.error(f"Error checking event activity: {str(e)}")
            return False

