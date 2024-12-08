import json
import os

data_file_path = 'user_data.json'

# Создание файла данных, если он не существует
if not os.path.exists(data_file_path):
    with open(data_file_path, 'w') as f:
        json.dump({}, f)

def set_user_state(user_id, state):
    """Устанавливает состояние пользователя в файле."""
    with open(data_file_path, 'r') as f:
        data = json.load(f)

    data[str(user_id)] = state  # Убедимся, что user_id хранится как строка

    with open(data_file_path, 'w') as f:
        json.dump(data, f)

def get_user_state(user_id):
    """Получает состояние пользователя из файла."""
    with open(data_file_path, 'r') as f:
        data = json.load(f)
    return data.get(str(user_id), {})  # Возвращаем словарь или пустой