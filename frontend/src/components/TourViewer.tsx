import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tourAPI } from '@/api';
import PanoramaViewer from './PanoramaViewer';
import { Panorama, Hotspot, Tour } from '@/types';
import { 
  ArrowLeft, 
  Map, 
  List, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  Minimize,
  Maximize
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TourViewerProps {
  embedMode?: boolean;
  tour?: Tour;
}

const TourViewer: React.FC<TourViewerProps> = ({ embedMode = false, tour: propTour }) => {
  const { id, embedCode } = useParams<{ id?: string; embedCode?: string }>();
  const navigate = useNavigate();
  
  const [tour, setTour] = useState<any>(propTour || null);
  const [currentPanorama, setCurrentPanorama] = useState<Panorama | null>(null);
  const [loading, setLoading] = useState(!propTour);
  const [error, setError] = useState('');
  const [showPanoramaList, setShowPanoramaList] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (propTour) {
      setTour(propTour);
      setLoading(false);
    } else if (id || embedCode) {
      loadTour();
    }
  }, [id, embedCode, propTour]);

  useEffect(() => {
    if (tour && tour.panoramas && tour.panoramas.length > 0) {
      // Устанавливаем первую панораму как текущую
      setCurrentPanorama(tour.panoramas[0]);
    }
  }, [tour]);

  useEffect(() => {
    // Автопроигрывание
    if (autoPlay && tour?.panoramas?.length > 0) {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
      
      const interval = setInterval(() => {
        setAutoPlayIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % tour.panoramas.length;
          setCurrentPanorama(tour.panoramas[nextIndex]);
          return nextIndex;
        });
      }, 3000); // 3 секунды между панорамами
      
      setAutoPlayInterval(interval);
    } else if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    }
    
    return () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };
  }, [autoPlay, tour]);

  const loadTour = async () => {
    try {
      setLoading(true);
      let tourData;
      
      if (embedCode) {
        const response = await tourAPI.getByEmbed(embedCode);
        tourData = response.tour;
      } else if (id) {
        const response = await tourAPI.getById(parseInt(id));
        tourData = response.tour;
      }
      
      setTour(tourData);
    } catch (err: any) {
      console.error('Ошибка загрузки тура:', err);
      setError(err.response?.data?.error || 'Тур не найден');
      toast.error('Ошибка загрузки тура');
    } finally {
      setLoading(false);
    }
  };

  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    if (!tour?.panoramas) return;
    
    // Находим панораму, на которую ведет hotspot
    const targetPanorama = tour.panoramas.find((p: Panorama) => p.id === hotspot.to_panorama_id);
    
    if (targetPanorama) {
      setCurrentPanorama(targetPanorama);
      
      // Отключаем автопроигрывание при ручном переходе
      if (autoPlay) {
        setAutoPlay(false);
      }
    } else {
      toast.error('Панорама не найдена');
    }
  }, [tour, autoPlay]);

  const handlePanoramaSelect = (panorama: Panorama) => {
    setCurrentPanorama(panorama);
    setShowPanoramaList(false);
    
    // Отключаем автопроигрывание при ручном выборе
    if (autoPlay) {
      setAutoPlay(false);
    }
  };

  const handleNextPanorama = () => {
    if (!tour?.panoramas || tour.panoramas.length === 0) return;
    
    const currentIndex = tour.panoramas.findIndex((p: Panorama) => p.id === currentPanorama?.id);
    const nextIndex = (currentIndex + 1) % tour.panoramas.length;
    setCurrentPanorama(tour.panoramas[nextIndex]);
    
    // Отключаем автопроигрывание при ручном переходе
    if (autoPlay) {
      setAutoPlay(false);
    }
  };

  const handlePrevPanorama = () => {
    if (!tour?.panoramas || tour.panoramas.length === 0) return;
    
    const currentIndex = tour.panoramas.findIndex((p: Panorama) => p.id === currentPanorama?.id);
    const prevIndex = (currentIndex - 1 + tour.panoramas.length) % tour.panoramas.length;
    setCurrentPanorama(tour.panoramas[prevIndex]);
    
    // Отключаем автопроигрывание при ручном переходе
    if (autoPlay) {
      setAutoPlay(false);
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 mx-auto mb-4 border-t-2 border-primary-500 border-solid rounded-full animate-spin" />
          <p>Загрузка виртуального тура...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-4">
          <p className="text-red-400 mb-4 text-lg">❌ {error}</p>
          <button 
            onClick={loadTour}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!tour || !currentPanorama) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p>{tour && tour.panoramas && tour.panoramas.length === 0 ? 'В туре нет панорам' : 'Тур или панорама не найдена'}</p>
          {!embedMode && (
            <button 
              onClick={() => navigate(-1)}
              className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Назад
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Кнопка списка панорам - добавлена в верхнюю часть экрана */}
      {(!embedMode || (tour && tour.embed_code === 'preview')) && !loading && !error && (
        <button
          onClick={() => setShowPanoramaList(!showPanoramaList)}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-100 transition-all z-30 flex items-center shadow-lg"
        >
          <List className="h-5 w-5 mr-2" />
          {showPanoramaList ? 'Скрыть список' : 'Список панорам'}
        </button>
      )}
      
      {/* Header */}
      {(!embedMode || (tour && tour.embed_code === 'preview')) && (
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold">{tour.title}</h1>
            <p className="text-sm text-gray-400">{tour.description}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPanoramaList(!showPanoramaList)}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              title="Список панорам"
            >
              <List className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleAutoPlay}
              className={`p-2 rounded-lg transition-colors ${
                autoPlay 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title={autoPlay ? 'Остановить автопроигрывание' : 'Запустить автопроигрывание'}
            >
              {autoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
      
      {/* Основной контент */}
      <div className="flex-1 flex relative">
        {/* Просмотр панорамы */}
        <div className="flex-1">
          <PanoramaViewer
            panorama={currentPanorama}
            hotspots={currentPanorama.hotspots || []}
            onHotspotClick={handleHotspotClick}
            showControls={!embedMode || (tour && tour.embed_code === 'preview')}
            autoRotate={false}
            className="w-full h-full"
            tourPanoramas={tour?.panoramas || []}
          />
        </div>
        
        {/* Боковая панель со списком панорам */}
        {(showPanoramaList && (!embedMode || (tour && tour.embed_code === 'preview'))) && tour && tour.panoramas && (
          <div className="absolute top-0 right-0 w-80 h-full bg-gray-900 text-white flex flex-col z-40 shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Панорамы в туре</h2>
              <button
                onClick={() => setShowPanoramaList(false)}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {tour.panoramas.map((panorama: Panorama, index: number) => (
                <div 
                  key={panorama.id}
                  onClick={() => handlePanoramaSelect(panorama)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    currentPanorama && currentPanorama.id === panorama.id
                      ? 'bg-primary-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg overflow-hidden mr-3">
                      <img
                        src={`http://localhost:5000/api/panoramas/${panorama.id}/image`}
                        alt={panorama.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><span class="text-white text-xs">Пан</span></div>';
                          }
                        }}
                      />
                    </div>
                  
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{panorama.title}</h3>
                      <p className="text-xs text-gray-400 truncate">
                        {panorama.description || 'Без описания'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Навигация между панорамами */}
      {(!embedMode || (tour && tour.embed_code === 'preview')) && tour && tour.panoramas && tour.panoramas.length > 1 && (
        <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
          <button
            onClick={handlePrevPanorama}
            disabled={tour.panoramas.length <= 1}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Предыдущая
          </button>
          
          <div className="text-sm text-gray-400">
            {currentPanorama ? tour.panoramas.findIndex((p: Panorama) => p.id === currentPanorama.id) + 1 : 1} из {tour.panoramas.length}
          </div>
          
          <button
            onClick={handleNextPanorama}
            disabled={tour.panoramas.length <= 1}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Следующая
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TourViewer;