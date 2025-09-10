import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  EyeIcon, 
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LinkIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { tourAPI } from '@/api';
import { Panorama, Tour } from '@/types';
import toast from 'react-hot-toast';
import VisualTransitionEditor from './VisualTransitionEditor';
import PanoramaViewer from './PanoramaViewer';

interface TourEditorProps {
  tour: Tour;
  onSave: () => void;
}

const TourEditor: React.FC<TourEditorProps> = ({ tour, onSave }) => {
  const [tourPanoramas, setTourPanoramas] = useState<any[]>(tour.panoramas || []);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPanorama, setSelectedPanorama] = useState<number | null>(null);
  const [showHotspotCreator, setShowHotspotCreator] = useState(false);
  const [hotspotData, setHotspotData] = useState({
    from_panorama_id: 0,
    to_panorama_id: 0,
    position_x: 0,
    position_y: 0,
    position_z: 0,
    title: '',
    description: ''
  });
  const [viewMode, setViewMode] = useState<'list' | 'visual' | 'interactive'>('visual'); // Added interactive mode
  const [isCreatingTransition, setIsCreatingTransition] = useState(false);

  useEffect(() => {
    loadTourData();
  }, [tour.id]);

  const loadTourData = async () => {
    try {
      setLoading(true);
      // Загружаем данные тура с панорамами и переходами
      const response = await tourAPI.getById(tour.id);
      console.log('[TourEditor] Tour data loaded:', response);
      
      const panoramasWithHotspots = [...(response.tour.panoramas || [])];
      
      // Убедимся, что у каждой панорамы есть массив hotspots
      panoramasWithHotspots.forEach(panorama => {
        if (!panorama.hotspots) {
          panorama.hotspots = [];
        }
        console.log(`[TourEditor] Panorama ${panorama.id} has ${panorama.hotspots.length} hotspots`);
      });
      
      setTourPanoramas(panoramasWithHotspots);
      
      // Загружаем переходы для каждой панорамы
      const allHotspots: any[] = [];
      if (response.tour.panoramas) {
        for (const panorama of response.tour.panoramas) {
          if (panorama.hotspots) {
            allHotspots.push(...panorama.hotspots);
          }
        }
      }
      setHotspots(allHotspots);
      console.log('[TourEditor] Total hotspots:', allHotspots.length);
    } catch (err: any) {
      console.error('Ошибка загрузки данных тура:', err);
      toast.error('Ошибка загрузки данных тура');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotspot = async () => {
    if (!hotspotData.from_panorama_id || !hotspotData.to_panorama_id) {
      toast.error('Выберите начальную и конечную панорамы');
      return;
    }

    try {
      setSaving(true);
      await tourAPI.createHotspot(tour.id, hotspotData);
      toast.success('Переход создан');
      setShowHotspotCreator(false);
      setHotspotData({
        from_panorama_id: 0,
        to_panorama_id: 0,
        position_x: 0,
        position_y: 0,
        position_z: 0,
        title: '',
        description: ''
      });
      loadTourData(); // Перезагружаем данные
    } catch (err: any) {
      console.error('Ошибка создания перехода:', err);
      toast.error('Ошибка создания перехода: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHotspot = async (hotspotId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот переход?')) {
      return;
    }

    try {
      await tourAPI.deleteHotspot(hotspotId);
      toast.success('Переход удален');
      loadTourData(); // Перезагружаем данные
    } catch (err: any) {
      console.error('Ошибка удаления перехода:', err);
      toast.error('Ошибка удаления перехода: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const handleCreateHotspotInViewer = async (
    position: { x: number; y: number; z: number },
    targetPanoramaId: number,
    title: string
  ) => {
    if (!selectedPanorama) {
      toast.error('Не выбрана панорама для создания перехода');
      return;
    }

    try {
      const hotspotData = {
        from_panorama_id: selectedPanorama,
        to_panorama_id: targetPanoramaId,
        position_x: position.x,
        position_y: position.y,
        position_z: position.z,
        title: title,
        description: ''
      };

      await tourAPI.createHotspot(tour.id, hotspotData);
      toast.success('Переход создан');
      setIsCreatingTransition(false);
      await loadTourData(); // Refresh data
    } catch (err: any) {
      console.error('Ошибка создания перехода:', err);
      toast.error('Ошибка создания перехода: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode('list')}
          className={`py-2 px-4 font-medium text-sm ${
            viewMode === 'list'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Список переходов
        </button>
        <button
          onClick={() => setViewMode('visual')}
          className={`py-2 px-4 font-medium text-sm ${
            viewMode === 'visual'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Визуальный редактор
        </button>
        <button
          onClick={() => setViewMode('interactive')}
          className={`py-2 px-4 font-medium text-sm ${
            viewMode === 'interactive'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Интерактивный редактор
        </button>
      </div>

      {viewMode === 'interactive' ? (
        // Interactive Transition Editor
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Интерактивный редактор переходов</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsCreatingTransition(!isCreatingTransition)}
                  className={`btn-primary ${isCreatingTransition ? 'bg-red-500 hover:bg-red-600' : ''}`}
                >
                  {isCreatingTransition ? 'Отменить создание' : 'Создать переход'}
                </button>
              </div>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm font-medium mb-2">Инструкция по созданию переходов:</p>
              <ol className="list-decimal list-inside text-blue-700 text-sm space-y-1">
                <li>Сначала выберите панораму из списка ниже для редактирования</li>
                <li>Нажмите кнопку "Создать переход"</li>
                <li>Правой кнопкой мыши кликните на панораму в том месте, где хотите создать стрелку</li>
                <li>В появившемся меню введите название перехода и выберите целевую панораму</li>
                <li>Нажмите "Создать" для подтверждения</li>
              </ol>
            </div>
            
            {selectedPanorama ? (
              <div className="border rounded-lg overflow-hidden relative" style={{minHeight: "500px"}}>
                {/* Debug information */}
                <div className="p-2 bg-yellow-100 text-yellow-800 text-xs">
                  Selected panorama ID: {selectedPanorama}
                  Found panorama: {tourPanoramas.find(p => p.id === selectedPanorama) ? "Yes" : "No"}
                  Panorama data: {JSON.stringify(tourPanoramas.find(p => p.id === selectedPanorama) || {})}
                </div>
                <PanoramaViewer
                  panorama={tourPanoramas.find(p => p.id === selectedPanorama) || tourPanoramas[0]}
                  hotspots={tourPanoramas.find(p => p.id === selectedPanorama)?.hotspots || []}
                  tourPanoramas={tourPanoramas}
                  isCreatingTransition={isCreatingTransition}
                  onCreateHotspot={handleCreateHotspotInViewer}
                  onHotspotClick={(hotspot) => {
                    // Handle hotspot click if needed
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700">Панорама не выбрана</p>
                <p className="mt-2">Выберите панораму из списка ниже для редактирования переходов</p>
              </div>
            )}
          </div>
          
          {/* Panorama Selection */}
          <div className="card p-6 border-2 border-blue-300">
            <div className="flex items-center mb-3">
              <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Выберите панораму для редактирования</h3>
            </div>
            {/* Debug information */}
            <div className="mb-3 p-2 bg-gray-100 text-gray-700 text-xs">
              Total panoramas: {tourPanoramas.length}
              Tour panoramas: {JSON.stringify(tourPanoramas.map(p => p.id))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tourPanoramas.map((panorama) => {
                const isSelected = selectedPanorama === panorama.id;
                return (
                  <div
                    key={panorama.id}
                    onClick={() => setSelectedPanorama(panorama.id)}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
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
                      <div className="ml-3 flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {panorama.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {panorama.description || 'Без описания'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode === 'visual' ? (
        // Visual Transition Editor
        <VisualTransitionEditor
          tourId={tour.id}
          tourPanoramas={tourPanoramas}
          hotspots={hotspots}
          onSave={loadTourData}
        />
      ) : (
        // List View (existing implementation)
        <>
          {/* Панорамы в туре */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Панорамы в туре</h2>
            </div>
            
            {tourPanoramas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <LinkIcon className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600">В туре пока нет панорам</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tourPanoramas.map((panorama, index) => (
                  <div key={panorama.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
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
                    
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {panorama.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {panorama.description || 'Без описания'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedPanorama(selectedPanorama === panorama.id ? null : panorama.id)}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {selectedPanorama === panorama.id ? 'Скрыть переходы' : 'Показать переходы'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Переходы */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Переходы между панорамами</h2>
              <button
                onClick={() => setShowHotspotCreator(true)}
                className="btn-primary flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Добавить переход
              </button>
            </div>
            
            {hotspots.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <LinkIcon className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">Нет переходов между панорамами</p>
                <button
                  onClick={() => setShowHotspotCreator(true)}
                  className="btn-primary"
                >
                  Создать первый переход
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {hotspots.map((hotspot) => (
                  <div key={hotspot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {hotspot.title || `Переход из панорамы ${hotspot.from_panorama_id} в ${hotspot.to_panorama_id}`}
                      </h3>
                      {hotspot.description && (
                        <p className="text-sm text-gray-600 mt-1">{hotspot.description}</p>
                      )}
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <span>Из: {tourPanoramas.find(p => p.id === hotspot.from_panorama_id)?.title || hotspot.from_panorama_id}</span>
                        <span className="mx-2">→</span>
                        <span>В: {tourPanoramas.find(p => p.id === hotspot.to_panorama_id)?.title || hotspot.to_panorama_id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveHotspot(hotspot.id)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                      title="Удалить переход"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Модальное окно создания перехода */}
      {showHotspotCreator && viewMode === 'list' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Создать переход</h3>
              <p className="text-sm text-gray-500">Настройте переход между панорамами</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Из панорамы *
                </label>
                <select
                  value={hotspotData.from_panorama_id}
                  onChange={(e) => setHotspotData({...hotspotData, from_panorama_id: parseInt(e.target.value)})}
                  className="input-field"
                >
                  <option value="">Выберите панораму</option>
                  {tourPanoramas.map(panorama => (
                    <option key={panorama.id} value={panorama.id}>{panorama.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  В панораму *
                </label>
                <select
                  value={hotspotData.to_panorama_id}
                  onChange={(e) => setHotspotData({...hotspotData, to_panorama_id: parseInt(e.target.value)})}
                  className="input-field"
                >
                  <option value="">Выберите панораму</option>
                  {tourPanoramas.map(panorama => (
                    <option key={panorama.id} value={panorama.id}>{panorama.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название перехода
                </label>
                <input
                  type="text"
                  value={hotspotData.title}
                  onChange={(e) => setHotspotData({...hotspotData, title: e.target.value})}
                  className="input-field"
                  placeholder="Название перехода (необязательно)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={hotspotData.description}
                  onChange={(e) => setHotspotData({...hotspotData, description: e.target.value})}
                  className="input-field"
                  placeholder="Описание перехода (необязательно)"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowHotspotCreator(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateHotspot}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Создание...' : 'Создать переход'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourEditor;