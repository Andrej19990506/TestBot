import logging
from datetime import datetime, timedelta
import pytz
import json
import argparse
import os

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Путь к файлу событий
EVENTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'events.json')

def load_events():
    try:
        with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def should_send_notification(event, current_time):
    logging.info(f"\nПроверка уведомлений для события: {event['description']}")
    
    # Получаем базовое время события
    base_event_time = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
    base_event_time = pytz.timezone('Europe/Moscow').localize(base_event_time)
    
    # Для повторяющихся событий корректируем время события
    if event.get('repeat', {}).get('type') == 'monthly':
        # Создаем время события для текущего месяца
        event_time = current_time.replace(
            day=base_event_time.day,
            hour=base_event_time.hour,
            minute=base_event_time.minute
        )
    else:
        event_time = base_event_time
    
    for notification in event.get('notifications', []):
        minutes = notification.get('time', 0)
        notification_time = event_time - timedelta(minutes=minutes)
        
        logging.info(f"Настройки уведомления:")
        logging.info(f"- За {minutes} минут до события")
        logging.info(f"- Базовое время события: {base_event_time}")
        logging.info(f"- Скорректированное время события: {event_time}")
        logging.info(f"- Время уведомления: {notification_time}")
        logging.info(f"- Текущее время: {current_time}")
        
        time_diff = (notification_time - current_time).total_seconds() / 60
        logging.info(f"- Разница в минутах: {time_diff}")
        
        if 0 <= time_diff <= 1:
            return True, notification['message']
            
    return False, None

def check_recurring_event(event, current_time):
    event_time = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
    repeat = event.get('repeat', {})
    repeat_type = repeat.get('type')

    logging.info(f"Проверка повторяющегося события:")
    logging.info(f"- Тип повторения: {repeat_type}")
    logging.info(f"- Текущее время: {current_time}")
    logging.info(f"- Время события: {event_time}")

    if repeat_type == 'monthly':
        month_day = repeat.get('monthDay')
        logging.info(f"- День месяца: {month_day}")
        logging.info(f"- Текущий день: {current_time.day}")
        
        if month_day and current_time.day == month_day:
            if (current_time.hour == event_time.hour and 
                abs(current_time.minute - event_time.minute) <= 1):
                return True
    
    return False

def test_scheduler_with_time(test_time_str):
    events = load_events()
    test_time = datetime.strptime(test_time_str, '%Y-%m-%d %H:%M')
    test_time = pytz.timezone('Europe/Moscow').localize(test_time)
    
    logging.info(f"Тестирование для времени: {test_time}")
    
    for event in events:
        try:
            event_time = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
            event_time = pytz.timezone('Europe/Moscow').localize(event_time)
            
            is_recurring = check_recurring_event(event, test_time)
            should_notify, message = should_send_notification(event, test_time)
            
            if is_recurring:
                logging.info(f"[ТЕСТ] Сработало повторяющееся событие: {event['description']}")
                logging.info(f"Тип повторения: {event['repeat']['type']}")
                logging.info(f"Параметры повторения: {event['repeat']}")
                
            if should_notify:
                logging.info(f"[ТЕСТ] Должно быть отправлено уведомление для события: {event['description']}")
                logging.info(f"Сообщение уведомления: {message}")
                
        except Exception as e:
            logging.error(f"Ошибка при тестировании события: {e}")
            continue
            
    logging.info("Тестирование завершено")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Тестирование планировщика событий')
    parser.add_argument('--time', type=str, help='Время для тестирования (формат: YYYY-MM-DD HH:MM)')
    parser.add_argument('--all', action='store_true', help='Запустить все тестовые сценарии')
    
    args = parser.parse_args()
    
    if args.time:
        print(f"\nТестирование для {args.time}")
        test_scheduler_with_time(args.time)
    elif args.all:
        test_times = [
            '2025-01-09 10:22',  # За день до события
            '2025-01-10 10:22',  # Время события
            '2025-02-10 10:22',  # Следующий месяц (для monthly)
        ]
        for test_time in test_times:
            print(f"\nТестирование для {test_time}")
            test_scheduler_with_time(test_time) 