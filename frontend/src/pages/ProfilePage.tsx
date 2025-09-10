import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  subscription_type: string;
  created_at: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/auth/login');
      return;
    }
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setProfileData({ username: data.user.username, email: data.user.email });
      } else {
        setError(data.error || 'Ошибка загрузки профиля');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Профиль обновлён!');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setError(data.error || 'Ошибка обновления');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Настройки профиля</h1>
              <p className="text-gray-600">Управляйте своей учётной записью</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              К личному кабинету
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === 'profile' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  Общая информация
                </button>
              </nav>
            </div>

            <div className="lg:col-span-3">
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Общая информация</h2>
                
                {user && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Информация об аккаунте</h3>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <CogIcon className="w-4 h-4 mr-2" />
                          Перейти в админку
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                        <p className="text-gray-900">{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Подписка</label>
                        <p className="text-gray-900">{user.subscription_type === 'premium' ? 'Премиум' : 'Бесплатная'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата регистрации</label>
                        <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        Имя пользователя
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email адрес
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Выйти из аккаунта
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;