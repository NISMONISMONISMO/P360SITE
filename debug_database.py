import sys
import os

# Добавляем текущую директорию в путь поиска модулей
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.models import Panorama
from backend.config import app

with app.app_context():
    total = Panorama.query.count()
    print(f"Total panoramas in database: {total}")
    
    first_panorama = Panorama.query.first()
    if first_panorama:
        print(f"First panorama ID: {first_panorama.id}")
        print(f"First panorama title: {first_panorama.title}")
        print(f"First panorama file path: {first_panorama.file_path}")
        print(f"File exists: {os.path.exists(first_panorama.file_path)}")
    else:
        print("No panoramas found in database")