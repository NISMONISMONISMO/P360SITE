@echo off

echo ========================================
echo      Panorama 360 App Запуск
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

echo.
echo Запуск серверов...
echo ========================================

cd ..

start "Panorama 360 App Backend" cmd /k "cd backend && echo Backend запускается на http://localhost:5000 && python app.py"

timeout /t 3 /nobreak >nul

start "Panorama 360 App Frontend" cmd /k "cd frontend && echo Frontend запускается на http://localhost:3000 && npm run dev"

echo.
echo ✅ Серверы запущены!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000  
echo 👤 Админ: admin / 209030Tes!
echo.

pause