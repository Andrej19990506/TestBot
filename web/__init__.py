from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__,
        static_url_path='/static',
        static_folder='static',
        template_folder='templates'
    )
    CORS(app)
    
    # Импортируем и регистрируем маршруты
    from web.app import init_routes
    init_routes(app)
    
    return app 