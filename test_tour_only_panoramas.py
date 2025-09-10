#!/usr/bin/env python3
"""
Тест для проверки, что панорамы только для тура не отображаются в общем списке
"""

import requests
import json

def test_tour_only_panoramas():
    base_url = "http://localhost:5000"
    
    print("=== Тест панорам только для тура ===\n")
    
    # 1. Получаем список всех панорам
    print("1. Получение списка всех панорам...")
    try:
        response = requests.get(f"{base_url}/api/panoramas")
        if response.status_code == 200:
            data = response.json()
            total_panoramas = len(data.get('panoramas', []))
            print(f"   Всего панорам в общем списке: {total_panoramas}")
            
            # Проверяем, есть ли среди них панорамы только для тура
            tour_only_count = 0
            for panorama in data.get('panoramas', []):
                if panorama.get('tour_only', False):
                    tour_only_count += 1
            
            print(f"   Панорам только для тура в общем списке: {tour_only_count}")
            
            if tour_only_count == 0:
                print("   ✅ Тест пройден: панорамы только для тура не отображаются в общем списке")
            else:
                print("   ❌ Тест не пройден: панорамы только для тура отображаются в общем списке")
        else:
            print(f"   ❌ Ошибка получения списка: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # 2. Получаем панорамы пользователя
    print("\n2. Получение панорам пользователя...")
    try:
        # Для теста используем существующий пользовательский endpoint
        # В реальном приложении нужно сначала авторизоваться
        response = requests.get(f"{base_url}/api/users/panoramas")
        if response.status_code == 200:
            data = response.json()
            user_panoramas = len(data.get('panoramas', []))
            print(f"   Панорам пользователя: {user_panoramas}")
            
            # Проверяем, есть ли среди них панорамы только для тура
            tour_only_count = 0
            for panorama in data.get('panoramas', []):
                if panorama.get('tour_only', False):
                    tour_only_count += 1
            
            print(f"   Панорам только для тура у пользователя: {tour_only_count}")
            
            if tour_only_count == 0:
                print("   ✅ Тест пройден: панорамы только для тура не отображаются в списке пользователя")
            else:
                print("   ❌ Тест не пройден: панорамы только для тура отображаются в списке пользователя")
        else:
            print(f"   ❌ Ошибка получения списка пользователя: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    print("\n=== Тест завершен ===")

if __name__ == "__main__":
    test_tour_only_panoramas()