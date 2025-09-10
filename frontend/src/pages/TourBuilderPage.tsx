import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LinkIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  InformationCircleIcon,
  XMarkIcon as XIcon
} from '@heroicons/react/24/outline';
import { tourAPI, panoramaAPI } from '@/api';
import { Panorama, Tour } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import TourEditor from '@/components/TourEditor';
import TourPanoramaUploader from '@/components/TourPanoramaUploader'; // Новый импорт
import TourViewer from '@/components/TourViewer';

const TourBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tourFileInputRef = useRef<HTMLInputElement>(null); // Новый ref для загрузки в тур
  
  // Состояния для данных тура
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [tourPanoramas, setTourPanoramas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Состояния для выбора панорам
  const [showPanoramaSelector, setShowPanoramaSelector] = useState(false);
  const [selectedPanoramas, setSelectedPanoramas] = useState<number[]>([]);
  
  // Состояния для загрузки панорам в тур
  const [isUploadingToTour, setIsUploadingToTour] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // Состояния для редактирования
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [showTourEditor, setShowTourEditor] = useState(false);
  
  // Состояние для предпросмотра тура
  const [showTourPreview, setShowTourPreview] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    loadInitialData();
  }, [id, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Загружаем доступные панорамы пользователя
      const panoramasResponse = await panoramaAPI.getList();
      setPanoramas(panoramasResponse.panoramas);
      
      // Если редактируем тур, загружаем его данные
      if (isEditMode && id) {
        const tourResponse = await tourAPI.getById(parseInt(id));
        const tour = tourResponse.tour;
        
        setEditingTour(tour);
        setTitle(tour.title);
        setDescription(tour.description || '');
        setIsPublic(tour.is_public);
        
        // Загружаем панорамы тура
        if (tour.panoramas) {
          setTourPanoramas(tour.panoramas.map((p: any, index: number) => ({
            ...p,
            order_index: index
          })));
        }
      }
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки данных');
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTour = async () => {
    if (!title.trim()) {
      toast.error('Укажите название тура');
      return;
    }
    
    if (tourPanoramas.length === 0) {
      toast.error('Добавьте хотя бы одну панораму в тур');
      return;
    }
    
    // Проверяем авторизацию
    if (!isAuthenticated || !user) {
      toast.error('Ошибка аутентификации. Пожалуйста, войдите в систему заново.');
      navigate('/auth/login');
      return;
    }
    
    // Проверяем наличие токена
    const token = localStorage.getItem('access_token');
    console.log('Token:', token);
    console.log('User:', user);
    
    if (!token) {
      toast.error('Ошибка аутентификации. Пожалуйста, войдите в систему заново.');
      navigate('/auth/login');
      return;
    }
    
    try {
      setSaving(true);
      
      let tourId;
      
      if (isEditMode && editingTour) {
        // Обновляем существующий тур
        const updateData = {
          title,
          description,
          is_public: isPublic
        };
        
        await tourAPI.update(editingTour.id, updateData);
        tourId = editingTour.id;
        toast.success('Тур обновлен');
      } else {
        // Создаем новый тур
        const tourData = {
          title,
          description,
          is_public: isPublic
        };
        
        console.log('Creating tour with data:', tourData);
        const response = await tourAPI.create(tourData);
        const newTour = response.tour;
        tourId = newTour.id;
        console.log('Tour created:', newTour);
      }
      
      // Для новых туров добавляем панорамы
      if (!isEditMode && tourId && tourPanoramas.length > 0) {
        // Добавляем панорамы в тур
        let successCount = 0;
        for (let i = 0; i < tourPanoramas.length; i++) {
          const panorama = tourPanoramas[i];
          console.log(`Adding panorama ${panorama.id} to tour ${tourId}`);
          try {
            await tourAPI.addPanorama(tourId, {
              panorama_id: panorama.id,
              order_index: i
            });
            successCount++;
          } catch (panoramaError: any) {
            console.error(`Error adding panorama ${panorama.id} to tour:`, panoramaError);
            toast.error(`Ошибка при добавлении панорамы "${panorama.title}": ${panoramaError.response?.data?.error || 'Неизвестная ошибка'}`);
            // Continue with other panoramas even if one fails
          }
        }
        
        if (successCount > 0) {
          toast.success(`Тур создан. Добавлено панорам: ${successCount}`);
        }
        // Используем правильный маршрут для просмотра тура
        navigate(`/tour/${tourId}`);
        return;
      }
      
      // Для редактирования тура обновляем панорамы
      if (isEditMode && tourId && editingTour) {
        // Получаем текущие панорамы тура
        const currentTourResponse = await tourAPI.getById(tourId);
        const currentTourPanoramas = currentTourResponse.tour.panoramas || [];
        
        // Определяем панорамы для удаления
        const panoramasToRemove = currentTourPanoramas.filter(
          (tp: any) => !tourPanoramas.some((p: any) => p.id === tp.id)
        );
        
        // Определяем панорамы для добавления
        const panoramasToAdd = tourPanoramas.filter(
          (p: any) => !currentTourPanoramas.some((tp: any) => tp.id === p.id)
        );
        
        // Удаляем панорамы
        for (const tp of panoramasToRemove) {
          try {
            await tourAPI.removePanorama(tourId, tp.id);
          } catch (error: any) {
            console.error(`Error removing panorama ${tp.id} from tour:`, error);
            toast.error(`Ошибка при удалении панорамы "${tp.title}": ${error.response?.data?.error || 'Неизвестная ошибка'}`);
          }
        }
        
        // Добавляем новые панорамы
        for (let i = 0; i < panoramasToAdd.length; i++) {
          const panorama = panoramasToAdd[i];
          try {
            await tourAPI.addPanorama(tourId, {
              panorama_id: panorama.id,
              order_index: tourPanoramas.findIndex((p: any) => p.id === panorama.id)
            });
          } catch (error: any) {
            console.error(`Error adding panorama ${panorama.id} to tour:`, error);
            toast.error(`Ошибка при добавлении панорамы "${panorama.title}": ${error.response?.data?.error || 'Неизвестная ошибка'}`);
          }
        }
        
        toast.success('Тур обновлен');
        // Обновляем данные редактируемого тура
        if (editingTour) {
          const updatedTourResponse = await tourAPI.getById(tourId);
          setEditingTour(updatedTourResponse.tour);
        }
        // Перезагружаем начальные данные для обновления редактора переходов
        await loadInitialData();
        return;
      }
      
      // После сохранения перенаправляем на страницу просмотра тура
      if (tourId) {
        // Используем правильный маршрут для просмотра тура
        navigate(`/tour/${tourId}`);
      }
    } catch (err: any) {
      console.error('Ошибка сохранения тура:', err);
      console.error('Error response:', err.response);
      
      // Проверяем специфические ошибки
      if (err.response?.status === 401) {
        toast.error('Сессия истекла. Пожалуйста, войдите в систему заново.');
        navigate('/auth/login');
      } else if (err.response?.status === 403) {
        toast.error('Недостаточно прав для выполнения операции. Проверьте, что вы вошли в систему и имеете необходимые разрешения.');
      } else if (err.response?.status === 400) {
        toast.error(`Некорректные данные: ${err.response?.data?.error || 'Проверьте введенные данные'}`);
      } else if (err.response?.status === 500) {
        toast.error('Внутренняя ошибка сервера. Попробуйте позже или обратитесь к администратору.');
      } else {
        toast.error(err.response?.data?.error || 'Ошибка сохранения тура. Попробуйте еще раз.');
      }
      
      // Дополнительно проверяем, есть ли информация о пользователе
      const savedUser = localStorage.getItem('user');
      console.log('Saved user:', savedUser);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPanoramas = () => {
    setShowPanoramaSelector(true);
  };

  const handleSelectPanorama = (panoramaId: number) => {
    if (selectedPanoramas.includes(panoramaId)) {
      setSelectedPanoramas(selectedPanoramas.filter(id => id !== panoramaId));
    } else {
      setSelectedPanoramas([...selectedPanoramas, panoramaId]);
    }
  };

  const handleConfirmPanoramaSelection = () => {
    const selectedPanoramaObjects = panoramas.filter(p => selectedPanoramas.includes(p.id));
    
    // Добавляем выбранные панорамы в тур
    const newTourPanoramas = [...tourPanoramas];
    selectedPanoramaObjects.forEach(panorama => {
      // Проверяем, что панорама еще не добавлена
      if (!newTourPanoramas.some(tp => tp.id === panorama.id)) {
        newTourPanoramas.push({
          ...panorama,
          order_index: newTourPanoramas.length
        });
      }
    });
    
    setTourPanoramas(newTourPanoramas);
    setSelectedPanoramas([]);
    setShowPanoramaSelector(false);
  };

  const handleRemovePanorama = (panoramaId: number) => {
    setTourPanoramas(tourPanoramas.filter(tp => tp.id !== panoramaId));
  };

  const handleMovePanorama = (panoramaId: number, direction: 'up' | 'down') => {
    const index = tourPanoramas.findIndex(tp => tp.id === panoramaId);
    if (index === -1) return;
    
    const newTourPanoramas = [...tourPanoramas];
    
    if (direction === 'up' && index > 0) {
      // Меняем местами с предыдущим элементом
      [newTourPanoramas[index], newTourPanoramas[index - 1]] = 
      [newTourPanoramas[index - 1], newTourPanoramas[index]];
    } else if (direction === 'down' && index < newTourPanoramas.length - 1) {
      // Меняем местами со следующим элементом
      [newTourPanoramas[index], newTourPanoramas[index + 1]] = 
      [newTourPanoramas[index + 1], newTourPanoramas[index]];
    }
    
    // Обновляем индексы
    const updatedTourPanoramas = newTourPanoramas.map((tp, i) => ({
      ...tp,
      order_index: i
    }));
    
    setTourPanoramas(updatedTourPanoramas);
  };

  const handleViewPanorama = (panoramaId: number) => {
    window.open(`/panorama/${panoramaId}`, '_blank');
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setSaving(true);
      const uploadedPanoramas: Panorama[] = [];

      // Загружаем каждый файл
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Имя файла без расширения
        formData.append('description', `Загружено для тура: ${title || 'Новый тур'}`);
        formData.append('is_public', isPublic.toString());
        formData.append('file', file);

        const response = await panoramaAPI.upload(formData);
        uploadedPanoramas.push(response.panorama);
        toast.success(`Панорама "${file.name}" загружена`);
      }

      // Добавляем загруженные панорамы в тур
      const newTourPanoramas = [...tourPanoramas];
      uploadedPanoramas.forEach(panorama => {
        if (!newTourPanoramas.some(tp => tp.id === panorama.id)) {
          newTourPanoramas.push({
            ...panorama,
            order_index: newTourPanoramas.length
          });
        }
      });

      setTourPanoramas(newTourPanoramas);
      
      // Обновляем список доступных панорам
      const panoramasResponse = await panoramaAPI.getList();
      setPanoramas(panoramasResponse.panoramas);
    } catch (err: any) {
      console.error('Ошибка загрузки файлов:', err);
      toast.error('Ошибка загрузки файлов: ' + (err.response?.data?.error || 'Попробуйте еще раз'));
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTourFileSelect = async (file: File, title: string, description: string = '') => {
    if (!editingTour && !isEditMode) {
      // Если мы создаем новый тур, сначала создаем его
      if (!title.trim()) {
        toast.error('Укажите название тура');
        return;
      }
      
      try {
        const tourData = {
          title,
          description,
          is_public: isPublic
        };
        
        const response = await tourAPI.create(tourData);
        const newTour = response.tour;
        setEditingTour(newTour);
        navigate(`/tours/${newTour.id}/edit`, { replace: true });
        return newTour.id;
      } catch (error: any) {
        console.error('Error creating tour:', error);
        toast.error('Ошибка создания тура: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
        return null;
      }
    }
    
    return editingTour?.id || (id ? parseInt(id) : null);
  };

  const uploadPanoramaToTour = async (file: File, title: string, description: string = '') => {
    if (!file || !title.trim()) {
      toast.error('Выберите файл и укажите название');
      return;
    }
    
    // Получаем ID тура
    let tourId = editingTour?.id;
    if (!tourId && isEditMode && id) {
      tourId = parseInt(id);
    }
    
    if (!tourId) {
      toast.error('Тур не создан');
      return;
    }
    
    setIsUploadingToTour(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (description) {
        formData.append('description', description);
      }
      
      const response = await tourAPI.uploadPanorama(tourId, formData);
      
      // Добавляем новую панораму в список панорам тура
      setTourPanoramas(prev => [...prev, response.panorama]);
      
      toast.success('Панорама загружена и добавлена в тур');
    } catch (error: any) {
      console.error('Error uploading panorama to tour:', error);
      setUploadError(error.response?.data?.error || 'Ошибка загрузки панорамы');
      toast.error('Ошибка загрузки панорамы: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
    } finally {
      setIsUploadingToTour(false);
      setUploadProgress(0);
    }
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
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Назад
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Редактирование тура' : 'Создание виртуального тура'}
            </h1>
            
            <div></div> {/* Пустой элемент для выравнивания */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная форма */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Основная информация</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название тура *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="Введите название тура"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    placeholder="Описание тура (необязательно)"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Сделать тур публичным
                  </label>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Панорамы в туре</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddPanoramas}
                    className="btn-secondary flex items-center text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Добавить существующие
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={saving}
                    className="btn-primary flex items-center text-sm disabled:opacity-50"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    Загрузить новые
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>
              </div>
              
              {tourPanoramas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <LinkIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-4">В туре пока нет панорам</p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleAddPanoramas}
                      className="btn-secondary"
                    >
                      Добавить существующие
                    </button>
                    <button
                      onClick={handleFileUpload}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50"
                    >
                      {saving ? 'Загрузка...' : 'Загрузить новые'}
                    </button>
                  </div>
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
                              parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><span class="text-white text-xs">Панорама</span></div>';
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
                          onClick={() => handleViewPanorama(panorama.id)}
                          className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100"
                          title="Просмотр панорамы"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleMovePanorama(panorama.id, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-primary-600 hover:bg-gray-100'}`}
                            title="Переместить вверх"
                          >
                            <ArrowUpIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMovePanorama(panorama.id, 'down')}
                            disabled={index === tourPanoramas.length - 1}
                            className={`p-1 rounded ${index === tourPanoramas.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-primary-600 hover:bg-gray-100'}`}
                            title="Переместить вниз"
                          >
                            <ArrowDownIcon className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemovePanorama(panorama.id)}
                          className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                          title="Удалить из тура"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Редактор переходов (только в режиме редактирования) */}
            {isEditMode && editingTour && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Редактор переходов</h2>
                  <button
                    onClick={() => setShowTourEditor(!showTourEditor)}
                    className="btn-secondary text-sm"
                  >
                    {showTourEditor ? 'Скрыть' : 'Показать'} редактор
                  </button>
                </div>
                
                {showTourEditor && (
                  <TourEditor tour={editingTour} onSave={loadInitialData} />
                )}
              </div>
            )}
          </div>
          
          {/* Панель информации */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о туре</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Панорам в туре:</span>
                  <span className="font-medium">{tourPanoramas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isPublic ? 'Публичный' : 'Приватный'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Как создать тур</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">1.</span>
                  <span>Заполните название и описание тура</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">2.</span>
                  <span>Добавьте панорамы в тур</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">3.</span>
                  <span>Упорядочите панорамы в нужной последовательности</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">4.</span>
                  <span>Сохраните тур</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">5.</span>
                  <span>После создания можно добавить переходы между панорамами</span>
                </li>
              </ul>
              
              {/* Кнопка предпросмотра тура */}
              <div className="mt-4">
                <button
                  onClick={() => setShowTourPreview(true)}
                  disabled={tourPanoramas.length === 0}
                  className="w-full btn-secondary flex items-center justify-center px-4 py-2 text-sm disabled:opacity-50"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Предпросмотр тура
                </button>
              </div>
              
              {/* Кнопка сохранения тура */}
              <div className="mt-4">
                <button
                  onClick={handleSaveTour}
                  disabled={saving}
                  className="w-full btn-primary flex items-center justify-center px-4 py-2 text-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Сохранить тур' : 'Создать тур'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Модальное окно выбора панорам */}
      {showPanoramaSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Выберите панорамы</h3>
              <p className="text-sm text-gray-500">Выберите панорамы для добавления в тур</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {panoramas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">У вас нет доступных панорам</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {panoramas.map((panorama) => {
                    const isSelected = selectedPanoramas.includes(panorama.id);
                    const isInTour = tourPanoramas.some(tp => tp.id === panorama.id);
                    
                    return (
                      <div 
                        key={panorama.id}
                        onClick={() => !isInTour && handleSelectPanorama(panorama.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isInTour 
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                            : isSelected 
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-50' 
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
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
                                  parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><span class="text-white text-xs">Панорама</span></div>';
                                }
                              }}
                            />
                          </div>
                          
                          <div className="ml-4 flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {panorama.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {panorama.description || 'Без описания'}
                            </p>
                            <div className="flex items-center mt-2 text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                panorama.is_public 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {panorama.is_public ? 'Публичная' : 'Приватная'}
                              </span>
                            </div>
                          </div>
                          
                          {isInTour ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              В туре
                            </span>
                          ) : (
                            <div className={`flex items-center justify-center w-5 h-5 rounded border ${
                              isSelected 
                                ? 'bg-primary-500 border-primary-500' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPanoramaSelector(false);
                  setSelectedPanoramas([]);
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmPanoramaSelection}
                disabled={selectedPanoramas.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                Добавить выбранные ({selectedPanoramas.length})
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно предпросмотра тура */}
      {showTourPreview && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Предпросмотр тура</h3>
              <button
                onClick={() => setShowTourPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {tourPanoramas.length > 0 ? (
                <div className="h-full">
                  <TourViewer 
                    embedMode={true}
                    tour={{
                      id: editingTour?.id || 0,
                      user_id: user?.id || 0,
                      title: title || 'Предпросмотр тура',
                      description: description || '',
                      panoramas: tourPanoramas,
                      is_public: isPublic,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      embed_code: 'preview',
                      panoramas_count: tourPanoramas.length,
                      first_panorama_id: tourPanoramas.length > 0 ? tourPanoramas[0].id : undefined
                    }}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">В туре нет панорам для предпросмотра</p>
                    <button
                      onClick={() => setShowTourPreview(false)}
                      className="btn-primary"
                    >
                      Назад к редактированию
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-500">
              Это предварительный просмотр. Панорамы могут отображаться с небольшой задержкой.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourBuilderPage;