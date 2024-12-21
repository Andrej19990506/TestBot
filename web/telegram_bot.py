from telegram import Bot
import logging
import requests
from config import bot_token
from datetime import datetime
import traceback
from utils.chat_manager import ChatManager

class TelegramBot:
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

    def get_chat_id(self, message):
        """Получаем chat_id из полученного сообщения или обновлений."""
        url = f"https://api.telegram.org/bot{self.token}/getUpdates"
        response = requests.get(url)
        if response.status_code == 200:
            updates = response.json().get('result', [])
            for update in updates:
                if 'message' in update and update['message'].get('text') == message:
                    return update['message']['chat']['id']
        else:
            logging.error(f"Ошибка при получении обновлений: {response.status_code}")
        return None