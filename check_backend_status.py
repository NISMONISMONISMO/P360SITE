import requests
import json

def check_backend():
    try:
        print("🔍 Проверка состояния бэкенда...")
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        print(f"✅ Статус: {response.status_code}")
        print(f"📄 Ответ: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к бэкенду. Убедитесь, что сервер запущен.")
    except requests.exceptions.Timeout:
        print("❌ Таймаут подключения к бэкенду.")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    check_backend()