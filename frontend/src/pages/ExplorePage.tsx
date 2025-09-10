import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface PanoramaData {
  id: number;
  title: string;
  description: string;
  view_count: number;
  upload_date: string;
  owner: string;
}

interface PaginationData {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [panoramas, setPanoramas] = useState<PanoramaData[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPanoramas();
  }, [currentPage, searchQuery]);

  const fetchPanoramas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12'
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`http://localhost:5000/api/panoramas?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPanoramas(data.panoramas);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Ошибка загрузки панорам');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPanoramas();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const renderPaginationButton = (page: number, label: string, isActive = false) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-500 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation buttons positioned at top right */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/')} className="btn-secondary flex items-center">
                <HomeIcon className="h-5 w-5 mr-2" />
                На главную
              </button>
              {isAuthenticated && user ? (
                <button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  {user.username || user.email}
                </button>
              ) : (
                <button onClick={() => navigate('/auth/login')} className="btn-secondary flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  Войти
                </button>
              )}
            </div>
          </div>

          {/* Centered title and description */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Галерея панорам</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Исследуйте удивительные 360° панорамы, созданные нашим сообществом
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск панорам..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary py-2"
              >
                Найти
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка панорам...</p>
          </div>
        ) : panoramas.length === 0 ? (
          <div className="text-center py-16">
            <PhotoIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchQuery ? 'Панорамы не найдены' : 'Пока нет панорам'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос' 
                : 'Станьте первым, кто поделится своей 360° панорамой!'}
            </p>
            {!searchQuery && (
              <Link to="/upload" className="btn-primary">
                Загрузить панораму
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {pagination && (
                  <>Найдено {pagination.total} панорам{pagination.total === 1 ? 'а' : pagination.total < 5 ? 'ы' : ''}</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {panoramas.map((panorama) => (
                <Link
                  key={panorama.id}
                  to={`/panorama/${panorama.id}`}
                  className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[2/1] bg-gray-100 relative overflow-hidden">
                    <img 
                      src={`http://localhost:5000/api/panoramas/${panorama.id}/image`}
                      alt={panorama.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Fallback для случаев, когда изображение не загружается */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center" style={{display: 'none'}}>
                      <PhotoIcon className="h-12 w-12 text-primary-400 group-hover:scale-110 transition-transform" />
                    </div>
                    {/* Overlay с информацией при hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <EyeIcon className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs font-medium">Просмотреть</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {panorama.title}
                    </h3>
                    
                    {panorama.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {panorama.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <UserIcon className="h-3 w-3 mr-1" />
                          {panorama.owner}
                        </span>
                        <span className="flex items-center">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {panorama.view_count}
                        </span>
                      </div>
                      <span className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {formatDate(panorama.upload_date)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.has_prev}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, currentPage - 2) + i;
                  if (page > pagination.pages) return null;
                  return renderPaginationButton(page, page.toString(), page === currentPage);
                })}

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.has_next}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;