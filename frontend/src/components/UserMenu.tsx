import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Crown,
  ChevronDown 
} from 'lucide-react';

interface UserMenuProps {
  isMobile?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ isMobile = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center space-x-4 ${isMobile ? 'flex-col space-y-4 space-x-0' : ''}`}>
        <Link 
          to="/auth/login" 
          className="text-accent-blue hover:text-primary-500 font-medium transition-colors"
        >
          Войти
        </Link>
        <Link 
          to="/auth/register" 
          className="btn-primary"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-2">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{user.username}</span>
              {user.subscription_type === 'premium' && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
              {user.is_admin && (
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 px-4">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 py-2"
          >
            <UserIcon className="w-4 h-4" />
            <span>Личный кабинет</span>
          </Link>
          
          <Link 
            to="/profile" 
            className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 py-2"
          >
            <Settings className="w-4 h-4" />
            <span>Настройки</span>
          </Link>
          
          {user.is_admin && (
            <Link 
              to="/admin" 
              className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 py-2"
            >
              <Crown className="w-4 h-4" />
              <span>Админ-панель</span>
            </Link>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 py-2 text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{user.username}</span>
          {user.subscription_type === 'premium' && (
            <Crown className="w-4 h-4 text-yellow-500" />
          )}
          {user.is_admin && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
              Admin
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{user.username}</span>
                    {user.subscription_type === 'premium' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.subscription_type === 'premium' && (
                    <p className="text-xs text-yellow-600 font-medium">Premium пользователь</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="py-2">
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                <span>Личный кабинет</span>
              </Link>
              
              <Link 
                to="/profile" 
                className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span>Настройки профиля</span>
              </Link>
              
              {user.is_admin && (
                <Link 
                  to="/admin" 
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Crown className="w-4 h-4" />
                  <span>Админ-панель</span>
                </Link>
              )}
            </div>
            
            <div className="border-t border-gray-100 py-2">
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;