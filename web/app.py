from flask import Flask, render_template, request, jsonify, send_from_directory
import logging
from web.telegram_bot import TelegramBot
from flask_cors import CORS
from config import bot_token
import json
import os
from utils.scheduler import Scheduler
import asyncio
from threading import Thread
from flask_debugtoolbar import DebugToolbarExtension

# Получаем абсолютные пути
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates_dir = os.path.join(base_dir, 'web', 'templates')
static_dir = os.path.join(base_dir, 'web', 'static')

app = Flask(__name__,
    static_url_path='/static',
    static_folder='static',     # Относительный путь от web/
    template_folder='templates' # Относительный путь от web/
)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
scheduler = None  # Глобальная переменная для scheduler

EVENTS_FILE_PATH = 'events.json'
CHAT_IDS_FILE_PATH = 'chat_ids.json'

# Настройка приложения
app.debug = True  # Включаем режим отладки
app.config['SECRET_KEY'] = 'your-secret-key'  # Необходим для Debug Toolbar
toolbar = DebugToolbarExtension(app)

# Включаем автоматическую перезагрузку шаблонов
app.config['TEMPLATES_AUTO_RELOAD'] = True

def load_chat_ids():
    """Загружает список чатов из файла chat_ids.json."""
    if os.path.exists(CHAT_IDS_FILE_PATH):
        try:
            with open(CHAT_IDS_FILE_PATH, 'r', encoding='utf-8') as file:
                chat_ids = json.load(file)
                logging.info(f"Данные чатов успешно загружены: {chat_ids}")
                return chat_ids
        except json.JSONDecodeError as e:
            logging.error(f"Ошибка декодирования JSON из файла {CHAT_IDS_FILE_PATH}: {e}")
            return {}
    else:
        logging.warning(f"Файл {CHAT_IDS_FILE_PATH} не найден.")
        return {}

def load_events():
    """Загружает список событий из файла"""
    try:
        if os.path.exists(EVENTS_FILE_PATH):
            with open(EVENTS_FILE_PATH, 'r', encoding='utf-8') as file:
                events = json.load(file)
                logging.info(f"Загружено {len(events)} событий")
                return events
        logging.info("Файл событий не найден, возвращаем пустой список")
        return []
    except Exception as e:
        logging.error(f"Ошибка при загрузке событий: {e}")
        return []

def save_events(events):
    """Сохраняет список событий в файл"""
    try:
        with open(EVENTS_FILE_PATH, 'w', encoding='utf-8') as file:
            json.dump(events, file, ensure_ascii=False, indent=4)
        logging.info(f"Сохранено {len(events)} событий")
    except Exception as e:
        logging.error(f"Ошибка при сохранении событий: {e}")
        raise

