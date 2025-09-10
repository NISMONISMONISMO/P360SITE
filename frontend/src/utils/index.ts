import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединение классов Tailwind CSS с разрешением конфликтов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование размера файла в человекочитаемый вид
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Форматирование даты
 */
export function formatDate(dateString: string, locale: string = 'ru-RU'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматирование относительного времени
 */
export function formatRelativeTime(dateString: string, locale: string = 'ru-RU'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Только что';
  } else if (diffInHours < 24) {
    return `${diffInHours} ч. назад`;
  } else if (diffInHours < 24 * 7) {
    const days = Math.floor(diffInHours / 24);
    return `${days} дн. назад`;
  } else {
    return formatDate(dateString, locale);
  }
}

/**
 * Генерация случайного ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Дебаунс функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Троттлинг функция
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Проверка поддержки WebGL
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

/**
 * Проверка мобильного устройства
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Получение размеров экрана
 */
export function getScreenSize(): { width: number; height: number; isMobile: boolean } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
  };
}

/**
 * Скачивание файла
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Копирование текста в буфер обмена
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Валидация email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Валидация пароля
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Пароль должен содержать буквы');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Обрезка текста
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Получение инициалов из имени
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

/**
 * Генерация цвета для аватара по имени
 */
export function getAvatarColor(name: string): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', 
    '#F59E0B', '#EF4444', '#EC4899', '#6366F1'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Преобразование URL в blob
 */
export async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return await response.blob();
}

/**
 * Обработка ошибок API
 */
export function handleApiError(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'Произошла неизвестная ошибка';
  }
}

/**
 * Форматирование числа с разделителями
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU');
}

/**
 * Получение контрастного цвета для текста
 */
export function getContrastColor(hexColor: string): string {
  // Убираем # если есть
  const color = hexColor.replace('#', '');
  
  // Конвертируем в RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Вычисляем яркость
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Создание URL для sharing в социальных сетях
 */
export function createShareUrl(platform: string, url: string, title: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  
  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'vk':
      return `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    default:
      return url;
  }
}

/**
 * Обнаружение максимального размера текстуры WebGL
 */
export function detectMaxTextureSize(): number {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      // Если WebGL недоступен, возвращаем минимальное значение
      return 2048;
    }
    
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    console.log(`WebGL MAX_TEXTURE_SIZE: ${maxTextureSize}`);
    
    // Ограничиваем максимальное значение для стабильности
    return Math.min(maxTextureSize, 8192);
  } catch (error) {
    console.warn('Failed to detect WebGL max texture size:', error);
    // Возвращаем безопасное значение по умолчанию
    return 2048;
  }
}

/**
 * Получение рекомендуемого разрешения панорамы на основе устройства
 */
export function getRecommendedPanoramaQuality(): {
  maxResolution: number;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
} {
  // Получаем максимальный размер текстуры WebGL
  const maxTextureSize = detectMaxTextureSize();
  
  // Определяем качество на основе максимального размера текстуры
  let qualityLevel: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
  let maxResolution = 4000;
  
  if (maxTextureSize >= 8192) {
    qualityLevel = 'ultra';
    maxResolution = 8000;
  } else if (maxTextureSize >= 4096) {
    qualityLevel = 'high';
    maxResolution = 6000;
  } else if (maxTextureSize >= 2048) {
    qualityLevel = 'medium';
    maxResolution = 4000;
  } else {
    qualityLevel = 'low';
    maxResolution = 2500;
  }
  
  // Учитываем мобильные устройства
  if (isMobile()) {
    // Для мобильных устройств снижаем качество для лучшей производительности
    switch (qualityLevel) {
      case 'ultra':
        qualityLevel = 'high';
        maxResolution = 6000;
        break;
      case 'high':
        qualityLevel = 'medium';
        maxResolution = 4000;
        break;
      case 'medium':
        qualityLevel = 'low';
        maxResolution = 2500;
        break;
      default:
        maxResolution = 2000;
    }
  }
  
  console.log(`Recommended panorama quality: ${qualityLevel} (${maxResolution}p) based on max texture size: ${maxTextureSize}`);
  
  return { maxResolution, qualityLevel };
}
