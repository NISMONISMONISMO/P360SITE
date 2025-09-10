import requests
import time
import sys

def test_backend_connectivity():
    """Test if backend is running and responding to requests"""
    base_url = "http://localhost:5000"
    
    print("Testing backend connectivity...")
    print("=" * 40)
    
    # Test basic connectivity
    try:
        print("1. Testing basic connectivity to localhost:5000...")
        response = requests.get(base_url, timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Basic connectivity successful")
        else:
            print(f"   ⚠️  Unexpected status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection refused - backend may not be running")
        return False
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out - backend may be unresponsive")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False
    
    # Test API health endpoint
    try:
        print("\n2. Testing API health endpoint...")
        response = requests.get(f"{base_url}/api/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            print("   ✅ API health endpoint working")
        else:
            print(f"   ⚠️  Health endpoint returned: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Health endpoint error: {e}")
    
    # Test API panoramas endpoint
    try:
        print("\n3. Testing panoramas endpoint...")
        response = requests.get(f"{base_url}/api/panoramas", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data.get('panoramas', []))} panoramas")
            print("   ✅ Panoramas endpoint working")
        else:
            print(f"   ⚠️  Panoramas endpoint returned: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Panoramas endpoint error: {e}")
    
    print("\n" + "=" * 40)
    print("Backend connectivity test completed.")
    return True

if __name__ == "__main__":
    success = test_backend_connectivity()
    if not success:
        print("\nBackend is not accessible. Please check:")
        print("1. Is the backend server running?")
        print("2. Is it listening on port 5000?")
        print("3. Are there any firewall issues?")
        sys.exit(1)