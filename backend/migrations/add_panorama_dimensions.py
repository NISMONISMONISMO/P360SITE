"""
Миграция: добавление полей width и height к таблице panoramas

Для выполнения миграции вручную в SQLite:
1. Запустите python app.py
2. В интерактивной оболочке Python выполните:

from app import app
from config import db
with app.app_context():
    # Добавляем новые столбцы
    db.engine.execute('ALTER TABLE panoramas ADD COLUMN width INTEGER')
    db.engine.execute('ALTER TABLE panoramas ADD COLUMN height INTEGER')
    print("Миграция выполнена успешно!")

Или просто удалите файл panorama_site.db и перезапустите app.py для пересоздания базы.
"""

# Эта миграция будет применена автоматически при первом запуске app.py
# если база данных будет пересоздана