def init_routes(app):
    # Регистрируем все маршруты для приложения
    
    @app.route('/')
    def home():
        try:
            return render_template('index.html')
        except Exception as e:
            logging.error(f"Error rendering index.html: {e}")
            return str(e), 500

    @app.route('/create_event', methods=['POST'])
    def create_event():
        try:
            event_data = request.json
            logging.info(f"Получены данные события: {event_data}")
            
            if not event_data:
                return jsonify({"error": "Нет данных события"}), 400
                
            required_fields = ['description', 'date', 'chat_ids', 'notifications']
            missing_fields = [field for field in required_fields if not event_data.get(field)]
            
            if missing_fields:
                return jsonify({
                    "error": f"Отсутствуют обязательные поля: {', '.join(missing_fields)}"
                }), 400

            events = load_events()
            event_data['id'] = len(events) + 1
            events.append(event_data)
            
            try:
                save_events(events)
                logging.info(f"Событие сохранено: {event_data}")
            except Exception as e:
                logging.error(f"Ошибка при сохранении события: {e}")
                return jsonify({"error": "Ошибка при сохранении события"}), 500

            if scheduler:
                try:
                    def schedule_task():
                        asyncio.run(scheduler.schedule_notifications(event_data))
                    
                    Thread(target=schedule_task).start()
                    logging.info("Уведомления запланированы")
                except Exception as e:
                    logging.error(f"Ошибка при планировании уведомлений: {e}")

            return jsonify({
                "message": "Событие создано успешно",
                "event": event_data
            }), 201

        except Exception as e:
            logging.error(f"Критическая ошибка при создании события: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route('/get_chats', methods=['GET'])
    def get_chats():
        try:
            chat_ids = load_chat_ids()
            chat_names = {str(chat_id): name for name, chat_id in chat_ids.items()}
            return jsonify(chat_names), 200
        except Exception as e:
            logging.error(f"Ошибка при получении списка чатов: {e}")
            return jsonify({'error': 'Ошибка при получении списка чатов'}), 500

    @app.route('/get_events', methods=['GET'])
    def get_events():
        logging.info("Запрос получен на /get_events")
        events = load_events()
        return jsonify(events), 200

    @app.route('/delete_event/<int:event_id>', methods=['DELETE'])
    def delete_event(event_id):
        try:
            logging.info(f"Получен запрос на удаление события с ID: {event_id}")
            
            events = load_events()
            logging.info(f"Загруженные события до удаления: {events}")
            
            # Проверяем формат ID в событиях
            logging.info(f"Типы ID событий: {[type(event.get('id')) for event in events]}")
            logging.info(f"ID событий: {[event.get('id') for event in events]}")
            
            # Находим событие для удаления
            event_to_delete = next((event for event in events if event.get('id') == event_id), None)
            logging.info(f"Найденное событие для удаления: {event_to_delete}")
            
            if event_to_delete:
                events.remove(event_to_delete)
                logging.info(f"События после удаления: {events}")
                
                save_events(events)
                logging.info(f"Событие с ID {event_id} успешно удалено")
                return jsonify({
                    'success': True,
                    'message': f'Событие с ID {event_id} успешно удалено'
                }), 200
            else:
                logging.warning(f"Событие с ID {event_id} не найдено")
                return jsonify({
                    'success': False,
                    'error': 'Событие не найдено'
                }), 404
                
        except Exception as e:
            logging.error(f"Ошибка при удалении события: {e}", exc_info=True)
            return jsonify({
                'success': False,
                'error': f'Ошибка при удалении события: {str(e)}'
            }), 500

@app.route('/events/<int:event_id>/notifications', methods=['PUT'])
def update_event_notifications(event_id):
    try:
        logging.info(f"Получен запрос на обновление уведомлений для события {event_id}")
        data = request.json
        logging.info(f"Полученные данные: {data}")
        
        events = load_events()
        logging.info(f"Загружено событий: {len(events)}")
        
        # Находим нужное событие
        event = next((event for event in events if event.get('id') == event_id), None)
        if not event:
            logging.warning(f"Событие {event_id} не найдено")
            return jsonify({
                'success': False, 
                'message': 'Событие не найдено'
            }), 404
            
        # Проверяем данные уведомлений
        notifications = data.get('notifications', [])
        if not isinstance(notifications, list):
            return jsonify({
                'success': False,
                'message': 'Неверный формат уведомлений'
            }), 400

        # Обновляем уведомления
        event['notifications'] = notifications
        
        # Сохраняем изменения
        save_events(events)
        logging.info(f"События сохранены. Уведомления обновлены для события {event_id}")
        
        # Перепланируем уведомления
        if scheduler:
            def schedule_task():
                asyncio.run(scheduler.schedule_notifications(event))
            Thread(target=schedule_task).start()
            logging.info("Уведомления запланированы")
            
        return jsonify({
            'success': True, 
            'message': 'Уведомления обновлены'
        }), 200
        
    except Exception as e:
        logging.error(f"Ошибка при обновлении уведомлений: {e}", exc_info=True)
        return jsonify({
            'success': False, 
            'message': str(e)
        }), 500

# Обработчики ошибок
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested URL was not found on the server.'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': str(error)
    }), 500

# Логирование запросов
@app.before_request
def log_request_info():
    logging.info('Path: %s', request.path)
    logging.info('Template Folder: %s', app.template_folder)
    logging.info('Static Folder: %s', app.static_folder)

def init_app_with_scheduler(scheduler_instance):
    """Инициализирует Flask приложение с планировщиком"""
    global scheduler
    scheduler = scheduler_instance
