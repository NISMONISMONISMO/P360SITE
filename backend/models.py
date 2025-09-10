from datetime import datetime, timedelta
from config import db
import uuid
import hashlib

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    subscription_type = db.Column(db.String(20), default='free')  # free, premium
    subscription_expires = db.Column(db.DateTime, nullable=True)
    role = db.Column(db.String(20), default='user')  # user, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Отношения
    panoramas = db.relationship('Panorama', backref='owner', lazy=True, cascade='all, delete-orphan')
    tours = db.relationship('Tour', backref='creator', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, username, email, password_hash):
        self.username = username
        self.email = email
        self.password_hash = password_hash
    
    def is_premium(self):
        """Проверка премиум статуса"""
        if self.subscription_type == 'premium':
            if self.subscription_expires is None or self.subscription_expires > datetime.utcnow():
                return True
        return False
    
    def is_admin(self):
        """Проверка прав администратора"""
        return self.role == 'admin'
    
    def can_upload_panorama(self):
        """Проверка возможности загрузки панорамы"""
        if self.is_premium():
            return True
        
        # Проверяем лимит для бесплатных пользователей (3 в день)
        today = datetime.utcnow().date()
        today_uploads = Panorama.query.filter(
            Panorama.user_id == int(self.id),
            db.func.date(Panorama.upload_date) == today
        ).count()
        
        return today_uploads < 3
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'subscription_type': self.subscription_type,
            'subscription_expires': self.subscription_expires.isoformat() if self.subscription_expires else None,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'is_premium': self.is_premium(),
            'is_admin': self.is_admin()
        }

class Panorama(db.Model):
    __tablename__ = 'panoramas'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_permanent = db.Column(db.Boolean, default=False)
    view_count = db.Column(db.Integer, default=0)
    is_public = db.Column(db.Boolean, default=True)
    embed_code = db.Column(db.String(255), unique=True)
    tour_only = db.Column(db.Boolean, default=False)  # Флаг для панорам только в составе тура
    
    # Отношения
    hotspots_from = db.relationship('Hotspot', foreign_keys='Hotspot.from_panorama_id', backref='from_panorama', lazy=True)
    hotspots_to = db.relationship('Hotspot', foreign_keys='Hotspot.to_panorama_id', backref='to_panorama', lazy=True)
    
    def __init__(self, user_id, title, description, file_path, file_size, width, height):
        self.user_id = user_id
        self.title = title
        self.description = description
        self.file_path = file_path
        self.file_size = file_size
        self.width = width
        self.height = height
        self.embed_code = self.generate_embed_code()
    
    def generate_embed_code(self):
        """Генерация уникального кода для встраивания"""
        unique_string = f"{self.user_id}-{datetime.utcnow().timestamp()}-{uuid.uuid4()}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:16]
    
    def is_expired(self):
        """Проверка истечения срока"""
        if self.is_permanent:
            return False
        return self.expires_at and self.expires_at <= datetime.utcnow()
    
    def increment_view_count(self):
        """Увеличение счетчика просмотров"""
        self.view_count += 1
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'width': self.width,
            'height': self.height,
            'upload_date': self.upload_date.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_permanent': self.is_permanent,
            'view_count': self.view_count,
            'is_public': self.is_public,
            'embed_code': self.embed_code,
            'tour_only': self.tour_only,  # Добавляем поле в словарь
            'is_expired': self.is_expired()
        }

class Tour(db.Model):
    __tablename__ = 'tours'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=True)
    embed_code = db.Column(db.String(255), unique=True)
    
    # Отношения
    tour_panoramas = db.relationship('TourPanorama', backref='tour', lazy=True, cascade='all, delete-orphan', order_by='TourPanorama.order_index')
    
    def __init__(self, user_id, title, description=None):
        self.user_id = user_id
        self.title = title
        self.description = description
        self.embed_code = self.generate_embed_code()
    
    def generate_embed_code(self):
        """Генерация уникального кода для встраивания тура"""
        unique_string = f"tour-{self.user_id}-{datetime.utcnow().timestamp()}-{uuid.uuid4()}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:16]
    
    def to_dict(self):
        # Подсчитываем количество панорам в туре
        panoramas_count = db.session.query(TourPanorama).filter_by(tour_id=self.id).count()
        
        # Получаем ID первой панорамы в туре (по порядку)
        first_panorama = db.session.query(TourPanorama).filter_by(tour_id=self.id).order_by(TourPanorama.order_index).first()
        first_panorama_id = first_panorama.panorama_id if first_panorama else None
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_public': self.is_public,
            'embed_code': self.embed_code,
            'panoramas_count': panoramas_count,
            'first_panorama_id': first_panorama_id
        }

class TourPanorama(db.Model):
    __tablename__ = 'tour_panoramas'
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id', ondelete='CASCADE'), nullable=False)
    panorama_id = db.Column(db.Integer, db.ForeignKey('panoramas.id', ondelete='CASCADE'), nullable=False)
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)
    order_index = db.Column(db.Integer, default=0)
    
    # Отношение к панораме
    panorama = db.relationship('Panorama', backref='tour_associations', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tour_id': self.tour_id,
            'panorama_id': self.panorama_id,
            'position_x': self.position_x,
            'position_y': self.position_y,
            'position_z': self.position_z,
            'order_index': self.order_index
        }

class Hotspot(db.Model):
    __tablename__ = 'hotspots'
    
    id = db.Column(db.Integer, primary_key=True)
    from_panorama_id = db.Column(db.Integer, db.ForeignKey('panoramas.id'), nullable=False)
    to_panorama_id = db.Column(db.Integer, db.ForeignKey('panoramas.id'), nullable=False)
    position_x = db.Column(db.Float, nullable=False)
    position_y = db.Column(db.Float, nullable=False)
    position_z = db.Column(db.Float, nullable=False)
    title = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'from_panorama_id': self.from_panorama_id,
            'to_panorama_id': self.to_panorama_id,
            'position_x': self.position_x,
            'position_y': self.position_y,
            'position_z': self.position_z,
            'title': self.title,
            'description': self.description
        }

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    
    def __init__(self, user_id, token, expires_at, ip_address=None, user_agent=None):
        self.user_id = user_id
        self.token = token
        self.expires_at = expires_at
        self.ip_address = ip_address
        self.user_agent = user_agent
    
    def is_expired(self):
        """Проверка истечения сессии"""
        return self.expires_at <= datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'expires_at': self.expires_at.isoformat(),
            'created_at': self.created_at.isoformat(),
            'ip_address': self.ip_address,
            'is_expired': self.is_expired()
        }