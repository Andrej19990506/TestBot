from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_cors import CORS
import logging
import os
from web.telegram_bot import TelegramBot
from config import bot_token
from datetime import datetime
import globals
import traceback
from utils.chat_manager import ChatManager

# Создаем Blueprint
bp = Blueprint('main', __name__, static_folder='createEvent/create-event/build')
CORS(bp, resources={r"/api/*": {"origins": "*"}})

# Инициализация бота
bot = TelegramBot(bot_token)

@bp.route('/events', methods=['GET'])
def get_events():
    try:
        events = globals.chat_manager.get_events()
        if not isinstance(events, list):
            events = []
        logging.info(f"Возвращаемые события: {events}")
        return jsonify(events)
    except Exception as e:
        logging.error(f"Ошибка получения событий: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/events', methods=['POST'])
def create_event():
    try:
        data = request.get_json()
        logging.info(f"Получены данные события: {data}")
        
        # Проверка обязательных полей
        required_fields = ['description', 'date', 'chat_ids']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Отсутствует обязательное поле: {field}'}), 400
        
        # Проверяем формат даты
        try:
            datetime.strptime(data['date'], '%Y-%m-%d %H:%M')
        except ValueError as e:
            logging.error(f"Ошибка формата даты: {e}")
            return jsonify({'error': 'Неверный формат даты. Ожидается формат: YYYY-MM-DD HH:mm'}), 400

        if not data['chat_ids']:
            return jsonify({'error': 'Список chat_ids пуст'}), 400
            
        if not isinstance(data['chat_ids'], list):
            return jsonify({'error': 'chat_ids должен быть списком'}), 400

        # Проверяем валидность chat_ids
        valid_chat_ids = [str(id) for id in globals.chat_manager.chat_ids.values()]
        logging.info(f"Доступные chat_ids: {valid_chat_ids}")
        
        for chat_id in data['chat_ids']:
            chat_id_str = str(chat_id)
            logging.info(f"Проверка chat_id: {chat_id_str}")
            if chat_id_str not in valid_chat_ids:
                logging.error(f"Недопустимый chat_id: {chat_id_str}. Доступные ID: {valid_chat_ids}")
                return jsonify({'error': f'Недопустимый chat_id: {chat_id}'}), 400

        # Создание события в базе данных
        event_data = {
            'description': data['description'],
            'date': data['date'],
            'chat_ids': [str(chat_id) for chat_id in data['chat_ids']],
            'notifications': data.get('notifications', []),
            'repeat': data.get('repeat', {'type': 'none'})
        }
        
        logging.info(f"Подготовленные данные события: {event_data}")
        
        # Сохраняем событие
        if not globals.chat_manager.add_event(event_data):
            raise Exception("Ошибка при сохранении события")
        
        # Отправка события в телеграм
        success_chats = []
        failed_chats = []
        telegram_bot = TelegramBot(bot_token)
        
        # Отправляем сообщение в каждый чат
        for chat_id in event_data['chat_ids']:
            try:
                logging.info(f"Подготовка к отправке в чат {chat_id}")
                
                # Создаем отдельное сообщение для каждого чата
                message = {
                    'chat_id': chat_id,
                    'description': event_data['description'],
                    'date': event_data['date']
                }
                
                logging.info(f"Отправка сообщения в чат {chat_id}: {message}")
                
                # Отправляем сообщение
                result = telegram_bot.send_event(message)
                if result:
                    success_chats.append(chat_id)
                    logging.info(f"Успешно отправлено в чат {chat_id}")
                else:
                    failed_chats.append(chat_id)
                    logging.warning(f"Не удалось отправить сообщение в чат {chat_id}")
                    
            except Exception as e:
                logging.error(f"Ошибка отправки в чат {chat_id}: {str(e)}\n{traceback.format_exc()}")
                failed_chats.append(chat_id)
                continue
        
        # Формируем ответ
        response = {
            'success': True,
            'message': 'Событие успешно создано',
            'details': {
                'success_chats': success_chats,
                'failed_chats': failed_chats,
                'event_data': event_data
            }
        }
        
        if failed_chats:
            response['warning'] = f'Не удалось отправить сообщение в некоторые чаты: {failed_chats}'
            
        logging.info(f"Отправка ответа: {response}")
        return jsonify(response)
        
    except Exception as e:
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logging.error(f"Ошибка при создании события: {error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@bp.route('/chats', methods=['GET'])
def get_chats():
    try:
        # Перезагружаем данные из файла
        globals.chat_manager.load_chat_ids()
        chats = globals.chat_manager.chat_ids
        
        logging.info(f"Raw chat_ids: {chats}")
        
        if not chats:
            logging.warning("No chats found in chat_ids.json")
            # Возвращаем тестовые данные если нет данных
            chats = {
                "Словцова": "-4774890964",
                "Баумана": "-4722230050",
                "Свердловская": "-4641251467",
                "Взлека": "-4775448662",
                "Комунальная": "-4732427913",
                "Мате залки": "-4755479474"
            }
            
        formatted_chats = {name: str(chat_id) for name, chat_id in chats.items()}
        logging.info(f"Returning formatted chats: {formatted_chats}")
        
        response = jsonify(formatted_chats)
        response.headers.add('Access-Control-Allow-Origin', '*')
        logging.info(f"Response data: {response.get_data()}")
        return response
    except Exception as e:
        logging.error(f"Error getting chats: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

# Маршрут для статических файлов датапикера
@bp.route('/static/<path:filename>')
def serve_static(filename):
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return send_from_directory(os.path.join(root_dir, 'web', 'static'), filename)

# Маршрут для файлов React приложения
@bp.route('/')
def serve_react_root():
    return send_from_directory(bp.static_folder, 'index.html')

@bp.route('/<path:path>')
def serve_react_static(path):
    if os.path.exists(os.path.join(bp.static_folder, path)):
        return send_from_directory(bp.static_folder, path)
    return send_from_directory(bp.static_folder, 'index.html')
