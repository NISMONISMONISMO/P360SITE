import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  AuthResponse, 
  LoginForm, 
  RegisterForm, 
  Panorama, 
  Tour,
  CreateTourForm,
  UploadPanoramaForm,
  UserStats,
  SubscriptionStatus,
  PaginatedResponse,
  ApiResponse
} from '@/types';

// Создание экземпляра axios с относительным baseURL для использования прокси Vite
const api: AxiosInstance = axios.create({
  baseURL: '/api',  // Используем прокси Vite
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек, очищаем storage и перенаправляем на авторизацию
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API методы аутентификации
export const authAPI = {
  // Регистрация
  register: async (data: RegisterForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Авторизация
  login: async (data: LoginForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Выход
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  // Получение профиля
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data;
  },

  // Обновление профиля
  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    const response = await api.put<{ user: User }>('/auth/profile', data);
    return response.data;
  },

  // Смена пароля
  changePassword: async (data: { current_password: string; new_password: string }): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  // Обновление токена
  refreshToken: async (): Promise<{ access_token: string; user: User }> => {
    const response = await api.post<{ access_token: string; user: User }>('/auth/refresh');
    return response.data;
  },
};

// API методы панорам
export const panoramaAPI = {
  // Загрузка панорамы
  upload: async (data: FormData): Promise<{ panorama: Panorama }> => {
    const response = await api.post<{ panorama: Panorama }>('/panoramas/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Получение списка панорам
  getList: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ panoramas: Panorama[]; pagination: any }> => {
    const response = await api.get<{ panoramas: Panorama[]; pagination: any }>('/panoramas', { params });
    return response.data;
  },

  // Получение конкретной панорамы
  getById: async (id: number): Promise<{ panorama: Panorama; owner: string }> => {
    const response = await api.get<{ panorama: Panorama; owner: string }>(`/panoramas/${id}`);
    return response.data;
  },

  // Получение панорамы по embed коду
  getByEmbed: async (embedCode: string): Promise<{ panorama: Panorama; owner: string }> => {
    const response = await api.get<{ panorama: Panorama; owner: string }>(`/panoramas/embed/${embedCode}`);
    return response.data;
  },

  // Обновление панорамы
  update: async (id: number, data: Partial<Panorama>): Promise<{ panorama: Panorama }> => {
    const response = await api.put<{ panorama: Panorama }>(`/panoramas/${id}`, data);
    return response.data;
  },

  // Удаление панорамы
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/panoramas/${id}`);
    return response.data;
  },

  // Получение URL изображения панорамы
  getImageUrl: (id: number): string => {
    return `/api/panoramas/${id}/image`;
  },

  // Получение embed кода
  getEmbedCode: async (id: number): Promise<{ embed_code: string; embed_url: string }> => {
    const response = await api.get<{ embed_code: string; embed_url: string }>(`/panoramas/${id}/embed`);
    return response.data;
  },
};

// API методы туров
export const tourAPI = {
  // Создание тура
  create: async (data: CreateTourForm): Promise<{ tour: Tour }> => {
    console.log('Creating tour with data:', data);
    try {
      const response = await api.post<{ tour: Tour }>('/tours', data);
      console.log('Tour creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Tour creation error:', error);
      throw error;
    }
  },

  // Получение списка туров
  getList: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ tours: Tour[]; pagination: any }> => {
    const response = await api.get<{ tours: Tour[]; pagination: any }>('/tours', { params });
    return response.data;
  },

  // Получение конкретного тура
  getById: async (id: number): Promise<{ tour: Tour }> => {
    const response = await api.get<{ tour: Tour }>(`/tours/${id}`);
    return response.data;
  },

  // Получение тура по embed коду
  getByEmbed: async (embedCode: string): Promise<{ tour: Tour }> => {
    const response = await api.get<{ tour: Tour }>(`/tours/embed/${embedCode}`);
    return response.data;
  },

  // Обновление тура
  update: async (id: number, data: Partial<Tour>): Promise<{ tour: Tour }> => {
    const response = await api.put<{ tour: Tour }>(`/tours/${id}`, data);
    return response.data;
  },

  // Удаление тура
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/tours/${id}`);
    return response.data;
  },

  // Загрузка панорамы непосредственно в тур
  uploadPanorama: async (tourId: number, data: FormData): Promise<{ panorama: any; tour_panorama: any }> => {
    const response = await api.post<{ panorama: any; tour_panorama: any }>(`/tours/${tourId}/upload-panorama`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Добавление панорамы в тур
  addPanorama: async (tourId: number, data: {
    panorama_id: number;
    position_x?: number;
    position_y?: number;
    position_z?: number;
    order_index?: number;
  }): Promise<{ tour_panorama: any }> => {
    console.log(`Adding panorama to tour ${tourId} with data:`, data);
    try {
      const response = await api.post<{ tour_panorama: any }>(`/tours/${tourId}/panoramas`, data);
      console.log('Add panorama response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error adding panorama to tour ${tourId}:`, error);
      throw error;
    }
  },

  // Удаление панорамы из тура
  removePanorama: async (tourId: number, panoramaId: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/tours/${tourId}/panoramas/${panoramaId}`);
    return response.data;
  },

  // Удаление hotspot'а
  deleteHotspot: async (hotspotId: number): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/hotspots/${hotspotId}`);
    return response.data;
  },

  // Создание hotspot'а между панорамами в туре
  createHotspot: async (tourId: number, data: {
    from_panorama_id: number;
    to_panorama_id: number;
    position_x: number;
    position_y: number;
    position_z: number;
    title?: string;
    description?: string;
  }): Promise<{ hotspot: any }> => {
    const response = await api.post<{ hotspot: any }>(`/tours/${tourId}/hotspots`, data);
    return response.data;
  },

  // Получение embed кода тура
  getEmbedCode: async (id: number): Promise<{ embed_code: string; embed_url: string }> => {
    const response = await api.get<{ embed_code: string; embed_url: string }>(`/tours/${id}/embed`);
    return response.data;
  },
};

// API методы пользователя
export const userAPI = {
  // Обновление подписки
  upgradeSubscription: async (data: {
    subscription_type: string;
    duration_months: number;
  }): Promise<{ user: User }> => {
    const response = await api.post<{ user: User }>('/users/subscription/upgrade', data);
    return response.data;
  },

  // Получение статуса подписки
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await api.get<SubscriptionStatus>('/users/subscription/status');
    return response.data;
  },

  // Получение статистики пользователя
  getStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/users/stats');
    return response.data;
  },

  // Получение панорам пользователя
  getPanoramas: async (params?: {
    page?: number;
    per_page?: number;
    status?: 'all' | 'active' | 'expired';
  }): Promise<{ panoramas: Panorama[]; pagination: any }> => {
    const response = await api.get<{ panoramas: Panorama[]; pagination: any }>('/users/panoramas', { params });
    return response.data;
  },

  // Получение туров пользователя
  getTours: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<{ tours: Tour[]; pagination: any }> => {
    const response = await api.get<{ tours: Tour[]; pagination: any }>('/users/tours', { params });
    return response.data;
  },
};

// API методы администратора
export const adminAPI = {
  // Статистика
  getStats: async (): Promise<{
    total_stats: any;
    subscription_stats: any[];
    registration_chart: any[];
    top_users: any[];
    recent_panoramas: any[];
  }> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Пользователи
  getUsers: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    subscription?: string;
    status?: string;
  }): Promise<{ users: any[]; pagination: any }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserSubscription: async (userId: number, data: {
    subscription_type: string;
    expires_at?: string;
  }): Promise<{ user: User }> => {
    const response = await api.put(`/admin/users/${userId}/subscription`, data);
    return response.data;
  },

  updateUserStatus: async (userId: number, data: {
    is_active: boolean;
  }): Promise<{ user: User }> => {
    const response = await api.put(`/admin/users/${userId}/status`, data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Модерация контента
  getAllPanoramas: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ panoramas: any[]; pagination: any }> => {
    const response = await api.get('/admin/panoramas', { params });
    return response.data;
  },

  deletePanorama: async (panoramaId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/admin/panoramas/${panoramaId}`);
    return response.data;
  },

  getAllTours: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<{ tours: any[]; pagination: any }> => {
    const response = await api.get('/admin/tours', { params });
    return response.data;
  },

  deleteTour: async (tourId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/admin/tours/${tourId}`);
    return response.data;
  },

  // Системные настройки
  getSettings: async (): Promise<any> => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  // Действия
  cleanupExpiredContent: async (): Promise<ApiResponse> => {
    const response = await api.post('/admin/cleanup');
    return response.data;
  },

  createBackup: async (): Promise<ApiResponse> => {
    const response = await api.post('/admin/backup');
    return response.data;
  },
};

// Общие методы API
export const commonAPI = {
  // Проверка здоровья API
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get<{ status: string; timestamp: string }>('/health');
    return response.data;
  },
};

export default api;