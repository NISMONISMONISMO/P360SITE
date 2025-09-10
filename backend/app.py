import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from PIL import Image
import json
import uuid
import hashlib

# Импорт конфигурации
from config import app, db, jwt, blacklisted_tokens

# Импорт утилит
from utils import cleanup_expired_panoramas

# Разрешенные расширения для панорам
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Основной маршрут
@app.route('/')
def index():
    from models import User, Panorama, Tour, UserSession
    from flask import request
    from datetime import datetime, timedelta
    
    stats = {
        'users': User.query.count(),
        'panoramas': Panorama.query.count(),
        'tours': Tour.query.count()
    }
    
    # Создаем сессию для отслеживания посещений главной страницы
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            # Создание сессии для отслеживания активности
            session = UserSession(
                user_id=int(user_id),
                token=f"home_{datetime.utcnow().timestamp()}",
                expires_at=datetime.utcnow() + timedelta(hours=1),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            db.session.add(session)
            db.session.commit()
    except:
        pass  # Если пользователь не авторизован, просто продолжаем
    
    return jsonify({
        'message': 'Panorama 360 App API Server',
        'version': '1.0.0',
        'status': 'running',
        'stats': stats
    })

# Маршрут для проверки здоровья API
@app.route('/api/health')
def health_check():
    # Очистка истекших панорам при каждой проверке
    cleanup_expired_panoramas()
    
    # Очистка старых сессий
    from utils import cleanup_old_sessions
    cleanup_old_sessions()
    
    from models import User, UserSession
    from flask import request
    from datetime import datetime, timedelta
    
    # Создаем сессию для отслеживания посещений API
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            # Создание сессии для отслеживания активности
            session = UserSession(
                user_id=int(user_id),
                token=f"api_health_{datetime.utcnow().timestamp()}",
                expires_at=datetime.utcnow() + timedelta(hours=1),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            db.session.add(session)
            db.session.commit()
    except:
        pass  # Если пользователь не авторизован, просто продолжаем
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': 'connected' if db.engine.dialect.name else 'disconnected',
        'upload_folder': app.config['UPLOAD_FOLDER']
    })

# Импорт моделей и маршрутов после инициализации приложения
from models import User, Panorama, Tour, TourPanorama, Hotspot, UserSession
import auth  # Импорт маршрутов аутентификации
import user_management  # Импорт маршрутов управления пользователями
import panorama_api  # Импорт API панорам
import tours_api  # Импорт API туров
import admin_api  # Импорт админ API

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Создание администратора по умолчанию
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin_password = generate_password_hash('209030Tes!')
            admin = User(
                username='admin',
                email='admin@panoramasite.com',
                password_hash=admin_password
            )
            admin.role = 'admin'
            admin.subscription_type = 'premium'
            db.session.add(admin)
            db.session.commit()
            print("👤 Создан администратор: admin / 209030Tes!")
        else:
            # Обновляем пароль если администратор уже существует
            admin.password_hash = generate_password_hash('209030Tes!')
            db.session.commit()
            print("👤 Пароль администратора обновлен: admin / 209030Tes!")
    
    print("\n🚀 Panorama 360 App API Server запускается...")
    print("📱 Frontend: http://localhost:3000")
    print("🔧 API: http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("👤 Админ: admin / 209030Tes!\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)