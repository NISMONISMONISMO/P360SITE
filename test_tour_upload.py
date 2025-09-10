#!/usr/bin/env python3
"""
Тест для проверки загрузки панорам в тур
"""

import requests
import json
import os

def test_tour_panorama_upload():
    base_url = "http://localhost:5000"
    
    # Создаем тестового пользователя и тур
    print("=== Тест загрузки панорам в тур ===\n")
    
    # Для теста предполагаем, что у нас есть токен авторизации
    # В реальном приложении нужно сначала авторизоваться
    
    # Создаем тур (для теста предполагаем, что тур с ID 1 существует)
    tour_id = 1
    
    # Проверяем, существует ли тур
    try:
        response = requests.get(f"{base_url}/api/tours/{tour_id}")
        if response.status_code != 200:
            print("Тур не найден. Создайте тур перед тестированием.")
            return
        print(f"Тур найден: {response.json()['tour']['title']}")
    except Exception as e:
        print(f"Ошибка при проверке тура: {e}")
        return
    
    # Создаем тестовый файл
    test_file_path = "test_panorama.jpg"
    try:
        # Создаем простой тестовый файл
        with open(test_file_path, "w") as f:
            f.write("This is a test file for panorama upload")
        
        # Подготавливаем данные для загрузки
        with open(test_file_path, "rb") as f:
            files = {"file": (test_file_path, f, "image/jpeg")}
            data = {
                "title": "Тестовая панорама для тура",
                "description": "Панорама, загруженная непосредственно в тур"
            }
            
            # Отправляем запрос на загрузку панорамы в тур
            print("Загрузка панорамы в тур...")
            response = requests.post(
                f"{base_url}/api/tours/{tour_id}/upload-panorama",
                files=files,
                data=data
            )
            
            print(f"Статус: {response.status_code}")
            if response.status_code == 201:
                result = response.json()
                print("✅ Панорама успешно загружена в тур")
                print(f"   ID панорамы: {result['panorama']['id']}")
                print(f"   Название: {result['panorama']['title']}")
                print(f"   Только для тура: {result['panorama'].get('tour_only', False)}")
            else:
                print(f"❌ Ошибка загрузки: {response.text}")
                
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        # Удаляем тестовый файл
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
    
    print("\n=== Тест завершен ===")

if __name__ == "__main__":
    test_tour_panorama_upload()