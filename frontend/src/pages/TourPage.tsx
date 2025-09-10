import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ShareIcon, 
  CodeBracketIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import TourViewer from '@/components/TourViewer';
import { tourAPI } from '@/api';
import { Tour } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

const TourPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    if (id) {
      loadTour(parseInt(id));
    }
  }, [id]);

  const loadTour = async (tourId: number) => {
    try {
      setLoading(true);
      const response = await tourAPI.getById(tourId);
      setTour(response.tour);
      
      // Получаем код встраивания
      const embedResponse = await tourAPI.getEmbedCode(tourId);
      setEmbedCode(embedResponse.embed_code);
    } catch (err: any) {
      console.error('Ошибка загрузки тура:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки тура');
      toast.error('Ошибка загрузки тура');
    } finally {
      setLoading(false);
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Код вставки скопирован');
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Ошибка загрузки тура</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/tours')}
            className="btn-primary"
          >
            Вернуться к списку туров
          </button>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">Тур не найден</div>
          <button 
            onClick={() => navigate('/tours')}
            className="btn-primary"
          >
            Вернуться к списку туров
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === tour.user_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Назад
            </button>
            
            <div className="flex items-center space-x-3">
              {isOwner && (
                <button
                  onClick={() => navigate(`/tours/${tour.id}/edit`)}
                  className="btn-secondary flex items-center text-sm"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Редактировать
                </button>
              )}
              <button
                onClick={copyEmbedCode}
                className="btn-secondary flex items-center text-sm"
              >
                <CodeBracketIcon className="h-4 w-4 mr-2" />
                Код вставки
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Информация о туре */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tour.title}</h1>
              {tour.description && (
                <p className="text-gray-600">{tour.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                tour.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tour.is_public ? 'Публичный' : 'Приватный'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                <EyeIcon className="h-4 w-4 mr-1" />
                {tour.panoramas_count || 0} панорам
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <div>
              <span className="font-medium">Создан:</span> {formatDate(tour.created_at)}
            </div>
            <div>
              <span className="font-medium">Обновлен:</span> {formatDate(tour.updated_at)}
            </div>
            {tour.owner && (
              <div>
                <span className="font-medium">Автор:</span> {tour.owner}
              </div>
            )}
          </div>
        </div>

        {/* Просмотр тура */}
        <div className="card overflow-hidden">
          <TourViewer tour={tour} />
        </div>

        {/* Код вставки */}
        {showEmbedCode && (
          <div className="card p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Код вставки тура</h3>
            <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{embedCode}</pre>
            </div>
            <button
              onClick={copyEmbedCode}
              className="btn-primary mt-4"
            >
              Скопировать код
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourPage;