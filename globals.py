"""Модуль для хранения глобальных переменных"""
from utils.chat_manager import ChatManager
from utils.scheduler import Scheduler
from web.telegram_bot import TelegramBot
from config import bot_token

# Создаем экземпляр TelegramBot
telegram_bot = TelegramBot(bot_token)

# Создаем планировщик с TelegramBot
scheduler = Scheduler(bot=telegram_bot)

# Инициализируем chat_manager
chat_manager = ChatManager()

# Флаг для управления работой scheduler
is_running = True

event_manager = None
access_control = None
inventory_manager = None
inventory_conv_handler = None 