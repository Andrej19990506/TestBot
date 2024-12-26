from telegram import Bot
import logging
import json
import traceback
from config import TOKEN

class TelegramBot:
    def __init__(self):
        self.bot = Bot(TOKEN)
        self.chat_ids = self.load_chat_ids()

    def load_chat_ids(self):
        try:
            with open('chat_ids.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading chat IDs: {e}")
            return {}

    async def send_message(self, chat_id, text, parse_mode=None):
        """Базовый метод отправки сообщений"""
        try:
            await self.bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=parse_mode
            )
            logging.info(f"✅ Message sent to chat {chat_id}")
            return True
        except Exception as e:
            logging.error(f"❌ Error sending message to {chat_id}: {e}")
            return False

    async def send_notification(self, chat_name, message):
        """Отправка уведомления в чат по имени"""
        try:
            chat_id = self.chat_ids.get(chat_name)
            if not chat_id:
                logging.error(f"❌ Chat ID not found for chat name: {chat_name}")
                return False

            logging.info(f"📤 Sending notification to {chat_name} ({chat_id})")
            return await self.send_message(chat_id, message, parse_mode='HTML')

        except Exception as e:
            logging.error(f"❌ Error sending notification to {chat_name}: {e}\n{traceback.format_exc()}")
            return False 