import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarIcon,
  PhotoIcon,
  GlobeAltIcon,
  LockClosedIcon,
  StarIcon,
  ClockIcon,
  ShareIcon,
  FilmIcon,
  ChartPieIcon,
  UserCircleIcon,
  CommandLineIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { userAPI } from '@/api';
import toast from 'react-hot-toast';
import { UserStats, SubscriptionStatus } from '@/types';

interface PanoramaData {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  view_count: number;
  upload_date: string;
  expires_at: string | null;
  is_permanent: boolean;
  file_size: number;
  embed_code: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [panoramas, setPanoramas] = useState<PanoramaData[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'panoramas' | 'tours'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/auth/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    // Handle tab parameter from URL
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['overview', 'panoramas', 'tours'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'panoramas' | 'tours');
    }
  }, [location.search]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, subscriptionData, panoramasData, toursData] = await Promise.all([
        userAPI.getStats(),
        userAPI.getSubscriptionStatus(),
        userAPI.getPanoramas({ per_page: 10 }),
        userAPI.getTours({ per_page: 10 })
      ]);
      
      setStats(statsData);
      setSubscriptionStatus(subscriptionData);
      setPanoramas(panoramasData.panoramas);
      setTours(toursData.tours);
    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
      toast.error('Ошибка загрузки данных дашборда');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePanorama = async (panoramaId: number, title: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить панораму "${title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/panoramas/${panoramaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Панорама удалена');
        loadDashboardData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (err) {
      toast.error('Ошибка подключения к серверу');
    }
  };

  const handleDeleteTour = async (tourId: number, title: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить тур "${title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/tours/${tourId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Тур удален');
        loadDashboardData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (err) {
      toast.error('Ошибка подключения к серверу');
    }
  };

  const copyEmbedCode = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Код вставки скопирован');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <UserCircleIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Личный кабинет</h1>
                <div className="flex items-center space-x-3">
                  <p className="text-gray-600">Добро пожаловать, {user?.username || 'Пользователь'}!</p>
                  {subscriptionStatus?.subscription.is_premium && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                      <StarIcon className="h-3 w-3 mr-1" />
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => navigate('/')} className="btn-secondary flex items-center">
                <HomeIcon className="h-5 w-5 mr-2" />
                На главную
              </button>
              <Link to="/profile" className="btn-secondary flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Настройки
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Ошибка */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <div className="text-red-600 font-medium">{error}</div>
            <button 
              onClick={() => setError('')} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Навигация */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Обзор', icon: ChartBarIcon },
                { id: 'panoramas', label: 'Панорамы', icon: PhotoIcon },
                { id: 'tours', label: 'Туры', icon: FilmIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      navigate(`/dashboard?tab=${tab.id}`);
                    }}
                    className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Subscription Status */}
            {subscriptionStatus && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Статус подписки</h3>
                  {!subscriptionStatus.subscription.is_premium && (
                    <Link to="/upgrade" className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                      Обновить до Premium
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        subscriptionStatus.subscription.is_premium 
                          ? 'bg-yellow-100' 
                          : 'bg-gray-100'
                      }`}>
                        {subscriptionStatus.subscription.is_premium ? (
                          <StarIcon className="h-6 w-6 text-yellow-600" />
                        ) : (
                          <UserCircleIcon className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Тип подписки</p>
                        <p className="text-lg font-bold">
                          {subscriptionStatus.subscription.is_premium ? 'Premium' : 'Бесплатная'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ArrowUpTrayIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Загрузки сегодня</p>
                        <p className="text-lg font-bold">
                          {subscriptionStatus.usage.today_uploads}
                          {subscriptionStatus.usage.daily_limit && ` / ${subscriptionStatus.usage.daily_limit}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ClockIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Статус</p>
                        <p className="text-lg font-bold text-green-600">
                          {subscriptionStatus.subscription.can_upload ? 'Можно загружать' : 'Лимит исчерпан'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Статистика */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <PhotoIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Всего панорам</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.panoramas.total}</p>
                      <p className="text-xs text-gray-500">
                        Активных: {stats.panoramas.active}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <EyeIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Всего просмотров</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.panoramas.total_views}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FilmIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Виртуальные туры</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.tours.total}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <ChartPieIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Активность</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.daily_uploads.reduce((acc, day) => acc + day.uploads, 0)}
                      </p>
                      <p className="text-xs text-gray-500">За неделю</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Быстрые действия */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Быстрые действия</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/upload"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                  <div className="text-center">
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary-500" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900">Загрузить панораму</h4>
                    <p className="text-xs text-gray-500">Добавить новую 360° панораму</p>
                  </div>
                </Link>
                <Link
                  to="/tours/new"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                  <div className="text-center">
                    <FilmIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary-500" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900">Создать тур</h4>
                    <p className="text-xs text-gray-500">Новый виртуальный тур</p>
                  </div>
                </Link>
                <Link
                  to="/explore"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                  <div className="text-center">
                    <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary-500" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900">Обзор</h4>
                    <p className="text-xs text-gray-500">Публичные панорамы</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Panoramas Tab */}
        {activeTab === 'panoramas' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Мои панорамы</h2>
              <Link to="/upload" className="btn-primary text-sm flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Добавить
              </Link>
            </div>

            {panoramas.length === 0 ? (
              <div className="text-center py-12">
                <PhotoIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет панорам</h3>
                <p className="text-gray-500 mb-6">Загрузите свою первую 360° панораму</p>
                <Link to="/upload" className="btn-primary">
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  Загрузить панораму
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {panoramas.map((panorama) => (
                  <div key={panorama.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => navigate(`/panorama/${panorama.id}`)}>
                      <img 
                        src={`http://localhost:5000/api/panoramas/${panorama.id}/image`}
                        alt={panorama.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {/* Fallback для случаев, когда изображение не загружается */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-200 flex items-center justify-center" style={{display: 'none'}}>
                        <PhotoIcon className="h-12 w-12 text-primary-600" />
                      </div>
                      {/* Overlay с информацией */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="text-white text-center">
                          <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Просмотреть</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate flex-1">{panorama.title}</h3>
                        <div className="flex items-center space-x-1 ml-2">
                          {panorama.is_public ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <GlobeAltIcon className="h-3 w-3 mr-1" />
                              Публичная
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <LockClosedIcon className="h-3 w-3 mr-1" />
                              Приватная
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {panorama.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{panorama.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {panorama.view_count}
                          </span>
                          <span>{formatDate(panorama.upload_date)}</span>
                        </div>
                        {!panorama.is_permanent && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Ограничена
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/panorama/${panorama.id}/edit`)}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Редактировать
                          </button>
                          <button
                            onClick={() => copyEmbedCode(panorama.embed_code)}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-purple-100 text-purple-800 hover:bg-purple-200"
                          >
                            <ShareIcon className="h-4 w-4 mr-1" />
                            Поделиться
                          </button>
                          <button
                            onClick={() => handleDeletePanorama(panorama.id, panorama.title)}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Мои туры</h2>
              <Link to="/tours/new" className="btn-primary text-sm flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Создать тур
              </Link>
            </div>

            {tours.length === 0 ? (
              <div className="text-center py-12">
                <FilmIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет виртуальных туров</h3>
                <p className="text-gray-500 mb-6">Создайте свой первый виртуальный тур</p>
                <Link to="/tours/new" className="btn-primary inline-flex items-center px-6 py-3 text-base font-medium">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Создать тур
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <div key={tour.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => navigate(`/tour/${tour.id}`)}>
                      {tour.first_panorama_id ? (
                        <img 
                          src={`http://localhost:5000/api/panoramas/${tour.first_panorama_id}/image`}
                          alt={tour.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {/* Fallback when no thumbnail or image fails to load */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center" 
                           style={{ display: tour.first_panorama_id ? 'none' : 'flex' }}>
                        <div className="text-center text-purple-800">
                          <FilmIcon className="h-12 w-12 mx-auto mb-2 opacity-75" />
                          <p className="text-sm opacity-90">{tour.panoramas_count || 0} панорам</p>
                        </div>
                      </div>
                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="text-white text-center">
                          <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Просмотреть тур</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate flex-1">{tour.title}</h3>
                        <div className="flex items-center space-x-1 ml-2">
                          {tour.is_public ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <GlobeAltIcon className="h-3 w-3 mr-1" />
                              Публичный
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <LockClosedIcon className="h-3 w-3 mr-1" />
                              Приватный
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {tour.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tour.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <FilmIcon className="h-4 w-4 mr-1" />
                            {tour.panoramas_count || 0} панорам
                          </span>
                          <span>{formatDate(tour.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/tours/${tour.id}`}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Просмотр
                          </Link>
                          <Link
                            to={`/tours/${tour.id}/edit`}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Редактировать
                          </Link>
                          <button
                            onClick={() => copyEmbedCode(tour.embed_code)}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-purple-100 text-purple-800 hover:bg-purple-200"
                          >
                            <ShareIcon className="h-4 w-4 mr-1" />
                            Поделиться
                          </button>
                          <button
                            onClick={() => handleDeleteTour(tour.id, tour.title)}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;