import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Camera, 
  Users, 
  Zap, 
  Shield, 
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Eye,
  Share2
} from 'lucide-react';
import UserMenu from '@/components/UserMenu';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 sunset-gradient rounded-2xl flex items-center justify-center mr-3">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-purple-900">Panorama 360 App</h1>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/explore" className="text-accent-blue hover:text-primary-500 font-medium transition-colors">
                Галерея
              </Link>
              <Link to="/tours" className="text-accent-blue hover:text-primary-500 font-medium transition-colors">
                Туры
              </Link>
              <UserMenu />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Background with sunset gradient overlay */}
        <div className="absolute inset-0 sunrise-gradient"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-sunset-yellow/30 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-sunset-red/20 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center text-white">
            <h1 className="text-7xl font-bold mb-8 leading-tight">
              Создавай
              <span className="block text-sunset-yellow drop-shadow-lg">
                360° панорамы
              </span>
            </h1>
            <p className="text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-white/90">
              Погрузись в мир бесконечных возможностей с Panorama 360 App. 
              Создавай потрясающие виртуальные туры и делись незабываемыми впечатлениями.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/auth/register" className="group px-10 py-4 bg-white text-primary-500 font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sunset-red/50">
                Начать создавать
                <ArrowRight className="ml-2 w-6 h-6 inline-block group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/explore" className="group glass px-10 py-4 text-white font-bold text-lg rounded-2xl hover:bg-white/20 transition-all duration-300">
                <Play className="mr-2 w-6 h-6 inline-block group-hover:scale-110 transition-transform" />
                Смотреть демо
              </Link>
            </div>
          </div>
          
          {/* Demo panorama preview */}
          <div className="mt-24">
            <div className="max-w-5xl mx-auto">
              <div className="glass rounded-3xl p-3 shadow-2xl">
                <div className="purple-mountains-gradient rounded-2xl h-96 flex items-center justify-center relative overflow-hidden">
                  {/* Placeholder for panorama viewer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-sunset-yellow/10 to-purple-500/10 animate-pulse"></div>
                  <div className="text-white text-center z-10">
                    <div className="w-20 h-20 mx-auto mb-6 sunset-gradient rounded-full flex items-center justify-center">
                      <Globe className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-2xl font-bold mb-2">Интерактивный 360° просмотр</p>
                    <p className="text-lg text-white/80">Нажми и перетащи для навигации</p>
                  </div>
                  
                  {/* Hotspot examples with sunset colors */}
                  <div className="absolute top-1/2 left-1/3 w-5 h-5 bg-sunset-yellow rounded-full animate-ping shadow-lg"></div>
                  <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-sunset-red rounded-full animate-ping shadow-lg" style={{animationDelay: '1s'}}></div>
                  <div className="absolute bottom-1/3 left-1/2 w-5 h-5 bg-primary-500 rounded-full animate-ping shadow-lg" style={{animationDelay: '2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-accent-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold text-purple-900 mb-8">
              Почему Panorama 360 App?
            </h2>
            <p className="text-2xl text-accent-blue max-w-4xl mx-auto leading-relaxed">
              Мы предоставляем все необходимые инструменты для создания профессиональных 
              360° панорам и виртуальных туров.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="card group p-8 neumorphism">
              <div className="w-24 h-24 sunset-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-900">Простая загрузка</h3>
              <p className="text-accent-blue text-center leading-relaxed text-lg">
                Загружайте 360° изображения с автоматической обработкой и оптимизацией для веба.
              </p>
            </div>

            <div className="card group p-8 neumorphism">
              <div className="w-24 h-24 purple-mountains-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-900">Иммерсивный просмотр</h3>
              <p className="text-accent-blue text-center leading-relaxed text-lg">
                Высококачественный просмотрщик с поддержкой зума, автоповорота и полноэкранного режима.
              </p>
            </div>

            <div className="card group p-8 neumorphism">
              <div className="w-24 h-24 deep-space-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-900">Виртуальные туры</h3>
              <p className="text-accent-blue text-center leading-relaxed text-lg">
                Создавайте связанные туры с переходами между панорамами и интерактивными точками.
              </p>
            </div>

            <div className="card group p-8 neumorphism">
              <div className="w-24 h-24 bg-gradient-to-br from-sunset-red to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Share2 className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-900">Легкое встраивание</h3>
              <p className="text-accent-blue text-center leading-relaxed text-lg">
                Встраивайте панорамы и туры на любой сайт с помощью готового embed-кода.
              </p>
            </div>

            <div className="card group p-8 neumorphism">
              <div className="w-24 h-24 bg-gradient-to-br from-sunset-yellow to-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-900">Быстрая загрузка</h3>
              <p className="text-accent-blue text-center leading-relaxed text-lg">
                Оптимизированная доставка контента обеспечивает мгновенную загрузку панорам.
              </p>
            </div>

            <div className="card group p-8 neumorphism">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-900 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-900">Безопасность</h3>
              <p className="text-accent-blue text-center leading-relaxed text-lg">
                Ваш контент защищен с возможностью настройки приватности и прав доступа.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold text-purple-900 mb-8">
              Выберите свой план
            </h2>
            <p className="text-2xl text-accent-blue">
              Начните бесплатно или получите полный доступ с премиум подпиской
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card neumorphism p-10">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-purple-900 mb-4">Бесплатный</h3>
                <div className="text-6xl font-bold text-primary-500 mb-8">
                  0₽
                  <span className="text-xl font-normal text-accent-blue">/месяц</span>
                </div>
              </div>

              <ul className="space-y-5 mb-10">
                <li className="flex items-center">
                  <div className="w-6 h-6 sunset-gradient rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-accent-blue">3 панорамы в день</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 sunset-gradient rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-accent-blue">Хранение 24 часа</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 sunset-gradient rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-accent-blue">Базовый просмотрщик</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 sunset-gradient rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg text-accent-blue">Публичная галерея</span>
                </li>
              </ul>

              <Link to="/auth/register" className="btn-secondary w-full text-lg py-4">
                Начать бесплатно
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="card-purple p-10 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="sunset-gradient px-6 py-2 rounded-full">
                  <Star className="w-5 h-5 text-white inline mr-2" />
                  <span className="text-white font-bold">Популярно</span>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4">Премиум</h3>
                <div className="text-6xl font-bold mb-8">
                  990₽
                  <span className="text-xl font-normal opacity-75">/месяц</span>
                </div>
              </div>

              <ul className="space-y-5 mb-10">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-sunset-yellow rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-purple-900" />
                  </div>
                  <span className="text-lg">Безлимитные загрузки</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-sunset-yellow rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-purple-900" />
                  </div>
                  <span className="text-lg">Постоянное хранение</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-sunset-yellow rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-purple-900" />
                  </div>
                  <span className="text-lg">Конструктор туров</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-sunset-yellow rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-purple-900" />
                  </div>
                  <span className="text-lg">Встраивание на сайты</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-sunset-yellow rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-purple-900" />
                  </div>
                  <span className="text-lg">Приватные галереи</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-sunset-yellow rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-4 h-4 text-purple-900" />
                  </div>
                  <span className="text-lg">Аналитика просмотров</span>
                </li>
              </ul>

              <Link to="/auth/register" className="bg-white text-purple-900 font-bold py-4 px-8 rounded-2xl w-full text-lg hover:bg-sunset-yellow transition-all duration-300 text-center block">
                Получить премиум
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sunrise-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-6xl font-bold text-white mb-8">
            Готовы создать свою первую панораму?
          </h2>
          <p className="text-2xl text-white/90 mb-12 leading-relaxed">
            Присоединяйтесь к тысячам создателей контента, которые уже используют Panorama 360 App 
            для создания впечатляющих 360° впечатлений.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/auth/register" className="bg-white text-primary-500 font-bold text-xl px-12 py-5 rounded-2xl hover:bg-sunset-yellow hover:text-purple-900 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              Создать аккаунт
              <ArrowRight className="ml-3 w-6 h-6 inline" />
            </Link>
            <Link to="/explore" className="glass text-white font-bold text-xl px-12 py-5 rounded-2xl hover:bg-white/20 transition-all duration-300">
              Посмотреть примеры
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 sunset-gradient rounded-2xl flex items-center justify-center mr-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Panorama 360 App</h3>
              </div>
              <p className="text-purple-200 mb-6 text-lg leading-relaxed max-w-md">
                Профессиональная платформа для создания и распространения 360° панорам 
                и виртуальных туров.
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6 text-sunset-yellow">Продукт</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/explore" className="text-purple-200 hover:text-sunset-yellow transition-colors duration-300 text-lg">
                    Галерея
                  </Link>
                </li>
                <li>
                  <Link to="/tours" className="text-purple-200 hover:text-sunset-yellow transition-colors duration-300 text-lg">
                    Туры
                  </Link>
                </li>
                <li>
                  <Link to="/upload" className="text-purple-200 hover:text-sunset-yellow transition-colors duration-300 text-lg">
                    Загрузить
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6 text-sunset-yellow">Поддержка</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-purple-200 hover:text-sunset-yellow transition-colors duration-300 text-lg">
                    Помощь
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-200 hover:text-sunset-yellow transition-colors duration-300 text-lg">
                    Контакты
                  </a>
                </li>
                <li>
                  <a href="#" className="text-purple-200 hover:text-sunset-yellow transition-colors duration-300 text-lg">
                    API
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-purple-600/30 text-center">
            <p className="text-purple-200 text-lg">
              © 2024 Panorama 360 App. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;