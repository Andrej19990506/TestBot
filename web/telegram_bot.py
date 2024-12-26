from telegram import Bot
import logging
import requests
from config import bot_token
from datetime import datetime
import traceback
from utils.bot_types import BotInterface
import json

class TelegramBot(BotInterface):
    def __init__(self, token):
        self.token = token
        self.bot = Bot(token=token)

    def send_event(self, event_data):
        """Отправка события в телеграм"""
        try:
            logging.info(f"Получены данные для отправки: {event_data}")
            
            # Проверяем наличие всех необходимых полей
            required_fields = ['chat_id', 'description', 'date']
            for field in required_fields:
                if field not in event_data:
                    logging.error(f"Отсутствует обязательное поле: {field}")
                    return False
            
            chat_id = str(event_data['chat_id'])
            description = event_data['description']
            
            # Преобразуем дату в нужный формат для отображения
            try:
                date_obj = datetime.strptime(event_data['date'], '%Y-%m-%d %H:%M')
                formatted_date = date_obj.strftime('%d.%m.%Y %H:%M')
            except ValueError as e:
                logging.error(f"Ошибка преобразования даты: {e}")
                formatted_date = event_data['date']
            
            logging.info(f"Подготовка к отправке сообщения в чат {chat_id}")
            message = f"🗓 Новое событие:\n\n📝 {description}\n📅 {formatted_date}"
            
            logging.debug(f"Отправка сообщения: {message}")
            
            try:
                self.bot.send_message(
                    chat_id=chat_id,
                    text=message,
                    parse_mode='HTML'
                )
                logging.info(f"Сообщение успешно отправлено в чат {chat_id}")
                return True
            except Exception as telegram_error:
                logging.error(f"Ошибка Telegram API при отправке в чат {chat_id}: {telegram_error}\n{traceback.format_exc()}")
                return False
            
        except Exception as e:
            logging.error(f"Ошибка при отправке события в Telegram: {e}\n{traceback.format_exc()}")
            return False

    async def send_notification(self, chat_name, message, is_repeat=False):
        """Отправка уведомления в чат"""
        try:
            with open('chat_ids.json', 'r', encoding='utf-8') as f:
                chat_ids = json.load(f)
                
            if chat_name in chat_ids:
                chat_id = chat_ids[chat_name]
                
                # Добавляем метку для повторяющихся уведомлений
                if is_repeat:
                    message = "🔄 " + message
                    
                await self.bot.send_message(
                    chat_id=chat_id,
                    text=message,
                    parse_mode='HTML'
                )
                logging.info(f"✅ Notification sent to {chat_name}")
            else:
                raise Exception(f"Chat {chat_name} not found in chat_ids.json")
                
        except Exception as e:
            logging.error(f"❌ Error sending notification to {chat_name}: {str(e)}")
            raise

    async def get_chat_id(self, chat_name):
        """Получение chat_id по имени чата"""
        try:
            with open('chat_ids.json', 'r', encoding='utf-8') as f:
                chat_ids = json.load(f)
                
            if chat_name in chat_ids:
                return chat_ids[chat_name]
            else:
                raise Exception(f"Chat {chat_name} not found in chat_ids.json")
                
        except Exception as e:
            logging.error(f"❌ Error getting chat_id for {chat_name}: {str(e)}")
            raise