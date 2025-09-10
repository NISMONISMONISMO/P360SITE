import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface UploadFormData {
  title: string;
  description: string;
  is_public: boolean;
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    is_public: true
  });

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/auth/login');
    }
  }, [navigate]);

  const validateFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return 'Неподдерживаемый формат файла. Используйте JPG, JPEG или PNG';
    }

    if (file.size > maxSize) {
      return 'Файл слишком большой. Максимальный размер: 50MB';
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Теперь принимаем любые изображения - никаких ограничений по соотношению сторон!
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    
    // Автоматически заполняем название
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setFormData(prev => ({ ...prev, title: fileName }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    if (!formData.title.trim()) {
      setError('Название панорамы обязательно');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title.trim());
      uploadFormData.append('description', formData.description.trim());
      uploadFormData.append('is_public', formData.is_public.toString());

      const token = localStorage.getItem('access_token');
      
      // Симуляция progress бара
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('http://localhost:5000/api/panoramas/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        setSuccess('Панорама успешно загружена!');
        
        // Очищаем форму
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Ошибка загрузки');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Загрузка панорамы</h1>
              <p className="text-gray-600">Загрузите свою 360° панораму и поделитесь с миром</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              К моим панорамам
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Полезная аннотация о качестве панорам */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-1" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  📝 Рекомендации для идеального качества панорам
                </h3>
                <div className="space-y-4 text-sm text-blue-800">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-900">✨ Оптимальные пропорции:</h4>
                      <ul className="space-y-1 text-blue-700">
                        <li>• <strong>2:1</strong> - стандарт equirectangular (напр. 4096×2048)</li>
                        <li>• <strong>2.78:1</strong> - широкие панорамы (напр. 10000×3600)</li>
                        <li>• <strong>1.5:1</strong> - компактные панорамы</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-900">📷 Лучшие разрешения:</h4>
                      <ul className="space-y-1 text-blue-700">
                        <li>• <strong>4K:</strong> 4096×2048 - отличное качество</li>
                        <li>• <strong>6K:</strong> 6144×3072 - премиум качество</li>
                        <li>• <strong>8K+:</strong> 8192×4096+ - максимальное качество</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-60 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🎯 Важно знать:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Наша система <strong>автоматически адаптирует</strong> любые пропорции для идеального отображения</li>
                      <li>• Поддерживаются <strong>любые размеры</strong> - от 1000×500 до 20000×10000 и больше</li>
                      <li>• Высокое разрешение обеспечивает <strong>четкость</strong> при приближении</li>
                      <li>• Отображение как в <strong>Google Street View</strong> - без искажений и швов</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-center mt-4">
                    <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                      🚀 Поддержка всех форматов и размеров 360° панорам
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Файл загрузки */}
            <div className="card p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Выберите файл</h2>
              
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    isDragging 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Перетащите файл сюда
                  </h3>
                  <p className="text-gray-600 mb-4">или</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary"
                  >
                    Выбрать файл
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-4">
                    Поддерживаемые форматы: JPG, JPEG, PNG (макс 50MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl!}
                      alt="Превью панорамы"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Название: {selectedFile.name}</span>
                    <span>Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Вы можете изменить название панорамы в поле ниже перед загрузкой
                  </div>
                </div>
              )}
            </div>

            <div className="card p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Информация о панораме</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Название панорамы *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Введите название панорамы"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Описание (необязательно)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Опишите вашу панораму..."
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    id="is_public"
                    name="is_public"
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                    Сделать панораму публичной
                  </label>
                  {formData.is_public ? (
                    <EyeIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <p className="text-green-600">{success}</p>
              </div>
            )}

            {isUploading && (
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Загрузка...</h3>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{Math.round(uploadProgress)}% завершено</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
                disabled={isUploading}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile || !formData.title.trim()}
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Загрузка...' : 'Загрузить панораму'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;