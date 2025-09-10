// Скрипт для проверки доступности бэкенда
async function checkBackend() {
    try {
        console.log('Проверка доступности бэкенда...');
        
        // Проверяем основной эндпоинт
        const response = await fetch('http://localhost:5000/api/panoramas');
        console.log('Статус ответа:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Бэкенд доступен. Получены данные:', data);
        } else {
            console.log('Бэкенд вернул ошибку:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Ошибка подключения к бэкенду:', error.message);
        console.log('Убедитесь, что бэкенд сервер запущен на порту 5000');
    }
}

checkBackend();