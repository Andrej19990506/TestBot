import logging
import json


class ChatManager:
    def __init__(self, mediator):
        self.chat_ids = {}
        self.selected_chats = []
        self.allowed_users = set()
        self.chat_ids_filepath = 'chat_ids.json'
        self.events_filepath = 'events.json'
        self.admins_ids_filepath = 'admins_ids.json'
        self.events = {}  # Динамическое хранилище событий
        self.load_chat_ids_from_file()
        self.load_events_from_file()
        self.load_admins_ids_from_file()
        self.chat_members = {} 
        self.chat_members_filepath = 'chat_members.json'
        self.load_chat_members_from_file()
        self.mediator = mediator
    


    
    def add_user_to_chat(self, user_id, chat_id):
        if user_id not in self.chat_members:
            self.chat_members[user_id] = set()
        self.chat_members[user_id].add(chat_id)
        self.save_chat_members_to_file()

    def get_chats_for_user(self, user_id):
        return list(self.chat_members.get(user_id, []))

    def save_chat_members_to_file(self):
        try:
            # Преобразовываем set в list для возможности сериализации в JSON
            serializable_chat_members = {str(user_id): list(chats) for user_id, chats in self.chat_members.items()}
            with open(self.chat_members_filepath, 'w', encoding='utf-8') as file:
                json.dump(serializable_chat_members, file, ensure_ascii=False, indent=4)
            logging.info("Связи членов чата сохранены в файл.")
        except Exception as e:
            logging.error(f"Ошибка при сохранении связей членов чата: {e}")

    def load_chat_members_from_file(self):
        try:
            with open(self.chat_members_filepath, 'r', encoding='utf-8') as file:
                serializable_chat_members = json.load(file)
                # Преобразуем list обратно в set
                self.chat_members = {int(user_id): set(chats) for user_id, chats in serializable_chat_members.items()}
                logging.info("Связи членов чата загружены из файла.")
        except FileNotFoundError:
            self.chat_members = {}
            logging.info("Файл chat_members.json не найден. Создаём пустой файл.")
            # Создаем пустой файл
            self.save_chat_members_to_file()
        except Exception as e:
            self.chat_members = {}
            logging.error(f"Ошибка при загрузке связей членов чата: {e}")
            
    def get_chat_name_by_id(self, chat_id):
        for name, id in self.chat_ids.items():
            if id == chat_id:
                return name
        return None
    
    def remove_chat_id(self, chat_name):
        if chat_name in self.chat_ids:
            del self.chat_ids[chat_name]  # Удаляем из словаря chat_ids
            self.selected_chats = [chat for chat in self.selected_chats if chat != chat_name]  # Удаляем из выбранных
            self.save_chat_ids_to_file()  # Сохраняем изменения
            logging.info(f"Chat ID для '{chat_name}' был удален.")
            logging.debug(f"Текущие chat_ids после удаления: {self.chat_ids}")
            logging.debug(f"Текущие selected_chats после удаления: {self.selected_chats}")
    
    def set_chat_id(self, chat_name, chat_id):
        self.chat_ids[chat_name] = chat_id  # Это сохранит ID по имени
        logging.info(f"Установлен ID {chat_id} для чата '{chat_name}'")

    def save_chat_ids_to_file(self):
        try:
            with open(self.chat_ids_filepath, 'w', encoding='utf-8') as file:  # Добавлено 'encoding='utf-8''
                json.dump(self.chat_ids, file, ensure_ascii=False)
                logging.info("Chat IDs сохранены в файл.")
                logging.debug(f"Данные, сохраненные в файл chat_ids.json: {self.chat_ids}")
        except Exception as e:
            logging.error(f"Ошибка при сохранении chat IDs: {e}")

    def save_admins_ids_to_file(self, allowed_users):
        data = {"allowed_users": list(allowed_users)}
        try:
            with open(self.admins_ids_filepath, "w", encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False, indent=4)
            logging.info("Admins IDs сохранены в файл.")
        except Exception as e:
            logging.error(f"Ошибка при сохранении admins IDs: {e}")

    def load_admins_ids_from_file(self):
        try:
            with open(self.admins_ids_filepath, 'r', encoding='utf-8') as file:
                data = json.load(file)
                self.allowed_users = set(data.get("allowed_users", []))
                logging.info("Admins IDs загружены из файла.")
        except FileNotFoundError:
            logging.info(f"Файл {self.admins_ids_filepath} не найден. Создан пустой список администраторов.")
            self.allowed_users = set()
        except Exception as e:
            logging.error(f"Ошибка при загрузке admins IDs: {e}")
            self.allowed_users = set()

    def add_user_to_admins(self, user_id):
        self.allowed_users.add(user_id)
        self.save_admins_ids_to_file(self.allowed_users)
        self.load_admins_ids_from_file()

    def load_chat_ids_from_file(self):
        try:
            with open(self.chat_ids_filepath, 'r', encoding='utf-8') as file:
                self.chat_ids = json.load(file)
                logging.info("Chat IDs загружены из файла.")
        except FileNotFoundError:
            self.chat_ids = {}
            logging.info("Файл chat_ids.json не найден. Создан пустой словарь.")
            self.save_chat_ids_to_file()
        except Exception as e:
            logging.error(f"Ошибка при загрузке chat IDs: {e}")
            self.chat_ids = {}

    def load_events_from_file(self):
        try:
            with open(self.events_filepath, 'r', encoding='utf-8') as file:
                self.events = json.load(file)
                logging.info("События загружены из файла.")
        except FileNotFoundError:
            self.events = {}
            logging.info("Файл events.json не найден. Создан пустой словарь.")
        except Exception as e:
            logging.error(f"Ошибка при загрузке событий: {e}")
            self.events = {}

    def save_events_to_file(self):
        try:
            with open(self.events_filepath, 'w', encoding='utf-8') as file:
                json.dump(self.events, file, ensure_ascii=False)
                logging.info("События сохранены в файл.")
        except Exception as e:
            logging.error(f"Ошибка при сохранении событий: {e}")

    def load_events(self, user_id):
        return self.events.get(str(user_id), [])

    def save_event(self, user_id, event):
        user_id = str(user_id)
        if user_id not in self.events:
            self.events[user_id] = []
        self.events[user_id].append(event)
        self.save_events_to_file()
        logging.info(f"Событие '{event}' добавлено для пользователя {user_id}.")

    def get_selected_chat_ids(self):
        return [self.chat_ids[chat_name] for chat_name in self.selected_chats if chat_name in self.chat_ids]

    def select_chat(self, chat_name):
        if chat_name in self.chat_ids and chat_name not in self.selected_chats:
            self.selected_chats.append(chat_name)
            logging.info(f"Чат '{chat_name}' добавлен в выбранные")

    def deselect_chat(self, chat_name):
        if chat_name in self.selected_chats:
            self.selected_chats.remove(chat_name)
            logging.info(f"Чат '{chat_name}' удален из выбранных")


