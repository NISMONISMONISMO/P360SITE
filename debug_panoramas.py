import requests
import json

try:
    # Проверим список панорам
    response = requests.get('http://localhost:5000/api/panoramas', timeout=5)
    print(f"✅ Panoramas API status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        panoramas = data.get('panoramas', [])
        print(f"Found {len(panoramas)} panoramas")
        
        if panoramas:
            # Проверим первую панораму
            first_panorama = panoramas[0]
            print(f"First panorama: {json.dumps(first_panorama, indent=2, ensure_ascii=False)}")
            
            # Проверим изображение панорамы
            panorama_id = first_panorama['id']
            image_response = requests.get(f'http://localhost:5000/api/panoramas/{panorama_id}/image', timeout=5)
            print(f"Image request status: {image_response.status_code}")
            print(f"Content-Type: {image_response.headers.get('Content-Type')}")
        else:
            print("No panoramas found in the system")
    else:
        print(f"Error response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend. Make sure it's running.")
except requests.exceptions.Timeout:
    print("❌ Backend request timeout.")
except Exception as e:
    print(f"❌ Error: {e}")