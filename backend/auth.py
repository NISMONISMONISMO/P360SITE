from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, get_jwt, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import re
from config import app, db, blacklisted_tokens
from models import User, UserSession

def validate_email(email):
    """Валидация email адреса"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Валидация пароля - минимум 6 символов"""
    return len(password) >= 6

def validate_username(username):
    """Валидация имени пользователя"""
    return len(username) >= 3 and username.isalnum()

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для регистрации'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Валидация данных
        if not username or not email or not password:
            return jsonify({'error': 'Все поля обязательны для заполнения'}), 400
        
        if not validate_username(username):
            return jsonify({'error': 'Имя пользователя должно содержать минимум 3 символа и состоять только из букв и цифр'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Некорректный email адрес'}), 400
        
        if not validate_password(password):
            return jsonify({'error': 'Пароль должен содержать минимум 6 символов'}), 400
        
        # Проверка на существование пользователя
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
        
        # Создание нового пользователя
        password_hash = generate_password_hash(password)
        user = User(
            username=username,
            email=email,
            password_hash=password_hash
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Создание токена доступа
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        
        # Создание сессии
        session = UserSession(
            user_id=user.id,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'message': 'Регистрация успешна',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка регистрации: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Авторизация пользователя"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для авторизации'}), 400
        
        login_field = data.get('login', '').strip()  # может быть email или username
        password = data.get('password', '')
        
        if not login_field or not password:
            return jsonify({'error': 'Логин и пароль обязательны'}), 400
        
        # Поиск пользователя по email или username
        user = None
        if validate_email(login_field):
            user = User.query.filter_by(email=login_field.lower()).first()
        else:
            user = User.query.filter_by(username=login_field).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Неверный логин или пароль'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Аккаунт заблокирован'}), 401
        
        # Создание токена доступа
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        
        # Создание сессии
        session = UserSession(
            user_id=user.id,
            token=access_token,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'message': 'Авторизация успешна',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка авторизации: {str(e)}'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Выход из системы"""
    try:
        jti = get_jwt()['jti']
        user_id = get_jwt_identity()
        
        # Добавляем токен в черный список
        blacklisted_tokens.add(jti)
        
        # Удаляем сессию из базы данных
        session = UserSession.query.filter_by(user_id=int(user_id), token=request.headers.get('Authorization', '').replace('Bearer ', '')).first()
        if session:
            db.session.delete(session)
            db.session.commit()
        
        return jsonify({'message': 'Выход выполнен успешно'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка выхода: {str(e)}'}), 500

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Получение профиля текущего пользователя"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения профиля: {str(e)}'}), 500

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Обновление профиля пользователя"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для обновления'}), 400
        
        # Обновление email
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if not validate_email(new_email):
                return jsonify({'error': 'Некорректный email адрес'}), 400
            
            # Проверка уникальности email
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
            
            user.email = new_email
        
        # Обновление имени пользователя
        if 'username' in data:
            new_username = data['username'].strip()
            if not validate_username(new_username):
                return jsonify({'error': 'Имя пользователя должно содержать минимум 3 символа и состоять только из букв и цифр'}), 400
            
            # Проверка уникальности username
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400
            
            user.username = new_username
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Профиль обновлен успешно',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления профиля: {str(e)}'}), 500

@app.route('/api/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Смена пароля пользователя"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для смены пароля'}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Текущий и новый пароль обязательны'}), 400
        
        if not check_password_hash(user.password_hash, current_password):
            return jsonify({'error': 'Неверный текущий пароль'}), 401
        
        if not validate_password(new_password):
            return jsonify({'error': 'Новый пароль должен содержать минимум 6 символов'}), 400
        
        user.password_hash = generate_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Пароль изменен успешно'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка смены пароля: {str(e)}'}), 500

@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Обновление токена доступа"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user or not user.is_active:
            return jsonify({'error': 'Пользователь не найден или заблокирован'}), 404
        
        # Создание нового токена
        new_access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'access_token': new_access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка обновления токена: {str(e)}'}), 500