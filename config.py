bot_token = 'your-bot-token'

class Config:
    DEBUG = True
    TEMPLATES_AUTO_RELOAD = True
    SECRET_KEY = 'your-secret-key'
    FLASK_HOST = '0.0.0.0'
    FLASK_PORT = 5000
    
    # Настройки для горячей перезагрузки
    WATCH_EXTENSIONS = ('.py', '.html', '.css', '.js')
    WATCH_DIRECTORIES = ['web', 'utils', 'components']