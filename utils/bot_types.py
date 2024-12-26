"""Типы для проверки бота"""
from abc import ABC, abstractmethod

class BotInterface(ABC):
    @abstractmethod
    async def send_notification(self, chat_name, message):
        pass

    @abstractmethod
    async def get_chat_id(self, chat_name):
        pass 