import os
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
import uuid
from datetime import datetime, timedelta
from config import app, db, allowed_file
from models import User, Tour, TourPanorama, Panorama, Hotspot, UserSession

@app.route('/api/tours', methods=['POST'])
@jwt_required()
def create_tour():
    """Создание нового виртуального тура"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для создания тура'}), 400
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        is_public = data.get('is_public', True)
        
        if not title:
            return jsonify({'error': 'Название тура обязательно'}), 400
        
        # Создание тура
        tour = Tour(
            user_id=user_id,
            title=title,
            description=description
        )
        tour.is_public = is_public
        
        db.session.add(tour)
        db.session.commit()
        
        return jsonify({
            'message': 'Тур создан успешно',
            'tour': tour.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating tour: {str(e)}")  # Для отладки
        return jsonify({'error': f'Ошибка создания тура: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>', methods=['GET'])
def get_tour(tour_id):
    """Получение информации о туре"""
    try:
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Отладочная информация
        print(f"Tour found: id={tour.id}, title={tour.title}, panoramas_count={len(tour.tour_panoramas)}")
        
        user_id = None
        if not tour.is_public:
            # Проверяем права доступа
            try:
                from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if not user_id or user_id != tour.user_id:
                    return jsonify({'error': 'Тур недоступен'}), 403
            except:
                return jsonify({'error': 'Тур недоступен'}), 403
        else:
            # Для публичных туров тоже проверяем авторизацию
            try:
                from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
            except:
                pass
        
        # Получаем панорамы тура с их hotspots
        tour_panoramas = []
        for tp in tour.tour_panoramas:
            # Добавляем проверку на существование отношения
            if hasattr(tp, 'panorama') and tp.panorama:
                panorama = tp.panorama
                if not panorama.is_expired():
                    panorama_data = panorama.to_dict()
                    panorama_data['tour_position'] = {
                        'x': tp.position_x,
                        'y': tp.position_y,
                        'z': tp.position_z,
                        'order_index': tp.order_index
                    }
                    
                    # Получаем hotspots из этой панорамы
                    hotspots = []
                    for hotspot in panorama.hotspots_from:
                        # Проверяем, что целевая панорама тоже в этом туре
                        target_in_tour = any(
                            tp2.panorama_id == hotspot.to_panorama_id 
                            for tp2 in tour.tour_panoramas
                        )
                        if target_in_tour:
                            hotspots.append(hotspot.to_dict())
                    
                    panorama_data['hotspots'] = hotspots
                    tour_panoramas.append(panorama_data)
                    print(f"Added panorama to tour: id={panorama.id}, title={panorama.title}, hotspots_count={len(hotspots)}")
                    if hotspots:
                        print(f"Hotspots data: {hotspots}")
                else:
                    print(f"Panorama not added to tour: id={tp.panorama_id}, panorama={panorama}, expired={panorama.is_expired() if panorama else True}")
            else:
                print(f"TourPanorama record has no panorama: id={tp.id}, panorama_id={tp.panorama_id}")
        
        tour_data = tour.to_dict()
        tour_data['panoramas'] = tour_panoramas
        tour_data['owner'] = tour.creator.username if tour.creator else 'Unknown'
        
        # Отладочная информация
        print(f"Tour data being returned: {tour_data}")
        
        # Создаем сессию для отслеживания посещений
        if user_id:
            from models import UserSession
            from datetime import timedelta
            # Создание сессии для отслеживания активности
            session = UserSession(
                user_id=int(user_id),
                token=f"tour_{tour_id}_{datetime.utcnow().timestamp()}",
                expires_at=datetime.utcnow() + timedelta(hours=1),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            db.session.add(session)
            db.session.commit()
        
        return jsonify({
            'tour': tour_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error getting tour: {str(e)}")  # Для отладки
        import traceback
        traceback.print_exc()  # Для получения полной информации об ошибке
        return jsonify({'error': f'Ошибка получения тура: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>', methods=['PUT'])
@jwt_required()
def update_tour(tour_id):
    """Обновление информации о туре"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Проверяем права (владелец или админ)
        if tour.user_id != user_id and not (user and user.is_admin()):
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для обновления'}), 400
        
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({'error': 'Название не может быть пустым'}), 400
            tour.title = title
        
        if 'description' in data:
            tour.description = data['description'].strip()
        
        if 'is_public' in data:
            tour.is_public = bool(data['is_public'])
        
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Тур обновлен',
            'tour': tour.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>', methods=['DELETE'])
