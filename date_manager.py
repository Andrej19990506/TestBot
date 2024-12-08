import json
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
import os
from datetime import datetime
from utils.mediator import Mediator
import logging

import json
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
import os
from datetime import datetime
from utils.mediator import Mediator
import logging

def json_to_excel(inventory_data, excel_file_path, branch_name):
    # Логируем имя филиала
    logging.info(f"Получено имя филиала: {branch_name}")

    # Создаем новый Excel файл
    workbook = Workbook()
    sheet = workbook.active

    sheet.merge_cells('A1:D1')  # Объединяем ячейки A1, B1, C1 и D1
    sheet["A1"] = "Инвентаризация продуктов"  # Устанавливаем заголовок
    sheet["A1"].font = Font(bold=True)  # Устанавливаем жирный шрифт
    sheet["A1"].alignment = Alignment(horizontal="center")

    # Добавляем подзаголовки и форматируем их
    sheet["A2"] = f"Филиал: {branch_name}"

    # Форматируем дату и время на одной строке с курсивным шрифтом
    now = datetime.now()
    date_str = f"Дата: {now.strftime('%Y-%m-%d')}"
    time_str = f"Время: {now.strftime('%H:%M:%S')}"

    # Записываем дату в ячейку A3
    sheet["A3"] = date_str
    sheet["A3"].font = Font(italic=True)

    # Записываем время в ячейку A4
    sheet["A4"] = time_str
    sheet["A4"].font = Font(italic=True)

    # Устанавливаем заголовки и данные
    sheet["A8"] = "Категория"
    sheet["B8"] = "Товар"
    sheet["C8"] = "Кол-во сырья"
    sheet["D8"] = "Кол-во пол-ф-ов"

    # Установка ширины столбцов
    sheet.column_dimensions["A"].width = 34
    sheet.column_dimensions["B"].width = 27
    sheet.column_dimensions["C"].width = 14
    sheet.column_dimensions["D"].width = 15

    # Центрируем заголовки столбцов
    for col in ['A', 'B', 'C', 'D']:
        sheet[f"{col}8"].alignment = Alignment(horizontal="center")

    row = 9  # Начинаем с 9-ой строки для товаров
    for category, items in inventory_data.items():
        for item, details in items.items():
            raw_quantity = details.get('raw', {}).get('quantity', 0)
            semi_quantity = details.get('semi', {}).get('quantity', 0)

            if (raw_quantity is not None and raw_quantity > 0) or (semi_quantity is not None and semi_quantity > 0):
                sheet[f"A{row}"] = category
                sheet[f"B{row}"] = item
                sheet[f"C{row}"] = raw_quantity
                sheet[f"D{row}"] = semi_quantity
                row += 1

    # Сохраняем файл
    workbook.save(excel_file_path)
    logging.info(f"Данные успешно сохранены в {excel_file_path}")




def get_inventory_template():
    with open('inventory_template.json', 'r', encoding='utf-8') as file:
        inventory_template = json.load(file)
    return inventory_template

def load_inventory_data(inventory_file_path, template_file_path):
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

def load_template(template_file_path):
    """Загружает шаблонный инвентарь отдельно."""
    try:
        with open(template_file_path, 'r', encoding='utf-8') as template_file:
            data = json.load(template_file)
            logging.info(f"Шаблон инвентаризации загружен из {template_file_path}.")
            return data
    except (json.JSONDecodeError, IOError) as e:
        logging.error(f"Ошибка при загрузке шаблона инвентаризации: {e}")
        return {}

def save_inventory_to_json(self, inventory_file):
    try:
        with open(inventory_file, 'w', encoding='utf-8') as f:
            json.dump(self.inventories, f, ensure_ascii=False, indent=4)
        logging.info("Инвентаризация успешно сохранена в файл.")
    except Exception as e:
        logging.error(f"Ошибка при сохранении инвентаризации: {e}")


# Пример использования
inventory_file = "inventory.json"
json_file_path = "inventory_template.json"  # Путь к вашему JSON-файлу
excel_file_path = "output/inventory.xlsx"  # Путь для сохранения Excel-файла
chat_id = "12345"  # Здесь должен быть идентификатор чата, для которого требуется сохранить данные

# Создайте директорию, если она не существует
os.makedirs(os.path.dirname(excel_file_path), exist_ok=True)

# Читаем данные из JSON файла
with open(json_file_path, 'r', encoding='utf-8') as f:
    inventory_data = json.load(f)

mediator = Mediator()  # Убедитесь, что вы используете уже инициализированный экземпляр
chat_manager = mediator.chat_manager

# Получаем имя филиала
branch_name = mediator.get_chat_name_by_id(chat_id)
if not branch_name:
    logging.warning(f"Имя филиала для chat_id {chat_id} не найдено, устанавливается значение по умолчанию.")
    branch_name = f"Chat_{chat_id}"

# Вызываем json_to_excel, передавая branch_name напрямую
json_to_excel(inventory_data, excel_file_path, branch_name)
