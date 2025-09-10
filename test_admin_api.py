#!/usr/bin/env python3
"""
Test script to verify admin panel API functionality
"""
import requests
import json

def test_admin_api():
    """Test admin API endpoints"""
    print("🔍 Testing Admin Panel API...")
    
    base_url = "http://localhost:5000/api"
    
    # Test 1: Admin Login
    print("\n1. Testing admin login...")
    login_data = {'login': 'admin', 'password': '209030Tes!'}
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.json())
        return False
    
    print("✅ Admin login successful")
    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 2: Admin Stats API
    print("\n2. Testing admin stats API...")
    response = requests.get(f"{base_url}/admin/stats", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Stats API failed: {response.status_code}")
        print(response.json())
        return False
    
    stats = response.json()
    print("✅ Stats API working")
    print(f"   Users: {stats['total_stats']['users']}")
    print(f"   Panoramas: {stats['total_stats']['panoramas']}")
    print(f"   Premium users: {stats['total_stats']['premium_users']}")
    
    # Test 3: Admin Users API  
    print("\n3. Testing admin users API...")
    response = requests.get(f"{base_url}/admin/users", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Users API failed: {response.status_code}")
        print(response.json())
        return False
    
    users_data = response.json()
    print("✅ Users API working")
    print(f"   User count: {len(users_data['users'])}")
    print(f"   Pagination: {users_data['pagination']['total']} total")
    
    # Test 4: Admin Panoramas API
    print("\n4. Testing admin panoramas API...")
    response = requests.get(f"{base_url}/admin/panoramas", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Panoramas API failed: {response.status_code}")
        print(response.json())
        return False
    
    panoramas_data = response.json()
    print("✅ Panoramas API working")
    print(f"   Panorama count: {len(panoramas_data['panoramas'])}")
    
    print("\n🎉 All admin API tests passed!")
    print("\n📋 Summary:")
    print("✅ Admin authentication working")
    print("✅ Admin statistics API working")
    print("✅ Admin users management API working")
    print("✅ Admin content moderation API working")
    print("\n🔧 The 'Ошибка загрузки данных' issue has been resolved!")
    
    return True

if __name__ == "__main__":
    test_admin_api()