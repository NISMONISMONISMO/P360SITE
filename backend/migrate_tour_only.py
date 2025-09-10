#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт миграции для добавления поля tour_only в таблицу panoramas
"""

import os
import sys
import sqlite3

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
        
        # Проверяем, существует ли уже столбец tour_only
        cursor.execute("PRAGMA table_info(panoramas)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'tour_only' in columns:
            print("✅ Столбец tour_only уже существует в таблице panoramas")
            conn.close()
            return True
        
        print("🔄 Добавляем столбец tour_only...")
        
        # Добавляем новый столбец
        cursor.execute('ALTER TABLE panoramas ADD COLUMN tour_only BOOLEAN DEFAULT FALSE')
        print("✅ Добавлен столбец tour_only")
        
        # Устанавливаем значение по умолчанию для всех существующих записей
        cursor.execute("UPDATE panoramas SET tour_only = FALSE WHERE tour_only IS NULL")
        print("✅ Установлено значение по умолчанию для всех существующих панорам")
        
        conn.commit()
        conn.close()
        
        print("✅ Миграция завершена успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск миграции базы данных для добавления поля tour_only...")
    success = migrate_database()
    
    if success:
        print("\n🎉 Миграция выполнена успешно!")
        print("Теперь панорамы, загруженные непосредственно в тур, не будут отображаться в общей коллекции.")
    else:
        print("\n❌ Миграция не удалась.")
        sys.exit(1)