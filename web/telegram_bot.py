import requests
import logging
from config import bot_token

class TelegramBot:
    def __init__(self, token):
        self.token = bot_token
        self.endpoint = f"https://api.telegram.org/bot{self.token}/sendMessage"

    def send_event(self, event_data):
        # Преобразуйте event_data для единственного chat_id
        chat_id = event_data.get('chat_id')
        text = f"Событие: {event_data.get('description')}\nДата: {event_data.get('date')}"
        
        payload = {
            'chat_id': chat_id,
            'text': text
        }
        
        response = requests.post(self.endpoint, json=payload)
        if response.status_code == 200:
            logging.info(f"Событие успешно отправлено в чат {chat_id}")
        else:
            logging.error(f"Ошибка при отправке события в чат {chat_id}: {response.status_code}")
            response.raise_for_status()

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