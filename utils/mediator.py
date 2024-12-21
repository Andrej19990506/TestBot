import json
import os
import logging
import copy
from utils.chat_manager import ChatManager  # Обновляем если используется

class Mediator:
    def __init__(self, inventory_file_path="inventory.json"):  # Задаем путь по умолчанию
        self.inventory_manager = None
        self.message_handler = None
        self.scheduler = None
        self.chat_manager = None
        self.date_manager = None
        self.inventory_file_path = inventory_file_path  # Хранение пути к файлу инвентаризации

    def register_date_manager(self, date_manager):
        self.date_manager = date_manager

    def register_inventory_manager(self, inventory_manager):
        self.inventory_manager = inventory_manager

    def register_message_handler(self, message_handler):
        self.message_handler = message_handler

    def register_scheduler(self, scheduler):
        self.scheduler = scheduler

    def register_chat_manager(self, chat_manager):
        self.chat_manager = chat_manager

    def notify_inventory_update(self):
        if self.inventory_manager:
            self.inventory_manager.update_status()

    def handle_message(self, message):
        if self.message_handler:
            self.message_handler.process_message(message)

    def get_chat_name_by_id(self, chat_id):
        if self.chat_manager:
            return self.chat_manager.get_chat_name_by_id(chat_id)
        else:
            return None
        
    def get_chats_for_user(self, user_id):
        if self.chat_manager:
            return self.chat_manager.get_chats_for_user(user_id)
        else:
            return None

    def get_inventory_file_path(self):
        """Возвращает путь к файлу инвентаризации."""
        return self.inventory_file_path
    
    def load_inventory_data(self, inventory_file_path, template_file_path):
        """
        Загружает данные инвентаризации из файла JSON.
        Если файл пустой или отсутствует, загружает данные из шаблона.
        
        :param inventory_file_path: Путь к файлу с основной инвентаризацией.
        :param template_file_path: Путь к файлу-шаблону инвентаризации.
        :return: Данные инвентаризации в виде словаря.
        """
        data = {}
        try:
            if os.path.exists(inventory_file_path):
                with open(inventory_file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data:  # Проверка, пустой или нет
                        logging.info(f"Данные загружены из {inventory_file_path}.")
                        return data
                    else:
                        logging.info(f"Файл {inventory_file_path} пуст.")
            else:
                logging.info(f"Файл {inventory_file_path} не найден.")

            # Если основной JSON пустой или отсутствует, загружаем шаблон
            with open(template_file_path, 'r', encoding='utf-8') as template_file:
                data = json.load(template_file)
                logging.info(f"Данные загружены из {template_file_path}.")

        except json.JSONDecodeError:
            logging.error("Ошибка в формате JSON.")
        except IOError as e:
            logging.error(f"Ошибка при работе с файлами: {e}")

        return data
    
    def load_template(self, template_file_path):
        """Загружает шаблонный инвентарь отде��ьно."""
        try:
            with open(template_file_path, 'r', encoding='utf-8') as template_file:
                data = json.load(template_file)
                logging.info(f"Шаблон инвентаризации загружен из {template_file_path}.")
                return data
        except (json.JSONDecodeError, IOError) as e:
            logging.error(f"Ошибка при загрузке шаблона инвентаризации: {e}")
            return {}

    def remove_duplicates(self, data):
        """Удаляет дубликаты в значениях, если это возможно."""
        for key, value in data.items():
            if isinstance(value, list):
                data[key] = list(set(value))
            elif isinstance(value, dict):
                self.remove_duplicates(value)

    def save_inventory_to_json(self, inventories, inventory_file):
        """Сохраняет инвентаризацию в указанный файл."""
        try:
            sanitized_inventories = copy.deepcopy(inventories)

            # Удаляем дубликаты внутри инвентарей
            self.remove_duplicates(sanitized_inventories)
            
            with open(inventory_file, 'w', encoding='utf-8') as f:
                json.dump(sanitized_inventories, f, ensure_ascii=False, indent=4)
            
            logging.info("Инвентаризация успешно сохранена в файл.")
        except Exception as e:
            logging.error(f"Ошибка при сохранении инвентаризации: {e}")
