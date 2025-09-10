#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы сервера изображений
"""
import requests
import os
from PIL import Image
import io

def test_image_server():
    """Тест сервера изображений"""
    print("🔍 Тестирование сервера изображений...")
    
    # Проверяем доступность сервера
    try:
        response = requests.get('http://localhost:5000/api/health')
        if response.status_code == 200:
            print("✅ Сервер API доступен")
        else:
            print(f"❌ Сервер API недоступен: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Ошибка подключения к серверу API: {e}")
        return
    
    # Проверяем наличие панорам
    try:
        response = requests.get('http://localhost:5000/api/panoramas')
        if response.status_code == 200:
            data = response.json()
            panoramas = data.get('panoramas', [])
            print(f"✅ Получен список панорам: {len(panoramas)} панорам найдено")
            
            if panoramas:
                # Берем первую панораму для теста
                panorama = panoramas[0]
                panorama_id = panorama['id']
                print(f"📸 Тестируем панораму ID: {panorama_id}")
                
                # Проверяем получение информации о панораме
                response = requests.get(f'http://localhost:5000/api/panoramas/{panorama_id}')
                if response.status_code == 200:
                    print("✅ Информация о панораме получена успешно")
                    
                    # Проверяем получение изображения
                    image_response = requests.get(f'http://localhost:5000/api/panoramas/{panorama_id}/image')
                    if image_response.status_code == 200:
                        print("✅ Изображение панорамы получено успешно")
                        
                        # Проверяем, что это действительно изображение
                        try:
                            image = Image.open(io.BytesIO(image_response.content))
                            print(f"✅ Изображение корректно: {image.format}, {image.size}")
                        except Exception as e:
                            print(f"❌ Ошибка проверки изображения: {e}")
                    else:
                        print(f"❌ Ошибка получения изображения: {image_response.status_code}")
                        print(f"Текст ошибки: {image_response.text}")
                else:
                    print(f"❌ Ошибка получения информации о панораме: {response.status_code}")
                    print(f"Текст ошибки: {response.text}")
            else:
                print("ℹ️  Панорамы не найдены в базе данных")
        else:
            print(f"❌ Ошибка получения списка панорам: {response.status_code}")
            print(f"Текст ошибки: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка тестирования API: {e}")

if __name__ == "__main__":
    test_image_server()