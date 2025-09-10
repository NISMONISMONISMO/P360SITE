import os
from datetime import datetime, timedelta
from config import db

def cleanup_expired_panoramas():
    """Очистка истекших панорам"""
    from models import Panorama
    expired = Panorama.query.filter(
        Panorama.expires_at <= datetime.utcnow(),
        Panorama.is_permanent == False
    ).all()
    
    for panorama in expired:
        try:
            # Удаляем файл
            if os.path.exists(panorama.file_path):
                os.remove(panorama.file_path)
            # Удаляем запись из БД
            db.session.delete(panorama)
        except Exception as e:
            print(f"Ошибка удаления панорамы {panorama.id}: {e}")
    
    db.session.commit()
    return len(expired)

def cleanup_old_sessions():
    """Очистка старых сессий (старше 30 дней)"""
    from models import UserSession
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    old_sessions = UserSession.query.filter(
        UserSession.created_at < thirty_days_ago
    ).all()
    
    count = len(old_sessions)
    for session in old_sessions:
        try:
            db.session.delete(session)
        except Exception as e:
            print(f"Ошибка удаления сессии {session.id}: {e}")
    
    db.session.commit()
    return count