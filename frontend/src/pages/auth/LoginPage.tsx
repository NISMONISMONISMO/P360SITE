import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Получаем путь, откуда пришел пользователь
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      
      console.log('Login successful:', response);
      
      // Используем AuthContext для сохранения данных
      login(response.access_token, response.user);
      
      console.log('User data saved:', response.user);
      console.log('Is admin?', response.user.is_admin);
      
      // Перенаправляем в зависимости от роли или обратно туда, откуда пришел
      if (response.user.is_admin && from === '/dashboard') {
        console.log('Redirecting to admin panel...');
        navigate('/admin');
      } else {
        console.log('Redirecting to:', from);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-gray via-white to-purple-50">
      {/* Header */}
      <div className="relative pt-6 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-primary-500 hover:text-primary-600 transition-colors">
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Вернуться на главную
          </Link>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 pb-20">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="card p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-sunset-orange to-sunset-red rounded-full mb-4">
                <span className="text-2xl font-bold text-white">360</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать!</h2>
              <p className="text-gray-600">Войдите в свой аккаунт Panorama 360 App</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
                  Email или имя пользователя
                </label>
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={formData.login}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Введите email или имя пользователя"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Введите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Нет аккаунта?{' '}
                <Link to="/auth/register" className="text-primary-500 hover:text-primary-600 font-medium">
                  Зарегистрироваться
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-2">Демо доступ:</p>
              <p className="text-xs text-blue-600">Администратор: admin / 209030Tes!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;