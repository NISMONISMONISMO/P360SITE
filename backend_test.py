import requests
import time

def test_backend():
    """Test backend API endpoints"""
    base_url = "http://localhost:5000"
    
    print("Testing backend API endpoints...")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. Testing health check endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            print("   ✅ Health check passed")
        else:
            print(f"   ❌ Health check failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    print()
    
    # Test 2: Main endpoint
    print("2. Testing main endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            print("   ✅ Main endpoint passed")
        else:
            print(f"   ❌ Main endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Main endpoint error: {e}")
    
    print()
    
    # Test 3: Panoramas list (public)
    print("3. Testing panoramas list endpoint...")
    try:
        response = requests.get(f"{base_url}/api/panoramas")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: Found {len(data.get('panoramas', []))} panoramas")
            print("   ✅ Panoramas list passed")
        else:
            print(f"   ❌ Panoramas list failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Panoramas list error: {e}")
    
    print()
    
    # Test 4: Auth endpoints
    print("4. Testing auth endpoints...")
    try:
        # Test register endpoint
        response = requests.post(f"{base_url}/api/auth/register")
        print(f"   Register status: {response.status_code}")
        
        # Test login endpoint
        response = requests.post(f"{base_url}/api/auth/login")
        print(f"   Login status: {response.status_code}")
        
        print("   ✅ Auth endpoints accessible")
    except Exception as e:
        print(f"   ❌ Auth endpoints error: {e}")
    
    print()
    print("Backend test completed.")

if __name__ == "__main__":
    test_backend()