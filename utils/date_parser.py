import logging
import re
from datetime import datetime



def parse_event_input(input_text):
    logging.debug(f"Входные данные для парсинга: {input_text}")
    current_date = datetime.now()
    current_year = current_date.year

    # Регулярное выражение для формата 'день.месяц часы:минуты' и 'день часы:минуты'
    match = re.match(r'(\d{1,2})(?:\.(\d{1,2}))? (\d{1,2}:\d{2})', input_text)
    if not match:
        logging.error("Ошибка: Неверный формат ввода.")
        raise ValueError("Неверный формат ввода. Используйте: DD или DD.MM HH:MM описание.")

    # Извлечение части строки, соответствующей дате и времени
    day, month, time_str = match.groups()
    month = int(month) if month else current_date.month

    logging.debug(f"День: {day}, Месяц: {month}, Время: {time_str}")

    try:
        # Форматирование даты
        date_str = f"{current_year}-{month:02d}-{int(day):02d}"
    except ValueError:
        logging.error("Ошибка: Неверный формат даты.")
        raise ValueError("Неверный формат даты.")

    # Извлечение описания
    remaining_text = input_text[match.end():].strip()
    if not remaining_text:
        logging.error("Ошибка: Описание события не может быть пустым.")
        raise ValueError("Описание не может быть пустым.")

    
    parsed_data = {
        'date_str': date_str,
        'time_str': time_str,
        'description': remaining_text
    }
    
    logging.debug(f"Успешно распарсенные данные: {parsed_data}")

    return parsed_data

def calculate_delay(event_datetime_str):
    event_datetime = datetime.strptime(event_datetime_str, '%Y-%m-%d %H:%M')
    current_datetime = datetime.now()
    delay = (event_datetime - current_datetime).total_seconds()
    logging.debug(f"Текущее время: {current_datetime}, Время события: {event_datetime}, Вычисленная задержка: {delay} сек.")
    if delay < 0:
        logging.error("Ошибка: Время события должно быть в будущем.")
        raise ValueError("Время события должно быть в будущем.")
    return delay