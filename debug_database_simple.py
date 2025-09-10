import sqlite3
import os

# Подключаемся к базе данных
db_path = os.path.join(os.path.dirname(__file__), 'backend', 'instance', 'panorama_site.db')
print(f"Database path: {db_path}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Проверяем таблицу panoramas
    cursor.execute("SELECT COUNT(*) FROM panoramas")
    count = cursor.fetchone()[0]
    print(f"Total panoramas in database: {count}")
    
    if count > 0:
        # Получаем первую панораму
        cursor.execute("SELECT id, title, file_path FROM panoramas LIMIT 1")
        row = cursor.fetchone()
        if row:
            panorama_id, title, file_path = row
            print(f"First panorama ID: {panorama_id}")
            print(f"First panorama title: {title}")
            print(f"First panorama file path: {file_path}")
            print(f"File exists: {os.path.exists(file_path)}")
    
    conn.close()
else:
    print("Database file not found")