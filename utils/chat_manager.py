import json
import logging
import uuid
import os
import traceback
from datetime import datetime

class ChatManager:
    def __init__(self, bot=None):
        self.bot = bot
        self.chat_ids = {}
        self.data_dir = 'data'
        self.chat_ids_file = os.path.join(os.getcwd(), 'chat_ids.json')
        self.admins_file = os.path.join(os.getcwd(), 'admins_ids.json')
        self.allowed_users = set()
        self._ensure_data_directory()
        self.load_chat_ids()
        self.load_admins_ids_from_file()
        
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
                logging.info(f"Загружены chat_ids из {self.chat_ids_file}: {self.chat_ids}")
            else:
                self.chat_ids = {
                    "Словцова": "-4774890964",
                    "Баумана": "-4722230050",
                    "Свердловская": "-4641251467",
                    "Взлетка": "-4775448662",
                    "Комунальная": "-4732427913",
                    "Мате залки": "-4755479474"
                }
                logging.warning(f"Файл {self.chat_ids_file} не найден, используются значения по умолчанию")
                self.save_chat_ids_to_file()
        except Exception as e:
            logging.error(f"Ошибка при загрузке chat_ids: {e}")
            self.chat_ids = {
                "Словцова": "-4774890964",
                "Баумана": "-4722230050",
                "Свердловская": "-4641251467",
                "Взлетка": "-4775448662",
                "Комунальная": "-4732427913",
                "Мате залки": "-4755479474"
            }

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

    def load_admins_ids_from_file(self):
        """Загрузка ID администраторов из файла"""
        try:
            with open(self.admins_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Загружаем в allowed_users вместо admin_ids
                self.allowed_users = set(data.get('allowed_users', []))
                logging.info(f"Загружены allowed_users: {self.allowed_users}")
        except FileNotFoundError:
            logging.warning(f"Файл {self.admins_file} не найден")
            self.allowed_users = set()
        except json.JSONDecodeError:
            logging.error(f"Ошибка при чтении файла {self.admins_file}")
            self.allowed_users = set()
        except Exception as e:
            logging.error(f"Неожиданная ошибка при загрузке админов: {e}")
            self.allowed_users = set()

    def save_admins_ids_to_file(self, admin_ids):
        """Сохранение ID администраторов в файл"""
        try:
            data = {
                "allowed_users": list(admin_ids)
            }
            with open(self.admins_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            self.allowed_users = set(admin_ids)  # Обновляем локальный список
            logging.info(f"Сохранены allowed_users: {admin_ids}")
            return True
        except Exception as e:
            logging.error(f"Ошибка при сохранении allowed_users: {e}")
            return False

    def is_allowed_user(self, user_id: int) -> bool:
        """Проверка является ли пользователь разрешенным"""
        return user_id in self.allowed_users

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
                    logging.error(f"едопустимый chat_id: {chat_id}")
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
                # Создаем файл с пустым массивом если он не существует
                with open('events.json', 'w', encoding='utf-8') as f:
                    json.dump([], f)
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
        """��олучение имени чата по его ID"""
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

    async def send_message(self, chat_id, message):
        """Отправляет сообщение в чат через бота"""
        if not self.bot:
            logging.error("❌ Bot not initialized in ChatManager")
            return
        
        try:
            await self.bot.send_notification(chat_id, message)
        except Exception as e:
            logging.error(f"❌ Error sending message to chat {chat_id}: {e}")
            raise

    def set_chat_id(self, chat_name: str, chat_id: int):
        """Установка ID чата для заданного имени чата"""
        try:
            # Преобразуем chat_id в строку для консистентности
            chat_id_str = str(chat_id)
            
            # Доб��вляем или обновляем ID чата
            self.chat_ids[chat_name] = chat_id_str
            logging.info(f"Установлен ID чата для {chat_name}: {chat_id_str}")
            
            # Сохраняем обновленные данные в файл
            self.save_chat_ids_to_file()
            
            return True
        except Exception as e:
            logging.error(f"Ошибка при установке ID чата: {e}")
            return False

    def add_user_to_chat(self, user_id: int, chat_id: int):
        """Добавление пользователя в чат"""
        try:
            # Путь к файлу с данными о пользователях чатов
            chat_members_file = os.path.join(os.getcwd(), 'chat_members.json')
            
            # Загружаем существующие данные
            chat_members = {}
            if os.path.exists(chat_members_file):
                with open(chat_members_file, 'r', encoding='utf-8') as f:
                    chat_members = json.load(f)
            
            # Преобразуем ID в строки для консистентности
            chat_id_str = str(chat_id)
            user_id_str = str(user_id)
            
            # Инициализируем структуру для чата если её нет
            if chat_id_str not in chat_members:
                chat_members[chat_id_str] = []
            
            # Добавляем пользователя если его еще нет в чате
            if user_id_str not in chat_members[chat_id_str]:
                chat_members[chat_id_str].append(user_id_str)
                logging.info(f"Пользователь {user_id} добавлен в чат {chat_id}")
            
            # Сохраняем обновленные данные
            with open(chat_members_file, 'w', encoding='utf-8') as f:
                json.dump(chat_members, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            logging.error(f"Ошибка при добавлении пользователя в чат: {e}")
            return False