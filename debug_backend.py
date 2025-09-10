import requests
import json

try:
    response = requests.get('http://localhost:5000/api/health', timeout=5)
    print(f"✅ Backend status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend. Make sure it's running.")
except requests.exceptions.Timeout:
    print("❌ Backend request timeout.")
except Exception as e:
    print(f"❌ Error: {e}")