from flask import Flask, send_from_directory
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__,
        static_url_path='/static',
        static_folder='static',
        template_folder='templates'
    )
    
    # Настройка CORS для режима разработки
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Настройка конфигурации
    app.config.from_object('config.Config')
    
    # Импортируем и регистрируем маршруты API
    from web.app import bp as routes_bp
    app.register_blueprint(routes_bp, url_prefix='/api')
    
    return app