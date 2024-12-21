import logging
import asyncio
from telegram.ext import CallbackContext, JobQueue
from datetime import datetime, time, timedelta
import pytz
import json
import argparse
import os
import sys

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
    def __init__(self, mediator=None, chat_manager=None):
        self.tasks = {}
        self.running = False
        self.mediator = mediator
        self.chat_manager = chat_manager
        self.job_queue = None
        self.inventory_manager = None
    
    def attach_inventory_manager(self, inventory_manager):
        """Присоединяет менеджер инвентаря к планировщику"""
        self.inventory_manager = inventory_manager
    
    async def start(self):
        """Запускает планировщик"""
        self.running = True
        while self.running:
            current_time = datetime.now()
            
            # Проверяем и выполняем задачи
            tasks_to_remove = []
            for task_time, task in self.tasks.items():
                if current_time >= task_time:
                    await task()
                    tasks_to_remove.append(task_time)
            
            # Удаляем выполненные задачи
            for task_time in tasks_to_remove:
                del self.tasks[task_time]
                
            await asyncio.sleep(1)  # Проверяем каждую секунду
    
    def stop(self):
        """Останавливает планировщик"""
        self.running = False
    
    def schedule_task(self, time: datetime, task):
        """Добавляет новую задачу в планировщик
        
        Args:
            time (datetime): Время выполнения задачи
            task (callable): Асинхронная функция для выполнения
        """
        self.tasks[time] = task
    
    def remove_task(self, time: datetime):
        """Удаляет задачу из планировщика
        
        Args:
            time (datetime): Время задачи, которую нужно удалить
        """
        if time in self.tasks:
            del self.tasks[time]
            
    def schedule_daily_check(self):
        """Планирует ежедневную проверку"""
        if self.job_queue:
            self.job_queue.run_daily(self._daily_check, time=time(0, 0))
    
    def schedule_daily_update(self):
        """Планирует ежедневное обновление"""
        if self.job_queue:
            self.job_queue.run_daily(self._daily_update, time=time(0, 0))
            
    def schedule_daily_clear_inventory(self):
        """Планирует ежедневную очистку инвентаря"""
        if self.job_queue:
            self.job_queue.run_daily(self._daily_clear_inventory, time=time(0, 0))
    
    async def _daily_check(self, context):
        """Выполняет ежедневную проверку"""
        if self.mediator:
            await self.mediator.daily_check()
    
    async def _daily_update(self, context):
        """Выполняет ежедневное обновление"""
        if self.mediator:
            await self.mediator.daily_update()
            
    async def _daily_clear_inventory(self, context):
        """Выполняет ежедневную очистку инвентаря"""
        if self.inventory_manager:
            await self.inventory_manager.clear_daily_inventory()

