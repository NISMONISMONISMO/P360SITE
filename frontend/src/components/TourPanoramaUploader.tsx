import React, { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface TourPanoramaUploaderProps {
  onUpload: (file: File, title: string, description: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string;
}

const TourPanoramaUploader: React.FC<TourPanoramaUploaderProps> = ({
  onUpload,
  isUploading,
  uploadProgress,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
      // В реальном приложении здесь должна быть обработка ошибок
      console.error(validationError);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // Автоматически заполняем название
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setTitle(fileName);
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
    setTitle('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      // В реальном приложении здесь должна быть обработка ошибок
      return;
    }

    if (!title.trim()) {
      // В реальном приложении здесь должна быть обработка ошибок
      return;
    }

    onUpload(selectedFile, title.trim(), description.trim());
  };

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Перетащите файл сюда
          </h3>
          <p className="text-gray-600 mb-4">или</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
            disabled={isUploading}
          >
            Выбрать файл
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
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
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              disabled={isUploading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Название: {selectedFile.name}</span>
            <span>Размер: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      )}

      {selectedFile && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Название панорамы *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Введите название панорамы"
              disabled={isUploading}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание (необязательно)
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Опишите вашу панораму..."
              disabled={isUploading}
            />
          </div>
          <button
            type="submit"
            disabled={isUploading || !title.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Загрузка...' : 'Загрузить в тур'}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {isUploading && (
        <div className="card p-4">
          <h3 className="text-md font-medium text-gray-900 mb-2">Загрузка...</h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">{Math.round(uploadProgress)}% завершено</p>
        </div>
      )}
    </div>
  );
};

export default TourPanoramaUploader;