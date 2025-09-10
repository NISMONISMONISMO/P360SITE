from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from config import app, db
from models import User, Panorama, Tour

def admin_required(f):
    """Декоратор для проверки прав администратора"""
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user or not user.is_admin():
            return jsonify({'error': 'Требуются права администратора'}), 403
        
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/api/users/subscription/upgrade', methods=['POST'])
@jwt_required()
def upgrade_subscription():
    """Покупка премиум подписки"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        data = request.get_json()
        subscription_type = data.get('subscription_type', 'premium')
        duration_months = data.get('duration_months', 1)
        
        if subscription_type not in ['premium']:
            return jsonify({'error': 'Неверный тип подписки'}), 400
        
        if duration_months not in [1, 3, 6, 12]:
            return jsonify({'error': 'Неверная длительность подписки'}), 400
        
        # В реальном приложении здесь была бы интеграция с платежной системой
        # Пока просто обновляем подписку
        
        user.subscription_type = subscription_type
        
        # Расчет срока действия подписки
        if user.subscription_expires and user.subscription_expires > datetime.utcnow():
            # Продление существующей подписки
            user.subscription_expires += timedelta(days=30 * duration_months)
        else:
            # Новая подписка
            user.subscription_expires = datetime.utcnow() + timedelta(days=30 * duration_months)
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Подписка успешно обновлена',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления подписки: {str(e)}'}), 500

@app.route('/api/users/subscription/status', methods=['GET'])
@jwt_required()
def subscription_status():
    """Получение статуса подписки"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Подсчет статистики
        today = datetime.utcnow().date()
        today_uploads = Panorama.query.filter(
            Panorama.user_id == user.id,
            db.func.date(Panorama.upload_date) == today
        ).count()
        
        total_panoramas = Panorama.query.filter_by(user_id=user.id).count()
        total_tours = Tour.query.filter_by(user_id=user.id).count()
        
        return jsonify({
            'subscription': {
                'type': user.subscription_type,
                'is_premium': user.is_premium(),
                'expires_at': user.subscription_expires.isoformat() if user.subscription_expires else None,
                'can_upload': user.can_upload_panorama()
            },
            'usage': {
                'today_uploads': today_uploads,
                'daily_limit': 3 if not user.is_premium() else None,
                'total_panoramas': total_panoramas,
                'total_tours': total_tours
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения статуса: {str(e)}'}), 500

@app.route('/api/users/stats', methods=['GET'])
@jwt_required()
def user_stats():
    """Получение статистики пользователя"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Статистика панорам
        panoramas = Panorama.query.filter_by(user_id=user.id).all()
        total_views = sum(p.view_count for p in panoramas)
        
        # Статистика по дням (последние 7 дней)
        daily_stats = []
        for i in range(7):
            date = datetime.utcnow().date() - timedelta(days=i)
            uploads = Panorama.query.filter(
                Panorama.user_id == user.id,
                db.func.date(Panorama.upload_date) == date
            ).count()
            daily_stats.append({
                'date': date.isoformat(),
                'uploads': uploads
            })
        
        return jsonify({
            'panoramas': {
                'total': len(panoramas),
                'active': len([p for p in panoramas if not p.is_expired()]),
                'expired': len([p for p in panoramas if p.is_expired()]),
                'total_views': total_views
            },
            'tours': {
                'total': Tour.query.filter_by(user_id=user.id).count()
            },
            'daily_uploads': daily_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения статистики: {str(e)}'}), 500

@app.route('/api/users/panoramas', methods=['GET'])
@jwt_required()
def user_panoramas():
    """Получение списка панорам пользователя"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', 'all')  # all, active, expired
        
        # Исключаем панорамы, предназначенные только для тура
        query = Panorama.query.filter_by(user_id=user.id, tour_only=False)
        
        if status == 'active':
            query = query.filter(
                db.or_(
                    Panorama.is_permanent == True,
                    Panorama.expires_at > datetime.utcnow()
                )
            )
        elif status == 'expired':
            query = query.filter(
                Panorama.is_permanent == False,
                Panorama.expires_at <= datetime.utcnow()
            )
        
        query = query.order_by(Panorama.upload_date.desc())
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        panoramas = [p.to_dict() for p in pagination.items]
        
        return jsonify({
            'panoramas': panoramas,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения панорам: {str(e)}'}), 500

@app.route('/api/users/tours', methods=['GET'])
@jwt_required()
def user_tours():
    """Получение списка туров пользователя"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Tour.query.filter_by(user_id=user.id).order_by(Tour.created_at.desc())
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        tours = [t.to_dict() for t in pagination.items]
        
        return jsonify({
            'tours': tours,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения туров: {str(e)}'}), 500

