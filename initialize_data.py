import json
import os
import logging

def initialize_data_files():
    """Инициализация необходимых файлов с данными"""
    data_dir = 'data'
    os.makedirs(data_dir, exist_ok=True)

    # Инициализируем chat_ids.json с тестовыми данными
    chat_ids_path = os.path.join(data_dir, 'chat_ids.json')
    if not os.path.exists(chat_ids_path):
        test_chats = {
            "Словцова": -4774890964,
            "Баумана": -4722230050,
            "Свердловская": -4641251467,
            "Взлетка": -4775448662,
            "Комунальная": -4732427913,
            "Мате залки": -4755479474
        }
        with open(chat_ids_path, 'w', encoding='utf-8') as f:
            json.dump(test_chats, f, ensure_ascii=False, indent=4)
        logging.info(f"Создан файл {chat_ids_path} с тестовыми данными")

    # Инициализация других файлов
    files_to_initialize = {
        'events.json': {},
        'admins.json': {"allowed_users": []},
        'chat_members.json': {},
        'inventory.json': {
            "raw_materials": {},
            "semi_finished": {}
        }
    }

    for filename, default_data in files_to_initialize.items():
        file_path = os.path.join(data_dir, filename)
        
        if not os.path.exists(file_path):
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, ensure_ascii=False, indent=4)
                logging.info(f"Создан файл {filename} с начальными данными")
            except Exception as e:
                logging.error(f"Ошибка при создании файла {filename}: {e}")