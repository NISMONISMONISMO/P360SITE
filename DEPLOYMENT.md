# Документация по установке и развертыванию PanoramaSite

## 🚀 Быстрый старт

### Требования к системе

**Backend:**
- Python 3.8+ 
- pip (пакетный менеджер Python)

**Frontend:**
- Node.js 16+
- npm или yarn

**Дополнительно:**
- Git (для клонирования репозитория)

### Установка зависимостей

#### 1. Backend (Flask API)

```bash
# Переход в папку backend
cd backend

# Установка Python зависимостей
pip install -r requirements.txt

# Создание переменных окружения (опционально)
cp .env.example .env
```

#### 2. Frontend (React)

```bash
# Переход в папку frontend
cd frontend

# Установка Node.js зависимостей
npm install

# Или с использованием yarn
yarn install
```

### Запуск приложения

#### Режим разработки

1. **Запуск Backend сервера:**
```bash
cd backend
python app.py
```
Сервер запустится на http://localhost:5000

2. **Запуск Frontend приложения:**
```bash
cd frontend
npm start
# или npm run dev
```
Приложение откроется на http://localhost:3000

#### Автоматическая конфигурация

Frontend автоматически проксирует API запросы на backend через Vite конфигурацию.

## 🔧 Конфигурация

### Backend конфигурация (.env)

```bash
# Базовые настройки
SECRET_KEY=ваш-секретный-ключ-здесь
JWT_SECRET_KEY=jwt-секретный-ключ-здесь

# База данных
DATABASE_URL=sqlite:///panorama_site.db
# Для PostgreSQL: postgresql://username:password@localhost/panorama_site

# Настройки Flask
FLASK_ENV=development
FLASK_DEBUG=True

# Настройки загрузки
MAX_CONTENT_LENGTH=52428800  # 50MB
UPLOAD_FOLDER=../uploads

# Лимиты подписок
FREE_DAILY_LIMIT=3
FREE_STORAGE_HOURS=24
```

### Frontend конфигурация

Конфигурация осуществляется через `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

## 📊 База данных

### Инициализация

При первом запуске приложения база данных создается автоматически.

### Администратор по умолчанию

```
Логин: admin
Пароль: admin123
Email: admin@panoramasite.com
```

**⚠️ ВАЖНО:** Обязательно смените пароль администратора после первого входа!

### Структура базы данных

- `users` - Пользователи системы
- `panoramas` - 360° панорамы
- `tours` - Виртуальные туры
- `tour_panoramas` - Связи панорам с турами
- `hotspots` - Точки перехода между панорамами
- `user_sessions` - Активные сессии пользователей

## 🔐 Безопасность

### Аутентификация

- JWT токены с временем жизни 24 часа
- Хэширование паролей с использованием bcrypt
- Проверка прав доступа на уровне API

### Загрузка файлов

- Ограничение размера файлов: 50MB
- Валидация типов файлов: JPG, JPEG, PNG
- Проверка соотношения сторон для панорам (от 1.5:1 до 4:1)

### Лимиты

**Бесплатные пользователи:**
- 3 панорамы в день
- Хранение 24 часа

**Премиум пользователи:**
- Безлимитные загрузки
- Постоянное хранение

## 🌐 Продакшн развертывание

### Подготовка к продакшну

1. **Обновите переменные окружения:**
```bash
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/panorama_site
SECRET_KEY=криптостойкий-секретный-ключ
```

2. **Соберите frontend:**
```bash
cd frontend
npm run build
```

3. **Настройте веб-сервер (nginx пример):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend статика
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API проксирование
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Загруженные файлы
    location /uploads/ {
        alias /path/to/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Systemd сервис (Linux)

Создайте файл `/etc/systemd/system/panoramasite.service`:

```ini
[Unit]
Description=PanoramaSite Flask App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
Environment="FLASK_ENV=production"
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl enable panoramasite
sudo systemctl start panoramasite
```

### Docker развертывание

**Dockerfile для backend:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

**Dockerfile для frontend:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/panorama_site
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=panorama_site
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🛠 Администрирование

### Вход в админ-панель

1. Войдите как администратор: http://localhost:3000/auth/login
2. Перейдите в админ-панель: http://localhost:3000/admin

### Основные функции администратора

**Управление пользователями:**
- Просмотр списка всех пользователей
- Выдача/отзыв премиум подписок
- Блокировка/разблокировка пользователей
- Назначение прав администратора

**Управление контентом:**
- Просмотр всех панорам и туров
- Удаление нарушающего контента
- Модерация публичных материалов

**Статистика:**
- Общая статистика системы
- Топ пользователи по активности
- Аналитика за периоды

### Управление подписками

**Выдача премиум подписки пользователю:**

1. В админ-панели найдите нужного пользователя
2. Нажмите "Управление подпиской"
3. Выберите тип подписки и срок действия
4. Подтвердите изменения

**Программное управление:**

```python
# В консоли Python
from models import User
from app import db

user = User.query.filter_by(username='username').first()
user.subscription_type = 'premium'
user.subscription_expires = None  # Навсегда
db.session.commit()
```

### Мониторинг и логи

**Логи приложения:**
- Backend логи: выводятся в консоль
- Для продакшна: настройте запись в файлы

**Мониторинг здоровья API:**
```bash
curl http://localhost:5000/api/health
```

**Очистка истекших панорам:**
Происходит автоматически при каждом обращении к `/api/health`

### Резервное копирование

**База данных (SQLite):**
```bash
cp panorama_site.db panorama_site_backup_$(date +%Y%m%d).db
```

**База данных (PostgreSQL):**
```bash
pg_dump panorama_site > panorama_site_backup_$(date +%Y%m%d).sql
```

**Загруженные файлы:**
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🔄 Обновление приложения

1. **Остановите сервисы**
2. **Обновите код:**
```bash
git pull origin main
```
3. **Обновите зависимости:**
```bash
cd backend && pip install -r requirements.txt
cd frontend && npm install
```
4. **Примените миграции БД (если есть)**
5. **Пересоберите frontend:**
```bash
cd frontend && npm run build
```
6. **Запустите сервисы**

## ⚠️ Устранение неполадок

### Частые проблемы

**"Module not found" ошибки:**
- Проверьте установку зависимостей
- Убедитесь, что активирована правильная Python среда

**Ошибки CORS:**
- Проверьте настройки в `app.py`
- Убедитесь, что frontend делает запросы на правильный порт

**Проблемы с загрузкой файлов:**
- Проверьте права доступа к папке `uploads`
- Убедитесь, что размер файла не превышает лимит

**База данных не создается:**
- Проверьте права доступа к папке
- Убедитесь, что SQLite установлен

### Получение помощи

- Проверьте логи в консоли
- Используйте `/api/health` для диагностики API
- Проверьте browser developer tools для frontend ошибок

## 📈 Масштабирование

### Оптимизация производительности

**Backend:**
- Используйте PostgreSQL вместо SQLite
- Настройте кэширование (Redis)
- Добавьте CDN для статических файлов

**Frontend:**
- Включите gzip сжатие
- Настройте кэширование статики
- Используйте lazy loading

**Файлы:**
- Настройте внешнее хранилище (S3, MinIO)
- Добавьте обработку изображений на лету
- Реализуйте прогрессивную загрузку панорам

---

## 📞 Поддержка

Для получения технической поддержки или сообщения об ошибках создавайте issues в репозитории проекта.