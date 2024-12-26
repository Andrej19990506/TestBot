from flask import Flask
from web.app import bp
from werkzeug.middleware.shared_data import SharedDataMiddleware
import os

def create_app():
    app = Flask(__name__)
    
    # Регистрируем blueprint
    app.register_blueprint(bp)
    
    # Получаем путь к статическим файлам из blueprint
    build_path = bp.build_path
    
    # Добавляем middleware для статических файлов
    app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
        '/static': os.path.join(build_path, 'static')
    })
    
    return app