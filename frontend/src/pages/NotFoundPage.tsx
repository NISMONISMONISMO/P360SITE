import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <p className="text-xl text-gray-600 mb-4">Страница не найдена</p>
        <Link to="/" className="btn-primary">
          На главную
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;