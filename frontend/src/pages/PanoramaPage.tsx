import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import PanoramaViewer from '../components/PanoramaViewer';
import { Panorama } from '@/types';

interface PanoramaData extends Panorama {
  user_id: number;
}

interface OwnerData {
  username: string;
}

const PanoramaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [panorama, setPanorama] = useState<PanoramaData | null>(null);
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Проверяем, пришли ли мы из админки
  const fromAdmin = location.state?.fromAdmin;

  useEffect(() => {
    if (id) {
      fetchPanorama();
    }
  }, [id]);

  const fetchPanorama = async () => {
    try {
      // Using relative URL to leverage Vite proxy
      const response = await fetch(`/api/panoramas/${id}`, {
        credentials: 'include' // Добавляем для CORS
      });
      const data = await response.json();

      if (response.ok) {
        setPanorama(data.panorama);
        setOwner({ username: data.owner });
      } else {
        setError(data.error || 'Панорама не найдена');
      }
    } catch (err) {
      console.error('Ошибка загрузки панорамы:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmbedCode = async () => {
    console.log('Fetching embed code for panorama ID:', id);
    try {
      // Using relative URL to leverage Vite proxy
      const response = await fetch(`/api/panoramas/${id}/embed`, {
        credentials: 'include' // Добавляем для CORS
      });
      console.log('Embed code response status:', response.status);
      const data = await response.json();
      console.log('Embed code response data:', data);

      if (response.ok) {
        setEmbedCode(data.embed_code);
        setShowEmbedCode(true);
      } else {
        setError(data.error || 'Ошибка получения кода встраивания');
      }
    } catch (err) {
      console.error('Error fetching embed code:', err);
      setError('Ошибка подключения к серверу');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: panorama?.title,
        text: panorama?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    alert('Код встраивания скопирован!');
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Загрузка панорамы...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <PhotoIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate(fromAdmin ? '/admin' : '/')}
            className="btn-primary"
          >
            {fromAdmin ? 'Вернуться в админку' : 'Вернуться на главную'}
          </button>
        </div>
      </div>
    );
  }

  if (!panorama) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="absolute top-4 left-0 z-50">
              <button
                onClick={() => {
                  if (fromAdmin) {
                    navigate('/admin');
                  } else {
                    navigate('/dashboard?tab=panoramas');
                  }
                }}
                className="flex items-center text-white hover:text-gray-300 transition-colors ml-4"
              >
                <ArrowLeftIcon className="h-6 w-6 mr-2" />
                {fromAdmin ? 'В админку' : 'Назад'}
              </button>
            </div>
            
            <div className="flex items-center space-x-3 ml-auto">
              <button
                onClick={handleShare}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              
              {panorama.is_public && (
                <button
                  onClick={() => {
                    console.log('Embed button clicked');
                    fetchEmbedCode();
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  <CodeBracketIcon className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                {isLiked ? (
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code Modal */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Код для встраивания</h3>
              <button 
                onClick={() => setShowEmbedCode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <textarea
                value={embedCode}
                readOnly
                className="w-full h-32 p-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
            <button
              onClick={copyEmbedCode}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Скопировать код
            </button>
          </div>
        </div>
      )}

      <div className="w-full h-screen">
        <PanoramaViewer panorama={panorama} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="container mx-auto px-4 py-6 pointer-events-auto">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">{panorama.title}</h1>
            {panorama.description && (
              <p className="text-lg text-gray-300 mb-4">{panorama.description}</p>
            )}
            
            <div className="flex items-center flex-wrap gap-6 text-sm text-gray-300">
              {owner && (
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {owner.username}
                </div>
              )}
              
              <div className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                {panorama.view_count} просмотров
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(panorama.upload_date)}
              </div>
              
              {panorama.is_public && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Публичная
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanoramaPage;