import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  PhotoIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '@/api';
import toast from 'react-hot-toast';
// Добавляем импорты для графиков
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface AdminStats {
  total_stats: {
    users: number;
    panoramas: number;
    tours: number;
    premium_users: number;
    active_users: number;
    blocked_users: number;
    today_visits: number;
    current_active_users: number;
  };
  subscription_stats: Array<{ type: string; count: number }>;
  registration_chart: Array<{ date: string; count: number }>;
  visit_chart: Array<{ date: string; count: number }>;
  top_users: Array<{
    username: string;
    email: string;
    subscription: string;
    panorama_count: number;
  }>;
  recent_panoramas: Array<{
    id: number;
    title: string;
    created_at: string;
    username: string;
  }>;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  subscription_type: string;
  is_active: boolean;
  created_at: string;
  panorama_count?: number;
  tour_count?: number;
  last_activity?: string;
}

// Функция для форматирования даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  });
};

// Функция для получения русского названия типа подписки
const getSubscriptionTypeName = (type: string) => {
  switch (type) {
    case 'premium': return 'Премиум';
    case 'free': return 'Бесплатный';
    default: return type;
  }
};

// Цвета для графиков
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'settings'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [panoramas, setPanoramas] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contentTab, setContentTab] = useState<'panoramas' | 'tours'>('panoramas');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadInitialData();
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      const statsData = await adminAPI.getStats();
      setStats(statsData);
      
      if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'content') {
        await loadContent();
      } else if (activeTab === 'settings') {
        await loadSettings();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers({
        page: currentPage,
        per_page: 20,
        search: searchQuery
      });
      setUsers(response.users);
    } catch (err: any) {
      toast.error('Ошибка загрузки пользователей');
    }
  };

  const loadContent = async () => {
    try {
      const [panoramasResponse, toursResponse] = await Promise.all([
        adminAPI.getAllPanoramas({ page: currentPage, per_page: 20, search: searchQuery }),
        adminAPI.getAllTours({ page: currentPage, per_page: 20, search: searchQuery })
      ]);
      setPanoramas(panoramasResponse.panoramas);
      setTours(toursResponse.tours);
    } catch (err: any) {
      toast.error('Ошибка загрузки контента');
    }
  };

  const loadSettings = async () => {
    try {
      const settingsData = await adminAPI.getSettings();
      setSettings(settingsData);
    } catch (err: any) {
      toast.error('Ошибка загрузки настроек');
    }
  };

  const handleToggleUserPremium = async (userId: number, currentType: string) => {
    try {
      const newType = currentType === 'premium' ? 'free' : 'premium';
      await adminAPI.updateUserSubscription(userId, {
        subscription_type: newType
      });
      toast.success(`Подписка обновлена на ${newType}`);
      loadUsers();
    } catch (err: any) {
      toast.error('Ошибка обновления подписки');
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await adminAPI.updateUserStatus(userId, { is_active: !isActive });
      toast.success(isActive ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      loadUsers();
    } catch (err: any) {
      console.error('Ошибка изменения статуса:', err);
      const errorMessage = err.response?.data?.error || 'Ошибка изменения статуса';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
      return;
    }
    try {
      await adminAPI.deleteUser(userId);
      toast.success('Пользователь удален');
      loadUsers();
    } catch (err: any) {
      toast.error('Ошибка удаления пользователя');
    }
  };

  const handleDeletePanorama = async (panoramaId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту панораму?')) {
      return;
    }

    try {
      await adminAPI.deletePanorama(panoramaId);
      toast.success('Панорама удалена');
      // Refresh the panoramas list without page reload
      loadPanoramas();
    } catch (err: any) {
      console.error('Delete panorama error:', err);
      toast.error(err.response?.data?.error || 'Ошибка удаления панорамы');
    }
  };

  const handleDeleteTour = async (tourId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тур?')) {
      return;
    }

    try {
      await adminAPI.deleteTour(tourId);
      toast.success('Тур удален');
      // Refresh the tours list without page reload
      loadTours();
    } catch (err: any) {
      console.error('Delete tour error:', err);
      toast.error(err.response?.data?.error || 'Ошибка удаления тура');
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await adminAPI.cleanupExpiredContent();
      toast.success(response.message || 'Очистка завершена');
      loadInitialData();
    } catch (err: any) {
      console.error('Ошибка очистки:', err);
      toast.error(err.response?.data?.error || 'Ошибка очистки');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await adminAPI.createBackup();
      toast.success(response.message || 'Резервная копия создана');
    } catch (err: any) {
      console.error('Ошибка создания резервной копии:', err);
      toast.error(err.response?.data?.error || 'Ошибка создания резервной копии');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'content') {
      loadContent();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, currentPage, searchQuery, contentTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Подготовка данных для графиков
  const registrationData = stats?.registration_chart.map(item => ({
    date: formatDate(item.date),
    count: item.count
  })) || [];

  const visitData = stats?.visit_chart.map(item => ({
    date: formatDate(item.date),
    count: item.count
  })) || [];

  const subscriptionData = stats?.subscription_stats.map(item => ({
    name: getSubscriptionTypeName(item.type),
    value: item.count
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-primary-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Админ панель</h1>
                <p className="text-gray-600">Управление системой Panorama 360 App</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/')} className="btn-secondary">
                К главной
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-secondary flex items-center"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                В профиль
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Панель управления', icon: ChartBarIcon },
              { id: 'users', label: 'Пользователи', icon: UsersIcon },
              { id: 'content', label: 'Контент', icon: PhotoIcon },
              { id: 'settings', label: 'Настройки', icon: Cog6ToothIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Всего пользователей</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.users}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <PhotoIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Панорам</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.panoramas}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <StarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Премиум</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.premium_users}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <EyeIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Активные</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.active_users}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <EyeSlashIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Заблокировано</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.blocked_users}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ChartBarIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Туров</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.tours}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Посещений сегодня</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.today_visits}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <UsersIcon className="h-8 w-8 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Сейчас на сайте</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_stats.current_active_users}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Registration Chart */}
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Регистрации пользователей (30 дней)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={registrationData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Регистрации" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visit Chart */}
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Посещения сайта (30 дней)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visitData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Посещения" 
                        fill="#8b5cf6" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subscription Distribution */}
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Распределение подписок</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Количество']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Content Statistics */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Последние загрузки панорам</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Панорама
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Автор
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recent_panoramas.map((panorama) => (
                      <tr key={panorama.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{panorama.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{panorama.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(panorama.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Users */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Топ пользователей по загрузкам</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Подписка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Панорам загружено
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.top_users.map((user, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.subscription === 'premium' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getSubscriptionTypeName(user.subscription)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.panorama_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Быстрые действия</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleCleanup}
                  className="btn-secondary flex items-center justify-center"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Очистка истекшего контента
                </button>
                <button
                  onClick={handleCreateBackup}
                  className="btn-secondary flex items-center justify-center"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Создать резервную копию
                </button>
                <button
                  onClick={() => navigate('/explore')}
                  className="btn-primary flex items-center justify-center"
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Просмотреть все панорамы
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="card p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Поиск пользователей..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <button onClick={loadUsers} className="btn-secondary">
                  Обновить
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Подписка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Контент
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.subscription_type === 'premium' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Активен' : 'Заблокирован'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.panorama_count || 0} панорам
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleToggleUserPremium(user.id, user.subscription_type)}
                              className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                user.subscription_type === 'premium'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                              }`}
                            >
                              {user.subscription_type === 'premium' ? (
                                <>
                                  <UserMinusIcon className="h-4 w-4 mr-1" />
                                  Убрать премиум
                                </>
                              ) : (
                                <>
                                  <UserPlusIcon className="h-4 w-4 mr-1" />
                                  Добавить премиум
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                user.is_active
                                  ? 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                              }`}
                            >
                              {user.is_active ? (
                                <>
                                  <EyeSlashIcon className="h-4 w-4 mr-1" />
                                  Заблокировать
                                </>
                              ) : (
                                <>
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Разблокировать
                                </>
                              )}
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Удалить
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Content Navigation */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Модерация контента</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setContentTab('panoramas')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      contentTab === 'panoramas'
                        ? 'bg-primary-100 text-primary-800 border border-primary-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <PhotoIcon className="h-4 w-4 mr-2 inline" />
                    Панорамы ({panoramas.length})
                  </button>
                  <button
                    onClick={() => setContentTab('tours')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      contentTab === 'tours'
                        ? 'bg-primary-100 text-primary-800 border border-primary-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2 inline" />
                    Туры ({tours.length})
                  </button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Поиск ${contentTab === 'panoramas' ? 'панорам' : 'туров'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Content Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                {contentTab === 'panoramas' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Миниатюра
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Панорама
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Автор
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата загрузки
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {panoramas.length > 0 ? panoramas.map((panorama) => (
                        <tr key={panorama.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                              <img 
                                className="h-16 w-16 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                src={`http://localhost:5000/api/panoramas/${panorama.id}/image`}
                                alt={panorama.title}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNlNWU1ZTUiLz48dGV4dCB4PSI4IiB5PSI5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltZzwvdGV4dD48L3N2Zz4=';
                                }}
                                onClick={() => navigate(`/panorama/${panorama.id}`, { state: { fromAdmin: true } })}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div 
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={() => navigate(`/panorama/${panorama.id}`, { state: { fromAdmin: true } })}
                              >
                                {panorama.title}
                              </div>
                              <div className="text-sm text-gray-500">ID: {panorama.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{panorama.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(panorama.upload_date).toLocaleDateString('ru-RU')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              panorama.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {panorama.is_public ? 'Публичная' : 'Приватная'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleDeletePanorama(panorama.id, panorama.title)}
                              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Удалить
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Панорамы не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Миниатюра
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тур
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Автор
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата создания
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Панорам
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tours.length > 0 ? tours.map((tour) => (
                        <tr key={tour.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                              {tour.first_panorama_id ? (
                                <img 
                                  className="h-16 w-16 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                  src={`http://localhost:5000/api/panoramas/${tour.first_panorama_id}/image`}
                                  alt={tour.title}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNlNWU1ZTUiLz48dGV4dCB4PSI4IiB5PSI5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRvdXI8L3RleHQ+PC9zdmc+';
                                  }}
                                  onClick={() => navigate(`/tour/${tour.id}`, { state: { fromAdmin: true } })}
                                />
                              ) : (
                                <div 
                                  className="h-16 w-16 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity"
                                  onClick={() => navigate(`/tour/${tour.id}`, { state: { fromAdmin: true } })}
                                >
                                  <FilmIcon className="h-8 w-8 text-purple-600" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div 
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={() => navigate(`/tour/${tour.id}`, { state: { fromAdmin: true } })}
                              >
                                {tour.title}
                              </div>
                              <div className="text-sm text-gray-500">ID: {tour.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tour.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(tour.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tour.panoramas_count || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteTour(tour.id, tour.title)}
                              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Удалить
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Туры не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Upload Settings */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Настройки загрузки</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Лимит загрузок для бесплатных пользователей (в день)
                  </label>
                  <input
                    type="number"
                    defaultValue={settings?.upload_limits?.free_daily_limit || 3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время хранения бесплатных панорам (часы)
                  </label>
                  <input
                    type="number"
                    defaultValue={settings?.upload_limits?.free_storage_hours || 24}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* System Actions */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Системные действия</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleCleanup}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Очистить истекший контент
                </button>
                <button
                  onClick={handleCreateBackup}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Создать резервную копию
                </button>
                <button
                  onClick={() => window.open('http://localhost:5000/api/health', '_blank')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Проверить состояние API
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;