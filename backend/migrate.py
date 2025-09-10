#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт миграции для добавления полей width и height в таблицу panoramas
"""

import os
import sys
import sqlite3
from PIL import Image

# Добавляем путь к backend в sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

def migrate_database():
    """Применяет миграцию к существующей базе данных"""
    
    # Проверяем оба возможных местоположения базы данных
    db_paths = [
        os.path.join(backend_path, 'instance', 'panorama_site.db'),
        os.path.join(backend_path, 'panorama_site.db')
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ База данных не найдена. Запустите app.py для её создания.")
        return False
    
    print(f"📋 Найдена база данных: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем, существуют ли уже столбцы
        cursor.execute("PRAGMA table_info(panoramas)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'width' in columns and 'height' in columns:
            print("✅ Столбцы width и height уже существуют в таблице panoramas")
            conn.close()
            return True
        
        print("🔄 Добавляем столбцы width и height...")
        
        # Добавляем новые столбцы
        if 'width' not in columns:
            cursor.execute('ALTER TABLE panoramas ADD COLUMN width INTEGER')
            print("✅ Добавлен столбец width")
        
        if 'height' not in columns:
            cursor.execute('ALTER TABLE panoramas ADD COLUMN height INTEGER')
            print("✅ Добавлен столбец height")
        
        # Обновляем существующие записи, получая размеры из файлов
        print("🔄 Обновляем размеры для существующих панорам...")
        
        cursor.execute("SELECT id, file_path FROM panoramas WHERE width IS NULL OR height IS NULL")
        panoramas = cursor.fetchall()
        
        updated_count = 0
        for panorama_id, file_path in panoramas:
            if os.path.exists(file_path):
                try:
                    with Image.open(file_path) as img:
                        width, height = img.size
                        cursor.execute(
                            "UPDATE panoramas SET width = ?, height = ? WHERE id = ?",
                            (width, height, panorama_id)
                        )
                        updated_count += 1
                except Exception as e:
                    print(f"⚠️  Не удалось получить размеры для панорамы {panorama_id}: {e}")
            else:
                print(f"⚠️  Файл не найден для панорамы {panorama_id}: {file_path}")
        
        conn.commit()
        conn.close()
        
        print(f"✅ Миграция завершена успешно! Обновлено записей: {updated_count}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск миграции базы данных...")
    success = migrate_database()
    
    if success:
        print("\n🎉 Миграция выполнена успешно!")
        print("Теперь панорамы будут отображаться с правильными пропорциями.")
    else:
        print("\n❌ Миграция не удалась.")
        sys.exit(1)