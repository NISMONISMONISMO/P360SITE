import os
import json
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from datetime import datetime, timedelta
from config import app, db
from models import User, Panorama, Tour, UserSession
from sqlalchemy import func, desc
# Импортируем функцию очистки из utils.py
from utils import cleanup_expired_panoramas

def admin_required(f):
    """Декоратор для проверки прав администратора"""
    @jwt_required()
    def wrapper(*args, **kwargs):
        try:
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({'error': 'Неверный токен'}), 401
            
            user = User.query.get(int(user_id))
            if not user:
                return jsonify({'error': 'Пользователь не найден'}), 404
            
            if not user.is_admin():
                return jsonify({'error': 'Доступ запрещен. Нужны права администратора'}), 403
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': f'Ошибка авторизации: {str(e)}'}), 401
    wrapper.__name__ = f.__name__
    return wrapper

# ========== СТАТИСТИКА ==========

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    """Получение расширенной статистики для админ-панели"""
    try:
        # Основная статистика
        total_users = User.query.count()
        total_panoramas = Panorama.query.count()
        total_tours = Tour.query.count()
        
        # Статистика пользователей
        premium_users = User.query.filter_by(subscription_type='premium').count()
        active_users = User.query.filter_by(is_active=True).count()
        blocked_users = User.query.filter_by(is_active=False).count()
        
        # Статистика по подпискам
        subscription_stats = db.session.query(
            User.subscription_type,
            func.count(User.id).label('count')
        ).group_by(User.subscription_type).all()
        
        # Статистика по датам регистрации (последние 30 дней)
        month_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(User.created_at >= month_ago).group_by(func.date(User.created_at)).order_by('date').all()
        
        # Топ пользователей по количеству панорам
        top_users = db.session.query(
            User.username,
            User.email,
            User.subscription_type,
            func.count(Panorama.id).label('panorama_count')
        ).join(Panorama, User.id == Panorama.user_id, isouter=True)\
         .group_by(User.id)\
         .order_by(desc('panorama_count'))\
         .limit(10).all()
        
        # Последние загруженные панорамы
        recent_panoramas = db.session.query(
            Panorama.id,
            Panorama.title,
            Panorama.upload_date,
            User.username
        ).join(User, Panorama.user_id == User.id)\
         .order_by(desc(Panorama.upload_date))\
         .limit(10).all()
        
        # Статистика посещений сайта (за последние 30 дней)
        visit_stats = db.session.query(
            func.date(UserSession.created_at).label('date'),
            func.count(UserSession.id).label('count')
        ).filter(UserSession.created_at >= month_ago)\
         .group_by(func.date(UserSession.created_at))\
         .order_by('date').all()
        
        # Количество посещений сегодня
        today = datetime.utcnow().date()
        today_visits = db.session.query(UserSession)\
            .filter(func.date(UserSession.created_at) == today)\
            .count()
        
        # Количество активных пользователей прямо сейчас (за последние 15 минут)
        fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
        current_active_users = db.session.query(UserSession)\
            .filter(UserSession.created_at >= fifteen_minutes_ago)\
            .count()
        
        return jsonify({
            'total_stats': {
                'users': total_users,
                'panoramas': total_panoramas,
                'tours': total_tours,
                'premium_users': premium_users,
                'active_users': active_users,
                'blocked_users': blocked_users,
                'today_visits': today_visits,
                'current_active_users': current_active_users
            },
            'subscription_stats': [
                {'type': stat[0], 'count': stat[1]} for stat in subscription_stats
            ],
            'registration_chart': [
                {'date': str(stat[0]), 'count': stat[1]} for stat in recent_registrations
            ],
            'visit_chart': [
                {'date': str(stat[0]), 'count': stat[1]} for stat in visit_stats
            ],
            'top_users': [
                {
                    'username': user[0],
                    'email': user[1],
                    'subscription': user[2],
                    'panorama_count': user[3] or 0
                } for user in top_users
            ],
            'recent_panoramas': [
                {
                    'id': p[0],
                    'title': p[1],
                    'created_at': p[2].isoformat(),
                    'username': p[3]
                } for p in recent_panoramas
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения статистики: {str(e)}'}), 500

# ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_users():
    """Получение списка пользователей с пагинацией и фильтрацией"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        subscription_filter = request.args.get('subscription', '')
        status_filter = request.args.get('status', '')
        
        query = User.query
        
        # Поиск по username или email
        if search:
            query = query.filter(
                db.or_(
                    User.username.contains(search),
                    User.email.contains(search)
                )
            )
        
        # Фильтр по подписке
        if subscription_filter:
            query = query.filter(User.subscription_type == subscription_filter)
        
        # Фильтр по статусу
        if status_filter == 'active':
            query = query.filter(User.is_active == True)
        elif status_filter == 'blocked':
            query = query.filter(User.is_active == False)
        
        # Сортировка по дате создания (новые сначала)
        query = query.order_by(desc(User.created_at))
        
        users = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Добавляем статистику для каждого пользователя
        users_data = []
        for user in users.items:
            user_dict = user.to_dict()
            # Количество панорам
            user_dict['panorama_count'] = Panorama.query.filter_by(user_id=user.id).count()
            # Количество туров
            user_dict['tour_count'] = Tour.query.filter_by(user_id=user.id).count()
            # Последняя активность
            last_session = UserSession.query.filter_by(user_id=user.id).order_by(desc(UserSession.created_at)).first()
            user_dict['last_activity'] = last_session.created_at.isoformat() if last_session else None
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': users.page,
                'pages': users.pages,
                'per_page': users.per_page,
                'total': users.total,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения пользователей: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>/subscription', methods=['PUT'])
@admin_required
def update_user_subscription(user_id):
    """Обновление подписки пользователя"""
    try:
        data = request.get_json()
        subscription_type = data.get('subscription_type')
        expires_at = data.get('expires_at')
        
        if subscription_type not in ['free', 'premium']:
            return jsonify({'error': 'Неверный тип подписки'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        user.subscription_type = subscription_type
        if expires_at:
            user.subscription_expires = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        else:
            user.subscription_expires = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Подписка обновлена',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления подписки: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def update_user_status(user_id):
    """Блокировка/разблокировка пользователя"""
    try:
        data = request.get_json()
        is_active = data.get('is_active', True)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        if user.role == 'admin':
            return jsonify({'error': 'Нельзя заблокировать администратора'}), 403
        
        user.is_active = is_active
        db.session.commit()
        
        action = 'разблокирован' if is_active else 'заблокирован'
        return jsonify({
            'message': f'Пользователь {action}',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка изменения статуса: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Удаление пользователя и всего его контента"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        if user.role == 'admin':
            return jsonify({'error': 'Нельзя удалить администратора'}), 403
        
        # Удаляем файлы панорам пользователя
        user_panoramas = Panorama.query.filter_by(user_id=int(user_id)).all()
        for panorama in user_panoramas:
            if panorama.file_path and os.path.exists(panorama.file_path):
                try:
                    os.remove(panorama.file_path)
                except:
                    pass
        
        # Удаляем все связанные данные (каскадное удаление настроено в моделях)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Пользователь удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка удаления пользователя: {str(e)}'}), 500

# ========== МОДЕРАЦИЯ КОНТЕНТА ==========

@app.route('/api/admin/panoramas', methods=['GET'])
@admin_required
def get_all_panoramas():
    """Получение всех панорам для модерации"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = db.session.query(Panorama, User.username)\
                  .join(User, Panorama.user_id == User.id)
        
        if search:
            query = query.filter(
                db.or_(
                    Panorama.title.contains(search),
                    User.username.contains(search)
                )
            )
        
        query = query.order_by(desc(Panorama.upload_date))
        
        panoramas = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        panoramas_data = []
        for panorama, username in panoramas.items:
            panorama_dict = panorama.to_dict()
            panorama_dict['username'] = username
            panoramas_data.append(panorama_dict)
        
        return jsonify({
            'panoramas': panoramas_data,
            'pagination': {
                'page': panoramas.page,
                'pages': panoramas.pages,
                'per_page': panoramas.per_page,
                'total': panoramas.total,
                'has_next': panoramas.has_next,
                'has_prev': panoramas.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения панорам: {str(e)}'}), 500

@app.route('/api/admin/panoramas/<int:panorama_id>', methods=['DELETE'])
@admin_required
def delete_panorama_admin(panorama_id):
    """Удаление панорамы администратором"""
    try:
        panorama = Panorama.query.get(panorama_id)
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        # Удаляем файл
        if panorama.file_path and os.path.exists(panorama.file_path):
            try:
                os.remove(panorama.file_path)
            except:
                pass
        
        db.session.delete(panorama)
        db.session.commit()
        
        return jsonify({'message': 'Панорама удалена'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка удаления панорамы: {str(e)}'}), 500

@app.route('/api/admin/tours', methods=['GET'])
@admin_required
def get_all_tours():
    """Получение всех туров для модерации"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = db.session.query(Tour, User.username)\
                  .join(User, Tour.user_id == User.id)
        
        if search:
            query = query.filter(
                db.or_(
                    Tour.title.contains(search),
                    User.username.contains(search)
                )
            )
        
        query = query.order_by(desc(Tour.created_at))
        
        tours = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        tours_data = []
        for tour, username in tours.items:
            tour_dict = tour.to_dict()
            tour_dict['username'] = username
            tours_data.append(tour_dict)
        
        return jsonify({
            'tours': tours_data,
            'pagination': {
                'page': tours.page,
                'pages': tours.pages,
                'per_page': tours.per_page,
                'total': tours.total,
                'has_next': tours.has_next,
                'has_prev': tours.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения туров: {str(e)}'}), 500

@app.route('/api/admin/tours/<int:tour_id>', methods=['DELETE'])
@admin_required
def delete_tour_admin(tour_id):
    """Удаление тура администратором"""
    try:
        tour = Tour.query.get(tour_id)
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        db.session.delete(tour)
        db.session.commit()
        
        return jsonify({'message': 'Тур удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка удаления тура: {str(e)}'}), 500

# ========== СИСТЕМНЫЕ НАСТРОЙКИ ==========

@app.route('/api/admin/settings', methods=['GET'])
@admin_required
def get_system_settings():
    """Получение системных настроек"""
    try:
        from config import app as flask_app
        
        settings = {
            'upload_limits': {
                'free_daily_limit': 3,
                'free_storage_hours': 24,
                'max_file_size_mb': 50,
                'allowed_formats': ['jpg', 'jpeg', 'png']
            },
            'subscription_types': {
                'free': {
                    'name': 'Бесплатный',
                    'daily_uploads': 3,
                    'storage_duration': 24,
                    'price': 0
                },
                'premium': {
                    'name': 'Премиум',
                    'daily_uploads': -1,  # Безлимит
                    'storage_duration': -1,  # Постоянно
                    'price': 999
                }
            },
            'system_info': {
                'total_storage_used': get_total_storage_used(),
                'server_uptime': get_server_uptime(),
                'database_size': get_database_size()
            }
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения настроек: {str(e)}'}), 500

def get_total_storage_used():
    """Подсчет использованного места на диске"""
    try:
        upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
        total_size = 0
        if os.path.exists(upload_folder):
            for dirpath, dirnames, filenames in os.walk(upload_folder):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    total_size += os.path.getsize(filepath)
        return total_size
    except:
        return 0

def get_server_uptime():
    """Время работы сервера (заглушка)"""
    return "N/A"

def get_database_size():
    """Размер базы данных (заглушка)"""
    return "N/A"

# ========== ДЕЙСТВИЯ В РЕАЛЬНОМ ВРЕМЕНИ ==========

@app.route('/api/admin/cleanup', methods=['POST'])
@admin_required
def cleanup_expired_content():
    """Очистка истекшего контента"""
    try:
        # Используем функцию из utils.py
        deleted_count = cleanup_expired_panoramas()
        
        return jsonify({
            'message': f'Очистка завершена. Удалено панорам: {deleted_count}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка очистки: {str(e)}'}), 500

@app.route('/api/admin/backup', methods=['POST'])
@admin_required
def create_backup():
    """Создание резервной копии"""
    try:
        # Создаем имя файла для бэкапа с временной меткой
        backup_filename = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        backup_folder = "backups"
        
        # Создаем папку для бэкапов, если её нет
        if not os.path.exists(backup_folder):
            os.makedirs(backup_folder)
        
        # Путь к файлу бэкапа
        backup_path = os.path.join(backup_folder, backup_filename)
        
        # Создаем бэкап в виде JSON файла с основной информацией
        from models import User, Panorama, Tour
        backup_data = {
            'created_at': datetime.utcnow().isoformat(),
            'stats': {
                'users_count': User.query.count(),
                'panoramas_count': Panorama.query.count(),
                'tours_count': Tour.query.count()
            },
            'users': [],
            'panoramas': [],
            'tours': []
        }
        
        # Добавляем основную информацию о пользователях (без паролей)
        users = User.query.all()
        for user in users:
            user_data = user.to_dict()
            # Удаляем чувствительные данные
            user_data.pop('password_hash', None)
            backup_data['users'].append(user_data)
        
        # Добавляем основную информацию о панорамах
        panoramas = Panorama.query.all()
        for panorama in panoramas:
            backup_data['panoramas'].append(panorama.to_dict())
        
        # Добавляем основную информацию о турах
        tours = Tour.query.all()
        for tour in tours:
            backup_data['tours'].append(tour.to_dict())
        
        # Записываем данные в файл
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
        
        return jsonify({
            'message': f'Резервная копия создана: {backup_filename}',
            'filename': backup_filename,
            'path': backup_path
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка создания резервной копии: {str(e)}'}), 500