@jwt_required()
def delete_tour(tour_id):
    """Удаление тура"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Проверяем права (владелец или админ)
        if tour.user_id != user_id and not user.is_admin():
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        # Удаляем все hotspots, связанные с панорамами этого тура
        from models import Hotspot, TourPanorama
        tour_panoramas = TourPanorama.query.filter_by(tour_id=tour_id).all()
        panorama_ids = [tp.panorama_id for tp in tour_panoramas]
        
        if panorama_ids:
            Hotspot.query.filter(
                db.or_(
                    Hotspot.from_panorama_id.in_(panorama_ids),
                    Hotspot.to_panorama_id.in_(panorama_ids)
                )
            ).delete(synchronize_session=False)
        
        # Удаляем тур (cascade удалит связанные записи)
        db.session.delete(tour)
        db.session.commit()
        
        return jsonify({'message': 'Тур удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting tour: {str(e)}")  # Для отладки
        import traceback
        traceback.print_exc()  # Для получения полной информации об ошибке
        return jsonify({'error': f'Ошибка удаления: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>/panoramas', methods=['POST'])
@jwt_required()
def add_panorama_to_tour(tour_id):
    """Добавление панорамы в тур"""
    try:
        user_id = get_jwt_identity()
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Check if user is the owner of the tour or an admin
        user = User.query.get(int(user_id))
        if tour.user_id != user_id and not (user and user.is_admin()):
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных'}), 400
        
        panorama_id = data.get('panorama_id')
        position_x = data.get('position_x', 0.0)
        position_y = data.get('position_y', 0.0)
        position_z = data.get('position_z', 0.0)
        order_index = data.get('order_index', 0)
        
        if not panorama_id:
            return jsonify({'error': 'ID панорамы обязателен'}), 400
        
        # Проверяем, что панорама существует
        panorama = Panorama.query.get(panorama_id)
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        # Allow adding any panorama if user is admin, otherwise check ownership
        if not (user and user.is_admin()) and panorama.user_id != user_id:
            return jsonify({'error': 'Можно добавлять только свои панорамы'}), 403
        
        if panorama.is_expired():
            return jsonify({'error': 'Нельзя добавить истекшую панораму'}), 400
        
        # Проверяем, не добавлена ли уже панорама в тур
        existing = TourPanorama.query.filter_by(
            tour_id=tour_id,
            panorama_id=panorama_id
        ).first()
        
        if existing:
            return jsonify({'error': 'Панорама уже добавлена в тур'}), 400
        
        # Добавляем панораму в тур
        tour_panorama = TourPanorama(
            tour_id=tour_id,
            panorama_id=panorama_id,
            position_x=position_x,
            position_y=position_y,
            position_z=position_z,
            order_index=order_index
        )
        
        print(f"Adding panorama to tour: tour_id={tour_id}, panorama_id={panorama_id}, order_index={order_index}")
        
        db.session.add(tour_panorama)
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        print(f"Panorama added to tour successfully: tour_panorama_id={tour_panorama.id}")
        
        return jsonify({
            'message': 'Панорама добавлена в тур',
            'tour_panorama': tour_panorama.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка добавления панорамы: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>/panoramas/<int:panorama_id>', methods=['DELETE'])
@jwt_required()
def remove_panorama_from_tour(tour_id, panorama_id):
    """Удаление панорамы из тура"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Проверяем права (владелец или админ)
        if tour.user_id != user_id and not (user and user.is_admin()):
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        tour_panorama = TourPanorama.query.filter_by(
            tour_id=tour_id,
            panorama_id=panorama_id
        ).first()
        
        if not tour_panorama:
            return jsonify({'error': 'Панорама не найдена в туре'}), 404
        
        # Удаляем связанные hotspots
        Hotspot.query.filter(
            db.or_(
                Hotspot.from_panorama_id == panorama_id,
                Hotspot.to_panorama_id == panorama_id
            )
        ).delete(synchronize_session=False)
        
        # Удаляем панораму из тура
        db.session.delete(tour_panorama)
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Панорама удалена из тура'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error removing panorama from tour: {str(e)}")  # Для отладки
        import traceback
        traceback.print_exc()  # Для получения полной информации об ошибке
        return jsonify({'error': f'Ошибка удаления панорамы: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>/hotspots', methods=['POST'])
@jwt_required()
def create_hotspot(tour_id):
    """Создание hotspot'а между панорамами в туре"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Проверяем права (владелец или админ)
        if tour.user_id != user_id and not (user and user.is_admin()):
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных'}), 400
        
        from_panorama_id = data.get('from_panorama_id')
        to_panorama_id = data.get('to_panorama_id')
        position_x = data.get('position_x')
        position_y = data.get('position_y')
        position_z = data.get('position_z')
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        
        if not all([from_panorama_id, to_panorama_id, 
                   position_x is not None, position_y is not None, position_z is not None]):
            return jsonify({'error': 'Все поля обязательны'}), 400
        
        # Проверяем, что обе панорамы есть в туре
        from_tp = TourPanorama.query.filter_by(
            tour_id=tour_id,
            panorama_id=from_panorama_id
        ).first()
        
        to_tp = TourPanorama.query.filter_by(
            tour_id=tour_id,
            panorama_id=to_panorama_id
        ).first()
        
        if not from_tp or not to_tp:
            return jsonify({'error': 'Панорамы должны быть в составе тура'}), 400
        
        # Проверяем, нет ли уже такого hotspot'а
        existing = Hotspot.query.filter_by(
            from_panorama_id=from_panorama_id,
            to_panorama_id=to_panorama_id
        ).first()
        
        if existing:
            return jsonify({'error': 'Hotspot уже существует'}), 400
        
        # Создаем hotspot
        hotspot = Hotspot(
            from_panorama_id=from_panorama_id,
            to_panorama_id=to_panorama_id,
            position_x=position_x,
            position_y=position_y,
            position_z=position_z,
            title=title,
            description=description
        )
        
        db.session.add(hotspot)
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Hotspot создан',
            'hotspot': hotspot.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка создания hotspot: {str(e)}'}), 500

@app.route('/api/hotspots/<int:hotspot_id>', methods=['DELETE'])
@jwt_required()
def delete_hotspot(hotspot_id):
    """Удаление hotspot'а"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        hotspot = Hotspot.query.get(hotspot_id)
        
        if not hotspot:
            return jsonify({'error': 'Hotspot не найден'}), 404
        
        # Проверяем права через панораму
        from_panorama = hotspot.from_panorama
        # Проверяем права (владелец панорамы или админ)
        if from_panorama.user_id != user_id and not (user and user.is_admin()):
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        db.session.delete(hotspot)
        db.session.commit()
        
        return jsonify({'message': 'Hotspot удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка удаления hotspot: {str(e)}'}), 500

@app.route('/api/tours', methods=['GET'])
def list_tours():
    """Получение списка публичных туров"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        search = request.args.get('search', '').strip()
        
        query = Tour.query.filter_by(is_public=True)
        
        if search:
            query = query.filter(
                db.or_(
                    Tour.title.ilike(f'%{search}%'),
                    Tour.description.ilike(f'%{search}%')
                )
            )
        
        query = query.order_by(Tour.created_at.desc())
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        tours = []
        for t in pagination.items:
            tour_data = t.to_dict()
            tour_data['owner'] = t.creator.username if t.creator else 'Unknown'
            tours.append(tour_data)
        
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
        return jsonify({'error': f'Ошибка получения списка туров: {str(e)}'}), 500

@app.route('/api/tours/embed/<embed_code>', methods=['GET'])
def get_tour_by_embed(embed_code):
    """Получение тура по embed коду"""
    try:
        tour = Tour.query.filter_by(embed_code=embed_code).first()
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Получаем данные тура через основной метод
        return get_tour(tour.id)
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения тура: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>/embed', methods=['GET'])
def get_tour_embed_code(tour_id):
    """Получение HTML кода для встраивания тура"""
    try:
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        if not tour.is_public:
            return jsonify({'error': 'Тур недоступен для встраивания'}), 403
        
        # Генерируем HTML код для встраивания
        base_url = request.host_url.rstrip('/')
        embed_url = f"{base_url}/embed/tour/{tour.embed_code}"
        
        embed_html = f'''<iframe 
    src="{embed_url}" 
    width="800" 
    height="600" 
    frameborder="0" 
    allowfullscreen
    title="{tour.title}">
</iframe>'''
        
        return jsonify({
            'embed_code': embed_html,
            'embed_url': embed_url,
            'tour_id': tour.id,
            'title': tour.title
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка генерации кода: {str(e)}'}), 500

@app.route('/api/tours/<int:tour_id>/upload-panorama', methods=['POST'])
@jwt_required()
def upload_panorama_to_tour(tour_id):
    """Загрузка панорамы непосредственно в тур (не отображается в общей коллекции)"""
    try:
        user_id = get_jwt_identity()
        tour = Tour.query.get(tour_id)
        
        if not tour:
            return jsonify({'error': 'Тур не найден'}), 404
        
        # Check if user is the owner of the tour or an admin
        user = User.query.get(int(user_id))
        if tour.user_id != user_id and not (user and user.is_admin()):
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не найден'}), 400
        
        file = request.files['file']
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        
        if file.filename == '':
            return jsonify({'error': 'Файл не выбран'}), 400
        
        if not title:
            return jsonify({'error': 'Название панорамы обязательно'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Неподдерживаемый формат файла. Используйте JPG, JPEG или PNG'}), 400
        
        # Проверка размера файла
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({'error': 'Файл слишком большой. Максимальный размер: 50MB'}), 400
        
        # Генерация уникального имени файла
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        unique_filename = f"{uuid.uuid4().hex}_{name}{ext}"
        
        # Создание папки пользователя
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], str(user_id))
        os.makedirs(user_folder, exist_ok=True)
        
        file_path = os.path.join(user_folder, unique_filename)
        
        # Сохранение файла
        file.save(file_path)
        
        # Проверка, что это изображение и получение размеров
        try:
            with Image.open(file_path) as img:
                width, height = img.size
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': 'Файл поврежден или не является изображением'}), 400
        
        # Создание записи в базе данных с размерами изображения
        # Указываем, что панорама является частью тура (tour_only=True)
        panorama = Panorama(
            user_id=user_id,
            title=title,
            description=description,
            file_path=file_path,
            file_size=file_size,
            width=width,
            height=height
        )
        panorama.is_public = False  # Панорамы только для тура не публичные
        panorama.tour_only = True   # Флаг, указывающий, что панорама только для тура
        
        db.session.add(panorama)
        db.session.flush()  # Получаем ID панорамы до коммита
        
        # Добавляем панораму в тур
        tour_panorama = TourPanorama(
            tour_id=tour_id,
            panorama_id=panorama.id,
            order_index=len(tour.tour_panoramas)  # Добавляем в конец
        )
        
        db.session.add(tour_panorama)
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Панорама загружена и добавлена в тур',
            'panorama': panorama.to_dict(),
            'tour_panorama': tour_panorama.to_dict()
        }), 201
        
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        db.session.rollback()
        return jsonify({'error': f'Ошибка загрузки: {str(e)}'}), 500
