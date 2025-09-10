import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  HomeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Tour } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { tourAPI } from '@/api';

const ToursListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTours();
  }, [currentPage, searchQuery]);

  const loadTours = async () => {
    try {
      setLoading(true);
      const response = await tourAPI.getList({
        page: currentPage,
        per_page: 12,
        search: searchQuery
      });
      
      setTours(response.tours);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      console.error('Ошибка загрузки туров:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки туров');
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = tours.filter(tour =>
    tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tour.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
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
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Виртуальные туры</h1>
            <p className="text-gray-600 mt-2 mb-6">Откройте для себя удивительные места в 360°</p>
            
            {/* Call to action button */}
            <div className="mb-6">
              <Link 
                to="/tour-builder" 
                className="btn-primary inline-flex items-center px-6 py-3 text-base font-medium"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Создать виртуальный тур
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск туров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="container mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadTours}
              className="mt-4 btn-primary"
            >
              Повторить попытку
            </button>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              {searchQuery ? 'Туры не найдены' : 'Пока нет доступных туров'}
            </div>
            <Link to="/tour-builder" className="btn-primary">
              Создать первый тур
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                {/* Tour preview with thumbnail */}
                <div className="h-48 bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => navigate(`/tour/${tour.id}`)}>
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
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-200 flex items-center justify-center" 
                       style={{ display: tour.first_panorama_id ? 'none' : 'flex' }}>
                    <div className="text-center text-primary-800">
                      <EyeIcon className="h-12 w-12 mx-auto mb-2 opacity-75" />
                      <p className="text-sm opacity-90">{tour.panoramas_count} панорам</p>
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

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {tour.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {tour.description}
                  </p>

                  {/* Tour info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>{tour.owner || 'Неизвестен'}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{formatDate(tour.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Link
                      to={`/tour/${tour.id}`}
                      className="flex-1 btn-primary text-center"
                    >
                      Смотреть тур
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursListPage;