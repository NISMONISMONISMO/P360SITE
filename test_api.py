#!/usr/bin/env python3
# Тестовый скрипт для проверки API панорам

import requests
import json

def test_api():
    base_url = "http://localhost:5000"
    
    print("=== Тестирование API панорам ===\n")
    
    # Тест 1: Проверка доступности сервера
    print("1. Проверка доступности сервера...")
    try:
        response = requests.get(f"{base_url}/api/panoramas")
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            print("   ✓ Сервер доступен")
        else:
            print(f"   ✗ Ошибка сервера: {response.text}")
    except requests.exceptions.ConnectionError:
        print("   ✗ Сервер недоступен. Убедитесь, что бэкенд запущен на порту 5000")
        return
    except Exception as e:
        print(f"   ✗ Ошибка подключения: {e}")
        return
    
    # Тест 2: Получение списка панорам
    print("\n2. Получение списка панорам...")
    try:
        response = requests.get(f"{base_url}/api/panoramas")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Получено {len(data.get('panoramas', []))} панорам")
            if data.get('panoramas'):
                first_panorama = data['panoramas'][0]
                print(f"   Первая панорама: {first_panorama.get('title', 'Без названия')}")
                panorama_id = first_panorama['id']
            else:
                print("   Нет панорам в базе данных")
                return
        else:
            print(f"   ✗ Ошибка получения списка: {response.text}")
            return
    except Exception as e:
        print(f"   ✗ Ошибка: {e}")
        return
    
    # Тест 3: Получение информации о конкретной панораме
    print(f"\n3. Получение информации о панораме ID {panorama_id}...")
    try:
        response = requests.get(f"{base_url}/api/panoramas/{panorama_id}")
        if response.status_code == 200:
            data = response.json()
            panorama = data.get('panorama', {})
            print(f"   ✓ Панорама найдена: {panorama.get('title', 'Без названия')}")
            print(f"   Размеры: {panorama.get('width', 'N/A')}x{panorama.get('height', 'N/A')}")
            print(f"   Файл: {panorama.get('file_path', 'N/A')}")
        else:
            print(f"   ✗ Ошибка получения информации: {response.text}")
    except Exception as e:
        print(f"   ✗ Ошибка: {e}")
    
    # Тест 4: Проверка доступности изображения
    print(f"\n4. Проверка доступности изображения панорамы ID {panorama_id}...")
    try:
        response = requests.get(f"{base_url}/api/panoramas/{panorama_id}/image", stream=True)
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'unknown')
            content_length = response.headers.get('content-length', 'unknown')
            print(f"   ✓ Изображение доступно")
            print(f"   Тип контента: {content_type}")
            print(f"   Размер: {content_length} байт")
        else:
            print(f"   ✗ Ошибка получения изображения: {response.text}")
    except Exception as e:
        print(f"   ✗ Ошибка: {e}")
    
    print("\n=== Тестирование завершено ===")

if __name__ == "__main__":
    test_api()