import logging
import asyncio
import threading
import atexit
from datetime import datetime, timedelta
import pytz

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

from flask import Blueprint, request, jsonify, send_from_directory, current_app, send_file
from flask_cors import CORS
import os
from web.telegram_bot import TelegramBot
from config import bot_token
from datetime import datetime
import globals
import traceback
from utils.chat_manager import ChatManager
from pathlib import Path
import json
import uuid
from utils.scheduler import Scheduler

# Изменим определение build_path
current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
build_path = current_dir / 'createEvent' / 'create-event' / 'build'

# Добавим отладочный вывод при запуске
logging.info(f"Current directory: {os.getcwd()}")
logging.info(f"Build path: {build_path}")
logging.info(f"Build exists: {os.path.exists(build_path)}")
logging.info(f"Directory contents: {os.listdir(current_dir)}")

# Создаем Blueprint
bp = Blueprint('main', __name__)
bp.build_path = build_path

# Настраиваем CORS для всего приложения
CORS(bp, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Инициализация бота
bot = TelegramBot(bot_token)

# Используем глобальный scheduler вместо создания нового
scheduler = globals.scheduler

# Функция для запуска scheduler в отдельном потоке
def run_scheduler():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(globals.scheduler.start())
    except Exception as e:
        logging.error(f"❌ Scheduler error: {e}")
        logging.error(traceback.format_exc())
    finally:
        loop.close()

# Запускаем scheduler в отдельном потоке при старте приложения
scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

# Добавляем обработчик завершения
async def cleanup():
    """Очистка при завершении работы"""
    try:
        logging.info("🛑 Server shutting down...")
        await globals.scheduler.stop()
    except Exception as e:
        logging.error(f"❌ Error during cleanup: {str(e)}")

def sync_cleanup():
    """Синхронная обертка для асинхронной функции cleanup"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(cleanup())
    except Exception as e:
        logging.error(f"❌ Error in sync_cleanup: {str(e)}")
    finally:
        loop.close()

atexit.register(sync_cleanup)

@bp.before_request
def before_request():
    # Логируем все запросы
    logging.info(f"Request: {request.method} {request.path}")
    logging.info(f"Headers: {dict(request.headers)}")

# API маршруты должны быть первыми
@bp.route('/api/chats', methods=['GET'])
def get_chats():
    try:
        globals.chat_manager.load_chat_ids()
        chats = globals.chat_manager.chat_ids
        
        if not chats:
            with open('chat_ids.json', 'r', encoding='utf-8') as f:
                chats = json.load(f)
            
        formatted_chats = {name: str(chat_id) for name, chat_id in chats.items()}
        return jsonify(formatted_chats)
        
    except Exception as e:
        logging.error(f"Error getting chats: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/events', methods=['GET'])
def get_events():
    try:
        logging.info("Getting events from /api/events")
        events = globals.chat_manager.get_events()
        if not isinstance(events, list):
            try:
                with open('events.json', 'r', encoding='utf-8') as f:
                    events = json.load(f)
            except FileNotFoundError:
                events = []
                
        logging.info(f"Returning events: {events}")
        response = jsonify(events)
        response.headers.update({
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        })
        return response
    except Exception as e:
        logging.error(f"Error getting events: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/events', methods=['POST'])
def create_event():
    try:
        data = request.json
        
        # Получаем дату из запроса
        event_date = datetime.strptime(data['date'], '%Y-%m-%d %H:%M')
        
        # Устанавливаем часовой пояс Красноярска
        krasnoyarsk_tz = pytz.timezone('Asia/Krasnoyarsk')
        event_date = krasnoyarsk_tz.localize(event_date)
        
        # Текущее время тоже приводим к часовому поясу Красноярска
        now = datetime.now(krasnoyarsk_tz)
        
        # Теперь можно безопасно сравнивать даты
        if event_date < now:
            return jsonify({'error': 'Date cannot be in the past'}), 400

        # Получаем все даты для повторяющихся событий
        event_dates = scheduler.get_repeat_dates(data)
        
        # Для каждой даты создаем уведомления
        for event_date in event_dates:
            notifications = data.get('notifications', [])
            for notification in notifications:
                notification_time = event_date - timedelta(minutes=notification['time'])
                
                task_data = {
                    'message': notification['message'],
                    'scheduled_at': datetime.now(scheduler.timezone).isoformat()
                }
                
                scheduler.schedule_notification(
                    notification_time=notification_time,
                    chat_names=data['chat_ids'],
                    task_data=task_data
                )

        # Загружаем существующие события
        try:
            with open('events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
        except FileNotFoundError:
            events = []

        # Добавляем ID и статус планирования
        data['id'] = str(uuid.uuid4())
        data['scheduling_status'] = {
            'active': True,
            'last_check': datetime.now().isoformat()
        }
        
        # Добавляем тип повтора, если его нет
        if 'repeat' not in data:
            data['repeat'] = {
                'type': 'none',
                'weekdays': [],
                'monthDay': None
            }
        
        events.append(data)

        # Сохраняем обновленный список событий
        with open('events.json', 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=2)

        # Создаем один event loop для всех операций
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Обработка уведомлений
            notifications = data.get('notifications', [])
            tasks = []
            
            for notification in notifications:
                notification_time = event_date - timedelta(minutes=notification['time'])
                
                # Создаем task_data с сообщением из notification
                task_data = {
                    'message': notification['message'],  # Берем текст из notification
                    'scheduled_at': datetime.now(scheduler.timezone).isoformat()
                }
                
                # Добавляем задачу в список
                tasks.append(
                    scheduler.schedule_notification(
                        notification_time=notification_time,
                        chat_names=data['chat_ids'],
                        task_data=task_data
                    )
                )
            
            # Выполняем все задачи
            loop.run_until_complete(asyncio.gather(*tasks))
            
        finally:
            loop.close()
            
        return jsonify({'status': 'success'}), 201
        
    except Exception as e:
        logging.error(f"Error creating event: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/health')
def api_health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Маршрут для статических файлов
@bp.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(build_path, 'static'), filename)

@bp.route('/debug-paths')
def debug_paths():
    """Мршрут для отладки путей"""
    try:
        return jsonify({
            'current_dir': current_dir,
            'build_path': build_path,
            'build_exists': os.path.exists(build_path),
            'build_contents': os.listdir(build_path) if os.path.exists(build_path) else [],
            'static_path': os.path.join(build_path, 'static'),
            'static_exists': os.path.exists(os.path.join(build_path, 'static')),
            'static_contents': os.listdir(os.path.join(build_path, 'static')) if os.path.exists(os.path.join(build_path, 'static')) else [],
            'working_directory': os.getcwd(),
            'absolute_build_path': os.path.abspath(build_path)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/debug-static-contents')
def debug_static_contents():
    try:
        static_dir = Path(build_path) / 'static'
        js_dir = static_dir / 'js'
        css_dir = static_dir / 'css'
        
        # Добавим больше информации ля отладки
        return jsonify({
            'js_files': os.listdir(js_dir) if js_dir.exists() else [],
            'css_files': os.listdir(css_dir) if css_dir.exists() else [],
            'js_dir_exists': js_dir.exists(),
            'css_dir_exists': css_dir.exists(),
            'js_dir_path': str(js_dir),
            'css_dir_path': str(css_dir),
            'static_dir_contents': os.listdir(static_dir) if static_dir.exists() else []
        })
    except Exception as e:
        logging.error(f"Debug static contents error: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/test-static')
def test_static():
    try:
        # Поверяем все пути
        result = {
            'current_dir': str(current_dir),
            'build_path': str(build_path),
            'build_exists': os.path.exists(build_path),
            'static_path': str(Path(build_path) / 'static'),
            'static_exists': os.path.exists(Path(build_path) / 'static'),
        }
        
        # Поверяем js файлы
        js_dir = Path(build_path) / 'static' / 'js'
        if js_dir.exists():
            result['js_files'] = os.listdir(js_dir)
            result['js_main_exists'] = os.path.exists(js_dir / 'main.5599eb16.js')
            
        # Проверяем css файлы
        css_dir = Path(build_path) / 'static' / 'css'
        if css_dir.exists():
            result['css_files'] = os.listdir(css_dir)
            result['css_main_exists'] = os.path.exists(css_dir / 'main.8d45e0e9.css')
            
        # Проверяем структуру build директории
        if os.path.exists(build_path):
            result['build_contents'] = os.listdir(build_path)
            static_path = Path(build_path) / 'static'
            if static_path.exists():
                result['static_contents'] = os.listdir(static_path)
                
        return jsonify(result)
    except Exception as e:
        logging.error(f"Test static error: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/check-file/<path:filename>')
def check_file(filename):
    try:
        # Проверяем конкртный файл
        static_dir = os.path.join(str(build_path), 'static')
        file_path = os.path.join(static_dir, filename)
        
        return jsonify({
            'filename': filename,
            'file_path': file_path,
            'exists': os.path.exists(file_path),
            'is_file': os.path.isfile(file_path) if os.path.exists(file_path) else False,
            'size': os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            'directory_contents': os.listdir(os.path.dirname(file_path)) if os.path.exists(os.path.dirname(file_path)) else []
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/debug-file/<path:filename>')
def debug_file(filename):
    try:
        static_dir = os.path.join(build_path, 'static')
        file_path = os.path.join(static_dir, filename)
        
        return jsonify({
            'filename': filename,
            'static_dir': static_dir,
            'file_path': file_path,
            'exists': os.path.exists(file_path),
            'is_file': os.path.isfile(file_path),
            'static_dir_exists': os.path.exists(static_dir),
            'static_contents': os.listdir(static_dir) if os.path.exists(static_dir) else [],
            'parent_dir': os.path.dirname(file_path),
            'parent_contents': os.listdir(os.path.dirname(file_path)) if os.path.exists(os.path.dirname(file_path)) else []
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Общий маршрут для React должен быть последним и не должен перехватывать API запросы
@bp.route('/', defaults={'path': ''})
@bp.route('/<path:path>')
def serve_react(path):
    # Не обрабатываем API запросы здесь
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
        
    # Для всех остальных запросов возвращаем React приложение
    return send_from_directory(build_path, 'index.html')

@bp.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        # Загружаем существующие события
        try:
            with open('events.json', 'r', encoding='utf-8') as f:
                events = json.load(f)
        except FileNotFoundError:
            events = []

        # Находим событие перед удалением
        event = next((e for e in events if e.get('id') == event_id), None)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        # Создаем event loop для асинхронной о��ерации
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Получаем время уведомления и конвертируем в timezone-aware
            notification_time = datetime.strptime(event['date'], '%Y-%m-%d %H:%M')
            krasnoyarsk_tz = pytz.timezone('Asia/Krasnoyarsk')
            notification_time = krasnoyarsk_tz.localize(notification_time)
            
            # Проверяем тип события (с повтором или без)
            repeat_type = event.get('repeat', {}).get('type', 'none')
            
            if repeat_type == 'none':
                # Для обычного события просто отменяем одно уведомление
                logging.info(f"Cancelling single notification for event {event_id}")
                for chat_id in event['chat_ids']:
                    loop.run_until_complete(
                        scheduler.cancel_notification(notification_time, chat_id)
                    )
            else:
                # Для повторяющихся событий отменяем все будущие уведомления
                logging.info(f"Cancelling repeating notifications for event {event_id} (type: {repeat_type})")
                
                # Получаем все будущие даты уведомлений
                future_dates = []
                if repeat_type == 'daily':
                    future_dates = scheduler.get_daily_dates(notification_time)
                elif repeat_type == 'weekly':
                    future_dates = scheduler.get_weekly_dates(notification_time, event['repeat']['weekdays'])
                elif repeat_type == 'monthly':
                    future_dates = scheduler.get_monthly_dates(notification_time, event['repeat']['monthDay'])
                
                # Отменяем уведомления для всех дат
                for date in future_dates:
                    for chat_id in event['chat_ids']:
                        loop.run_until_complete(
                            scheduler.cancel_notification(date, chat_id)
                        )
                logging.info(f"Cancelled {len(future_dates)} future notifications")

        finally:
            loop.close()

        # Удаляем событие из списка
        events = [e for e in events if e.get('id') != event_id]

        # Сохраняем обновленный список событий
        with open('events.json', 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=2)

        return jsonify({
            'message': 'Event deleted successfully',
            'event_type': repeat_type,
            'notifications_cancelled': len(future_dates) if repeat_type != 'none' else 1
        }), 200

    except Exception as e:
        logging.error(f"Error deleting event: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
