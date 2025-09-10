import React, { useState, useRef, useEffect } from 'react';
import { 
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon as XIcon
} from '@heroicons/react/24/outline';
import { tourAPI } from '@/api';
import toast from 'react-hot-toast';

interface Hotspot {
  id: number;
  from_panorama_id: number;
  to_panorama_id: number;
  position_x: number;
  position_y: number;
  position_z: number;
  title: string;
  description: string;
}

interface Panorama {
  id: number;
  title: string;
  description: string;
  file_path: string;
  width: number;
  height: number;
}

interface VisualTransitionEditorProps {
  tourId: number;
  tourPanoramas: Panorama[];
  hotspots: Hotspot[];
  onSave: () => void;
}

const VisualTransitionEditor: React.FC<VisualTransitionEditorProps> = ({ 
  tourId, 
  tourPanoramas, 
  hotspots, 
  onSave 
}) => {
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
  const [connections, setConnections] = useState<Array<{from: number, to: number}>>([]);
  const [hoveredConnection, setHoveredConnection] = useState<{from: number, to: number} | null>(null);
  const panoramaRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  useEffect(() => {
    // Create connections from hotspots
    const newConnections = hotspots.map(hotspot => ({
      from: hotspot.from_panorama_id,
      to: hotspot.to_panorama_id
    }));
    setConnections(newConnections);
    
    // Set first panorama as selected by default
    if (tourPanoramas.length > 0 && selectedPanorama === null) {
      setSelectedPanorama(tourPanoramas[0].id);
    }
  }, [hotspots, tourPanoramas, selectedPanorama]);

  const handleCreateHotspot = async () => {
    if (!hotspotData.from_panorama_id || !hotspotData.to_panorama_id) {
      toast.error('Выберите начальную и конечную панорамы');
      return;
    }

    try {
      await tourAPI.createHotspot(tourId, hotspotData);
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
      onSave(); // Refresh data
    } catch (err: any) {
      console.error('Ошибка создания перехода:', err);
      toast.error('Ошибка создания перехода: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const handleRemoveHotspot = async (hotspotId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот переход?')) {
      return;
    }

    try {
      await tourAPI.deleteHotspot(hotspotId);
      toast.success('Переход удален');
      onSave(); // Refresh data
    } catch (err: any) {
      console.error('Ошибка удаления перехода:', err);
      toast.error('Ошибка удаления перехода: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
    }
  };

  const getConnectionPath = (fromId: number, toId: number) => {
    const fromElement = panoramaRefs.current[fromId];
    const toElement = panoramaRefs.current[toId];
    
    if (!fromElement || !toElement) return '';
    
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    
    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;
    const toX = toRect.left + toRect.width / 2;
    const toY = toRect.top + toRect.height / 2;
    
    // Calculate control points for curved line
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const ctrlX = midX + (toY - fromY) * 0.3; // Perpendicular offset for curve
    const ctrlY = midY - (toX - fromX) * 0.3;
    
    return `M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY} ${toX} ${toY}`;
  };

  const getHotspotIdByConnection = (fromId: number, toId: number) => {
    const hotspot = hotspots.find(h => 
      h.from_panorama_id === fromId && h.to_panorama_id === toId
    );
    return hotspot ? hotspot.id : null;
  };

  return (
    <div className="space-y-6">
      {/* Visual Editor */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Визуальный редактор переходов</h2>
          <button
            onClick={() => setShowHotspotCreator(true)}
            className="btn-primary flex items-center text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Добавить переход
          </button>
        </div>
        
        <div className="relative bg-gray-50 rounded-lg p-6 min-h-[500px] overflow-auto">
          {/* Connections SVG overlay */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            {connections.map((connection, index) => {
              const isHovered = hoveredConnection && 
                hoveredConnection.from === connection.from && 
                hoveredConnection.to === connection.to;
              
              return (
                <path
                  key={index}
                  d={getConnectionPath(connection.from, connection.to)}
                  stroke={isHovered ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={isHovered ? "3" : "2"}
                  fill="none"
                  strokeDasharray={isHovered ? "0" : "5,5"}
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>
          
          {/* Panoramas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-20">
            {tourPanoramas.map((panorama) => {
              const isSelected = selectedPanorama === panorama.id;
              const outgoingConnections = connections.filter(c => c.from === panorama.id);
              const incomingConnections = connections.filter(c => c.to === panorama.id);
              
              return (
                <div
                  key={panorama.id}
                  ref={el => panoramaRefs.current[panorama.id] = el}
                  className={`relative border-2 rounded-xl p-4 transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPanorama(panorama.id)}
                >
                  {/* Panorama Image */}
                  <div className="flex items-center mb-3">
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
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{panorama.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{panorama.description || 'Без описания'}</p>
                    </div>
                  </div>
                  
                  {/* Connection Indicators */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                        {outgoingConnections.length} →
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        ← {incomingConnections.length}
                      </span>
                    </div>
                    
                    {/* Visual indicators for connections */}
                    <div className="flex space-x-1">
                      {outgoingConnections.map((conn, idx) => (
                        <div
                          key={idx}
                          className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"
                          title={`Переход в панораму ${tourPanoramas.find(p => p.id === conn.to)?.title || conn.to}`}
                          onMouseEnter={() => setHoveredConnection(conn)}
                          onMouseLeave={() => setHoveredConnection(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            const hotspotId = getHotspotIdByConnection(conn.from, conn.to);
                            if (hotspotId) {
                              handleRemoveHotspot(hotspotId);
                            }
                          }}
                        />
                      ))}
                      {incomingConnections.map((conn, idx) => (
                        <div
                          key={idx}
                          className="w-3 h-3 rounded-full bg-blue-500 cursor-pointer"
                          title={`Переход из панорамы ${tourPanoramas.find(p => p.id === conn.from)?.title || conn.from}`}
                          onMouseEnter={() => setHoveredConnection(conn)}
                          onMouseLeave={() => setHoveredConnection(null)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Arrow indicators */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {tourPanoramas.findIndex(p => p.id === panorama.id) + 1}
                  </div>
                </div>
              );
            })}
          </div>
          
          {tourPanoramas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">В туре пока нет панорам</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Details */}
      {hoveredConnection && (
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Соединение между панорамами</h3>
              <p className="text-sm text-blue-700">
                {tourPanoramas.find(p => p.id === hoveredConnection.from)?.title} →{' '}
                {tourPanoramas.find(p => p.id === hoveredConnection.to)?.title}
              </p>
            </div>
            <button
              onClick={() => {
                const hotspotId = getHotspotIdByConnection(hoveredConnection.from, hoveredConnection.to);
                if (hotspotId) {
                  handleRemoveHotspot(hotspotId);
                }
                setHoveredConnection(null);
              }}
              className="btn-danger text-sm flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* Selected Panorama Info */}
      {selectedPanorama && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Выбранная панорама</h3>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={`http://localhost:5000/api/panoramas/${selectedPanorama}/image`}
                alt={tourPanoramas.find(p => p.id === selectedPanorama)?.title || ''}
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
            <div className="ml-4">
              <h4 className="font-medium text-gray-900">
                {tourPanoramas.find(p => p.id === selectedPanorama)?.title}
              </h4>
              <p className="text-sm text-gray-500">
                {tourPanoramas.find(p => p.id === selectedPanorama)?.description || 'Без описания'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating hotspot */}
      {showHotspotCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Создать переход</h3>
              <button
                onClick={() => setShowHotspotCreator(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-6 w-6" />
              </button>
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
                className="btn-primary"
              >
                Создать переход
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualTransitionEditor;