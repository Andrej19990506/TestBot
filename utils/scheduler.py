import logging
import asyncio
from telegram.ext import CallbackContext, JobQueue
from datetime import datetime,time,timedelta
from utils.access_control import AccessControl
from chat_manager import ChatManager
from utils.mediator import Mediator
import pytz
from components.inventory_manager import InventoryManager


# Настройка уровней логирования для HTTP-библиотек
# loggers_to_modify = ['httpx', 'http.client', 'asyncio', 'urllib3', 'aiohttp', 'telegram']
# for logger_name in loggers_to_modify:
#     logging.getLogger(logger_name).setLevel(logging.WARNING)

def sync_wrapper(async_func, *args, **kwargs):
    asyncio.create_task(async_func(*args, **kwargs))

class Scheduler:
    def __init__(self, mediator, job_queue, chat_manager):
        self.mediator = mediator
        self.mediator.register_scheduler(self)
        self.job_queue = job_queue
        self.chat_manager = chat_manager
        self.inventory_manager = None
    
    def attach_inventory_manager(self, inventory_manager):
        # Привязываем inventory_manager к scheduler
        self.inventory_manager = inventory_manager

    def send_scheduled_message(self, context):
        # Метод для отправки запланированных сообщений
        pass
    


    def schedule_daily_check(self):
        # Запускаем асинхронный метод напрямую в JobQueue
        self.job_queue.run_repeating(
            self.async_check_events,
            interval=60,
            first=0
        )

    def schedule_daily_update(self):
        logging.info("Планирование ежедневного обновления...")
        # Установите временную зону Красноярска
        krsk_tz = pytz.timezone('Asia/Krasnoyarsk')
        
        # Получите текущее время в данной временной зоне
        local_time = krsk_tz.localize(datetime.combine(datetime.now().date(), time(18, 29)))
        
        # Переведите его в UTC
        utc_time = local_time.astimezone(pytz.utc).time()
        
        logging.info(f"Запланировано обновление на {utc_time} UTC.")
        
        # Запланируйте задачу
        self.job_queue.run_daily(
            lambda context: sync_wrapper(self.disable_editing, context), 
            time=utc_time
        )

    def schedule_daily_clear_inventory(self):
        logging.info("Планирование ежедневной очистки инвентаризации...")
        # Временная зона Красноярска
        krsk_tz = pytz.timezone('Asia/Krasnoyarsk')
        
        # Локальное время 7 утра для запуска задачи
        local_time = krsk_tz.localize(datetime.combine(datetime.now().date(), time(18, 31)))
        
        # Преобразуем его в UTC
        utc_time = local_time.astimezone(pytz.utc).time()
        
        logging.info(f"Запланирована очистка инвентаризации на {utc_time} UTC.")

        # Добавляем задачу в планировщик
        self.job_queue.run_daily(
            lambda context: sync_wrapper(self.clear_inventory, context), 
            time=utc_time
        )    

    async def clear_inventory(self, context: CallbackContext):
        logging.info("Очистка данных инвентаризации...")
        if self.inventory_manager:
            self.inventory_manager.clear_all_inventories()
            logging.info("Очистка инвентаризации завершена.")
        else:
            logging.error("InventoryManager не установлен. Очистка не может быть выполнена.")

    async def disable_editing(self, context: CallbackContext):
        logging.info("Обновление статуса инвентаризации: редактирование отключено.")
        self.inventory_manager.set_inventory_status_complete()

    async def send_scheduled_message(self, context: CallbackContext):
        chat_id = context.job.data['chat_id']
        message = context.job.data['message']

        try:
            await context.bot.send_message(chat_id=chat_id, text=message)
            logging.info(f"Сообщение отправлено в чат ID: {chat_id}")
        except Exception as e:
            logging.error(f"Ошибка при отправке сообщения: {e}")


    def sync_check_events(self, context: CallbackContext):
        # Использование asyncio для асинхронного вызова
        asyncio.ensure_future(self.async_check_events(context))

    async def async_check_events(self, context: CallbackContext):
        try:
            current_time = datetime.now()
            logging.info("Проверка событий началась...")

            # Получаем все события напрямую, так как они хранятся в виде списка
            events = self.chat_manager.events
            
            for event in events:
                try:
                    event_time_str = f"{event['date']}"  # Предполагаем, что дата и время уже в одном поле
                    # Изменяем формат для соответствия входящей дате
                    event_time = datetime.strptime(event_time_str, '%d.%m.%Y %H:%M')
                    
                    # Проверяем все уведомления для события
                    notifications = event.get('notifications', [])
                    for notification in notifications:
                        # Получаем время уведомления
                        notification_time = self.calculate_notification_time(
                            event_time, 
                            notification['time'], 
                            notification['unit']
                        )
                        
                        # Проверяем, пора ли отправлять уведомление
                        time_diff = (notification_time - current_time).total_seconds()
                        if 0 < time_diff < 60:  # Проверяем в течение минуты
                            # Формируем сообщение уведомления
                            message = notification['message'].format(
                                description=event['description'],
                                date=event['date']
                            )
                            
                            # Отправляем уведомление в выбранные чаты
                            chat_ids = event.get('chat_ids', [])
                            for chat_id in chat_ids:
                                try:
                                    await context.bot.send_message(
                                        chat_id=chat_id,
                                        text=message
                                    )
                                    logging.info(f"Уведомление отправлено в чат {chat_id} для события {event['description']}")
                                except Exception as e:
                                    logging.error(f"Ошибка отправки уведомления в чат {chat_id}: {e}")

                except Exception as e:
                    logging.error(f"Ошибка обработки события: {e}")
                    continue

            logging.info("Проверка событий завершена.")
        except Exception as e:
            logging.error(f"Ошибка в async_check_events: {e}")

    def calculate_notification_time(self, event_time, notification_time, unit):
        """Вычисляет время отправки уведомления на основе настроек"""
        if unit == 'minutes':
            return event_time - timedelta(minutes=notification_time)
        elif unit == 'hours':
            return event_time - timedelta(hours=notification_time)
        elif unit == 'days':
            return event_time - timedelta(days=notification_time)
        return event_time

