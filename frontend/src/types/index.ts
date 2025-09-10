export interface User {
  id: number;
  username: string;
  email: string;
  subscription_type: 'free' | 'premium';
  subscription_expires: string | null;
  role: 'user' | 'admin';
  created_at: string;
  is_premium: boolean;
  is_admin: boolean;
}

export interface Panorama {
  id: number;
  user_id: number;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  width?: number;  // Ширина изображения в пикселях
  height?: number; // Высота изображения в пикселях
  upload_date: string;
  expires_at: string | null;
  is_permanent: boolean;
  view_count: number;
  is_public: boolean;
  embed_code: string;
  is_expired: boolean;
  owner?: string;
  hotspots?: Hotspot[];
}

export interface Tour {
  id: number;
  user_id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  embed_code: string;
  panoramas_count: number;
  first_panorama_id?: number;
  owner?: string;
  panoramas?: Panorama[];
}

export interface Hotspot {
  id: number;
  from_panorama_id: number;
  to_panorama_id: number;
  position_x: number;
  position_y: number;
  position_z: number;
  title: string;
  description: string;
}

export interface TourPanorama {
  id: number;
  tour_id: number;
  panorama_id: number;
  position_x: number;
  position_y: number;
  position_z: number;
  order_index: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Типы для форм
export interface LoginForm {
  login: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UploadPanoramaForm {
  title: string;
  description: string;
  is_public: boolean;
  file: File | null;
}

export interface CreateTourForm {
  title: string;
  description: string;
  is_public: boolean;
}

// Языковые настройки
export type Language = 'ru' | 'en';

export interface LanguageConfig {
  code: Language;
  name: string;
  flag: string;
}

// Уведомления
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// Статистика
export interface UserStats {
  panoramas: {
    total: number;
    active: number;
    expired: number;
    total_views: number;
  };
  tours: {
    total: number;
  };
  daily_uploads: Array<{
    date: string;
    uploads: number;
  }>;
}

export interface SubscriptionStatus {
  subscription: {
    type: string;
    is_premium: boolean;
    expires_at: string | null;
    can_upload: boolean;
  };
  usage: {
    today_uploads: number;
    daily_limit: number | null;
    total_panoramas: number;
    total_tours: number;
  };
}

// Конфигурация приложения
export interface AppConfig {
  apiUrl: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  supportedLanguages: LanguageConfig[];
}