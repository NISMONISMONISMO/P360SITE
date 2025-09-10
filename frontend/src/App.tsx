import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Контекст аутентификации
import { AuthProvider } from './contexts/AuthContext';

// Импорт компонентов (lazy loading для оптимизации)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const PanoramaPage = React.lazy(() => import('./pages/PanoramaPage'));
const TourPage = React.lazy(() => import('./pages/TourPage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AdminPage = React.lazy(() => import('./pages/admin/AdminPage'));
const ExplorePage = React.lazy(() => import('./pages/ExplorePage'));
const ToursListPage = React.lazy(() => import('./pages/ToursListPage'));
const TourBuilderPage = React.lazy(() => import('./pages/TourBuilderPage'));
const EmbedPanoramaPage = React.lazy(() => import('./pages/embed/EmbedPanoramaPage'));
const EmbedTourPage = React.lazy(() => import('./pages/embed/EmbedTourPage'));
const DebugPanoramaPage = React.lazy(() => import('./pages/DebugPanoramaPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Компоненты
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Компонент загрузки
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/tours" element={<ToursListPage />} />
            <Route path="/panorama/:id" element={<PanoramaPage />} />
            <Route path="/debug/panorama/:id" element={
              <ProtectedRoute>
                <DebugPanoramaPage />
              </ProtectedRoute>
            } />
            <Route path="/tour/:id" element={<TourPage />} />

            {/* Embed маршруты (без навигации) */}
            <Route path="/embed/panorama/:embedCode" element={<EmbedPanoramaPage />} />
            <Route path="/embed/tour/:embedCode" element={<EmbedTourPage />} />

            {/* Защищенные маршруты */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tour-builder"
              element={
                <ProtectedRoute>
                  <TourBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours/new"
              element={
                <ProtectedRoute>
                  <TourBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours/:id/edit"
              element={
                <ProtectedRoute>
                  <TourBuilderPage />
                </ProtectedRoute>
              }
            />

            {/* Админские маршруты */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            {/* 404 страница */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;