@echo off
title Panorama 360 App Servers

echo ========================================
echo      Panorama 360 App Запуск серверов
echo ========================================
echo.

cd /d "%~dp0"

echo Проверяем Python зависимости...
cd backend
pip show flask >nul 2>&1
if %errorlevel% neq 0 (
    echo Установка Python зависимостей...
    pip install -q flask flask-cors flask-sqlalchemy flask-migrate flask-jwt-extended werkzeug python-dotenv pillow python-multipart psycopg2-binary bcrypt marshmallow requests
) else (
    echo Python зависимости уже установлены
)

cd ..

echo Проверяем Node.js зависимости...
cd frontend
if not exist "node_modules" (
    echo Установка Node.js зависимостей...
    call npm install --silent
) else (
    echo Node.js зависимости уже установлены
)

cd ..

echo.
echo Запуск серверов...
echo ========================================

echo Запуск бэкенда на порту 5000...
start "Panorama 360 App Backend" cmd /k "cd backend && python app.py"

timeout /t 5 /nobreak >nul

echo Запуск фронтенда на порту 3000...
start "Panorama 360 App Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Серверы запущены!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000  
echo 🧪 Диагностика: http://localhost:3000/api_test_tool.html
echo 👤 Админ: admin / 209030Tes!
echo.
echo Если вы видите черный экран в панораме:
echo 1. Откройте http://localhost:3000/api_test_tool.html для диагностики
echo 2. Проверьте, что оба сервера запущены без ошибок
echo 3. Убедитесь, что в базе данных есть панорамы
echo.

pause