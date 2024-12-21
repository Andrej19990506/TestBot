import json
import logging
import uuid
import os
import traceback

class ChatManager:
    def __init__(self, mediator=None):
        self.mediator = mediator
        self.chat_ids = {}
        self.data_dir = 'data'
        self.chat_ids_file = os.path.join(self.data_dir, 'chat_ids.json')
        self.admins_file = os.path.join(self.data_dir, 'admins.json')
        self._ensure_data_directory()
        self.load_chat_ids()
        
    def _ensure_data_directory(self):
            """Создание директории для данных если она не существует"""
            try:
                os.makedirs(self.data_dir, exist_ok=True)
                logging.info(f"Директория {self.data_dir} проверена/создана")
            except Exception as e:
                logging.error(f"Ошибка при создании директории: {e}")
    def load_chat_ids(self):
        """Загрузка chat_ids из файла"""
        try:
            if os.path.exists(self.chat_ids_file):
                with open(self.chat_ids_file, 'r', encoding='utf-8') as f:
                    self.chat_ids = json.load(f)
                logging.info(f"Загружены chat_ids: {self.chat_ids}")
            else:
                self.chat_ids = {}
                self.save_chat_ids_to_file()
        except Exception as e:
            logging.error(f"Ошибка при загрузке chat_ids: {e}")
            self.chat_ids = {}

    def save_chat_ids_to_file(self):
        """Сохранение chat_ids в файл"""
        try:
            self._ensure_data_directory()  # Проверяем наличие директории
            with open(self.chat_ids_file, 'w', encoding='utf-8') as f:
                json.dump(self.chat_ids, f, indent=2, ensure_ascii=False)
            logging.info(f"Сохранены chat_ids: {self.chat_ids}")
            return True
        except Exception as e:
            logging.error(f"Ошибка при сохранении chat_ids: {e}\n{traceback.format_exc()}")
            return False

    def save_admins_ids_to_file(self, admin_ids):
        """Сохранение ID администраторов в файл"""
        try:
            self._ensure_data_directory()  # Проверяем наличие директории
            with open(self.admins_file, 'w', encoding='utf-8') as f:
                json.dump(list(admin_ids), f, indent=2, ensure_ascii=False)
            logging.info(f"Сохранены admin_ids: {admin_ids}")
            return True
        except Exception as e:
            logging.error(f"Ошибка при сохранении admin_ids: {e}\n{traceback.format_exc()}")
            return False

    def add_event(self, event_data):
        """Добавление нового события"""
        try:
            # Проверяем существование файла
            if not os.path.exists('events.json'):
                with open('events.json', 'w', encoding='utf-8') as f:
                    json.dump([], f)
            
            # Проверяем и форматируем данные события
            if not isinstance(event_data, dict):
                logging.error("event_data должен быть словарем")
                return False
            
            # Проверяем обязательные поля
            required_fields = ['description', 'date', 'chat_ids']
            for field in required_fields:
                if field not in event_data:
                    logging.error(f"Отсутствует обязательное поле: {field}")
                    return False

            # Убеждаемся, что chat_ids это список строк
            if not isinstance(event_data['chat_ids'], list):
                logging.error("chat_ids должен быть списком")
                return False
            
            # Проверяем валидность chat_ids
            for chat_id in event_data['chat_ids']:
                if str(chat_id) not in [str(id) for id in self.chat_ids.values()]:
                    logging.error(f"Недопустимый chat_id: {chat_id}")
                    return False
            
            # Преобразуем все chat_ids в строки
            event_data['chat_ids'] = [str(chat_id) for chat_id in event_data['chat_ids']]
            
            # Добавляем id события
            event_data['id'] = str(uuid.uuid4())
            
            # Загружаем существующие события
            events = self.get_events()
            if not isinstance(events, list):
                events = []
            
            # Добавляем новое событие
            events.append(event_data)
            
            # Сохраняем обновленный список событий
            if self.save_events(events):
                logging.info(f"Событие успешно добавлено: {event_data}")
                return True
            else:
                logging.error("Не удалось сохранить событие")
                return False
            
        except Exception as e:
            logging.error(f"Ошибка при добавлении события: {e}\n{traceback.format_exc()}")
            return False

    def get_events(self):
        """Получение всех событий"""
        try:
            if not os.path.exists('events.json'):
                return []
            
            with open('events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
            
            if not isinstance(events, list):
                logging.warning("Файл events.json содержит некорректные данные")
                return []
            
            return events
        except Exception as e:
            logging.error(f"Ошибка при получении событий: {e}")
            return []

    def save_events(self, events):
        """Сохранение событий в файл"""
        try:
            with open('events.json', 'w', encoding='utf-8') as f:
                json.dump(events, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            logging.error(f"Ошибка при сохранении событий: {e}")
            return False

    def get_chat_name(self, chat_id):
        """Получение имени чата по его ID"""
        chat_id_str = str(chat_id)
        for name, id in self.chat_ids.items():
            if str(id) == chat_id_str:
                return name
        return None

    def get_chats_data(self):
        """Получение данных всех чатов"""
        return {
            str(chat_id): {
                'title': chat_name,
                'id': str(chat_id)
            }
            for chat_name, chat_id in self.chat_ids.items()
        }