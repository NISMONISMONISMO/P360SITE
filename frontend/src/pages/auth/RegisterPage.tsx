import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const validateUsername = (username: string) => {
    return username.length >= 3 && /^[a-zA-Z0-9]+$/.test(username);
  };

  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');

    // Обновляем валидации
    const newValidations = { ...validations };
    
    switch (name) {
      case 'username':
        newValidations.username = validateUsername(value);
        break;
      case 'email':
        newValidations.email = validateEmail(value);
        break;
      case 'password':
        newValidations.password = validatePassword(value);
        newValidations.confirmPassword = formData.confirmPassword === value;
        break;
      case 'confirmPassword':
        newValidations.confirmPassword = formData.password === value;
        break;
    }
    
    setValidations(newValidations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Проверка паролей
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Сохраняем токен и данные пользователя
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Перенаправляем в личный кабинет
        navigate('/dashboard');
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.values(validations).every(v => v);

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

      {/* Register Form */}
      <div className="flex items-center justify-center px-4 pb-20">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="card p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-sunset-orange to-sunset-red rounded-full mb-4">
                <span className="text-2xl font-bold text-white">360</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Создайте аккаунт</h2>
              <p className="text-gray-600">Присоединяйтесь к Panorama 360 App</p>
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
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Имя пользователя
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      validations.username ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="Минимум 3 символа, только буквы и цифры"
                  />
                  {validations.username && (
                    <CheckIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email адрес
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      validations.email ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="example@mail.com"
                  />
                  {validations.email && (
                    <CheckIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
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
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      validations.password ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="Минимум 6 символов"
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
                  {validations.password && (
                    <CheckIcon className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      validations.confirmPassword ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="Повторите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  {validations.confirmPassword && (
                    <CheckIcon className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Создание...' : 'Создать аккаунт'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Уже есть аккаунт?{' '}
                <Link to="/auth/login" className="text-primary-500 hover:text-primary-600 font-medium">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;