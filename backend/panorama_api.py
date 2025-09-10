import os
from flask import request, jsonify, send_file, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
import uuid
from datetime import datetime
from config import app, db, allowed_file
from models import User, Panorama, Tour, TourPanorama

@app.route('/api/panoramas/upload', methods=['POST'])
@jwt_required()
def upload_panorama():
    """Загрузка панорамы"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        if not user.can_upload_panorama():
            return jsonify({
                'error': 'Превышен лимит загрузок',
                'message': 'Бесплатные пользователи могут загружать до 3 панорам в день. Оформите премиум подписку для безлимитных загрузок.'
            }), 403
        
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не найден'}), 400
        
        file = request.files['file']
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        is_public = request.form.get('is_public', 'true').lower() == 'true'
        
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
                # Теперь принимаем любые изображения - никаких ограничений по соотношению сторон!
                
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': 'Файл поврежден или не является изображением'}), 400
        
        # Создание записи в базе данных с размерами изображения
        panorama = Panorama(
            user_id=user_id,
            title=title,
            description=description,
            file_path=file_path,
            file_size=file_size,
            width=width,
            height=height
        )
        panorama.is_public = is_public
        
        db.session.add(panorama)
        db.session.commit()
        
        return jsonify({
            'message': 'Панорама загружена успешно',
            'panorama': panorama.to_dict()
        }), 201
        
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        db.session.rollback()
        return jsonify({'error': f'Ошибка загрузки: {str(e)}'}), 500

@app.route('/api/panoramas/<int:panorama_id>', methods=['GET'])
def get_panorama(panorama_id):
    """Получение информации о панораме"""
    try:
        panorama = Panorama.query.get(panorama_id)
        
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        if panorama.is_expired():
            return jsonify({'error': 'Срок действия панорамы истек'}), 410
        
        user_id = None
        if not panorama.is_public:
            # Проверяем, является ли текущий пользователь владельцем
            # Но разрешаем доступ к панорамам только для тура владельцу
            try:
                from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if not user_id or (user_id != panorama.user_id and not panorama.tour_only):
                    # Для панорам только для тура проверяем, находится ли она в каком-либо туре пользователя
                    if panorama.tour_only:
                        # Проверяем, принадлежит ли панорама какому-либо туру пользователя
                        user_tour_panorama = TourPanorama.query.join(Tour).filter(
                            TourPanorama.panorama_id == panorama_id,
                            Tour.user_id == user_id
                        ).first()
                        if not user_tour_panorama:
                            return jsonify({'error': 'Панорама недоступна'}), 403
                    else:
                        return jsonify({'error': 'Панорама недоступна'}), 403
            except:
                return jsonify({'error': 'Панорама недоступна'}), 403
        else:
            # Для публичных панорам тоже проверяем авторизацию
            try:
                from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
            except:
                pass
        
        # Увеличиваем счетчик просмотров
        panorama.increment_view_count()
        
        # Создаем сессию для отслеживания посещений
        if user_id:
            from models import UserSession
            from datetime import timedelta
            # Создание сессии для отслеживания активности
            session = UserSession(
                user_id=int(user_id),
                token=f"view_{panorama_id}_{datetime.utcnow().timestamp()}",
                expires_at=datetime.utcnow() + timedelta(hours=1),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            db.session.add(session)
            db.session.commit()
        
        return jsonify({
            'panorama': panorama.to_dict(),
            'owner': panorama.owner.username if panorama.owner else 'Unknown'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка получения панорамы: {str(e)}'}), 500

@app.route('/api/panoramas/<int:panorama_id>/image', methods=['GET'])
def get_panorama_image(panorama_id):
    """Получение файла изображения панорамы"""
    try:
        panorama = Panorama.query.get(panorama_id)
        
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        if panorama.is_expired():
            return jsonify({'error': 'Срок действия панорамы истек'}), 410
        
        # Проверяем права доступа для непубличных панорам
        if not panorama.is_public:
            try:
                from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if not user_id or (int(user_id) != panorama.user_id and not panorama.tour_only):
                    # Для панорам только для тура проверяем, находится ли она в каком-либо туре пользователя
                    if panorama.tour_only:
                        # Проверяем, принадлежит ли панорама какому-либо туру пользователя
                        from models import TourPanorama, Tour
                        user_tour_panorama = TourPanorama.query.join(Tour).filter(
                            TourPanorama.panorama_id == panorama_id,
                            Tour.user_id == int(user_id)
                        ).first()
                        if not user_tour_panorama:
                            return jsonify({'error': 'Панорама недоступна'}), 403
                    else:
                        return jsonify({'error': 'Панорама недоступна'}), 403
            except Exception as e:
                return jsonify({'error': 'Панорама недоступна'}), 403
        
        if not os.path.exists(panorama.file_path):
            return jsonify({'error': 'Файл панорамы не найден'}), 404
        
        # Убедимся, что файл имеет правильное расширение
        if not allowed_file(panorama.file_path):
            return jsonify({'error': 'Неподдерживаемый формат файла'}), 400
        
        # Определяем mimetype на основе расширения файла
        import mimetypes
        mime_type, _ = mimetypes.guess_type(panorama.file_path)
        if mime_type is None:
            mime_type = 'image/jpeg'  # По умолчанию для изображений
        
        return send_file(panorama.file_path, as_attachment=False, mimetype=mime_type)
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения изображения: {str(e)}'}), 500

@app.route('/api/panoramas/<int:panorama_id>', methods=['PUT'])
@jwt_required()
def update_panorama(panorama_id):
    """Обновление информации о панораме"""
    try:
        user_id = get_jwt_identity()
        panorama = Panorama.query.get(panorama_id)
        
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        if panorama.user_id != user_id:
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Нет данных для обновления'}), 400
        
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({'error': 'Название не может быть пустым'}), 400
            panorama.title = title
        
        if 'description' in data:
            panorama.description = data['description'].strip()
        
        if 'is_public' in data:
            panorama.is_public = bool(data['is_public'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Панорама обновлена',
            'panorama': panorama.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления: {str(e)}'}), 500

@app.route('/api/panoramas/<int:panorama_id>', methods=['DELETE'])
@jwt_required()
def delete_panorama(panorama_id):
    """Удаление панорамы"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        panorama = Panorama.query.get(panorama_id)
        
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        # Проверяем права (владелец или админ)
        if panorama.user_id != user_id and not user.is_admin():
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        # Удаляем все hotspots, связанные с этой панорамой (как источник или цель)
        from models import Hotspot, TourPanorama
        Hotspot.query.filter(
            db.or_(
                Hotspot.from_panorama_id == panorama_id,
                Hotspot.to_panorama_id == panorama_id
            )
        ).delete(synchronize_session=False)
        
        # Удаляем все связи с турами
        TourPanorama.query.filter_by(panorama_id=panorama_id).delete(synchronize_session=False)
        
        # Удаляем файл
        if os.path.exists(panorama.file_path):
            try:
                os.remove(panorama.file_path)
            except Exception as e:
                print(f"Ошибка удаления файла {panorama.file_path}: {e}")
        
        # Удаляем запись из базы данных
        db.session.delete(panorama)
        db.session.commit()
        
        return jsonify({'message': 'Панорама удалена'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting panorama: {str(e)}")  # Для отладки
        import traceback
        traceback.print_exc()  # Для получения полной информации об ошибке
        return jsonify({'error': f'Ошибка удаления: {str(e)}'}), 500

@app.route('/api/panoramas', methods=['GET'])
def list_panoramas():
    """Получение списка публичных панорам"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        search = request.args.get('search', '').strip()
        
        # Фильтруем панорамы, исключая те, которые только для тура
        query = Panorama.query.filter_by(is_public=True, tour_only=False)
        
        # Фильтр по неистекшим панорамам
        query = query.filter(
            db.or_(
                Panorama.is_permanent == True,
                Panorama.expires_at > datetime.utcnow()
            )
        )
        
        if search:
            query = query.filter(
                db.or_(
                    Panorama.title.ilike(f'%{search}%'),
                    Panorama.description.ilike(f'%{search}%')
                )
            )
        
        query = query.order_by(Panorama.upload_date.desc())
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        panoramas = []
        for p in pagination.items:
            panorama_data = p.to_dict()
            panorama_data['owner'] = p.owner.username if p.owner else 'Unknown'
            panoramas.append(panorama_data)
        
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
        return jsonify({'error': f'Ошибка получения списка: {str(e)}'}), 500

@app.route('/api/panoramas/embed/<embed_code>', methods=['GET'])
def get_panorama_by_embed(embed_code):
    """Получение панорамы по embed коду"""
    try:
        panorama = Panorama.query.filter_by(embed_code=embed_code).first()
        
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        if panorama.is_expired():
            return jsonify({'error': 'Срок действия панорамы истек'}), 410
        
        # Увеличиваем счетчик просмотров
        panorama.increment_view_count()
        
        return jsonify({
            'panorama': panorama.to_dict(),
            'owner': panorama.owner.username if panorama.owner else 'Unknown'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения панорамы: {str(e)}'}), 500

@app.route('/api/panoramas/<int:panorama_id>/embed', methods=['GET'])
def get_embed_code(panorama_id):
    """Получение HTML кода для встраивания панорамы"""
    try:
        panorama = Panorama.query.get(panorama_id)
        
        if not panorama:
            return jsonify({'error': 'Панорама не найдена'}), 404
        
        if panorama.is_expired():
            return jsonify({'error': 'Срок действия панорамы истек'}), 410
        
        if not panorama.is_public:
            return jsonify({'error': 'Панорама недоступна для встраивания'}), 403
        
        # Генерируем HTML код для встраивания
        base_url = request.host_url.rstrip('/')
        embed_url = f"{base_url}/embed/panorama/{panorama.embed_code}"
        
        embed_html = f'''<iframe 
    src="{embed_url}" 
    width="800" 
    height="400" 
    frameborder="0" 
    allowfullscreen
    title="{panorama.title}">
</iframe>'''
        
        return jsonify({
            'embed_code': embed_html,
            'embed_url': embed_url,
            'panorama_id': panorama.id,
            'title': panorama.title
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Ошибка генерации кода: {str(e)}'}), 500