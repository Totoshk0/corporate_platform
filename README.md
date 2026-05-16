# Corporate Knowledge Hub

Система корпоративной базы знаний с семантическим ИИ-поиском.

## Быстрый запуск

1. Создайте файл `.env` в корневом каталоге.
2. Скопируйте и настройте следующие переменные:

```env
# --- Безопасность ---
# Секретный ключ для JWT (сгенерируйте длинную случайную строку)
SECRET_KEY=your_very_secret_key_here
# Алгоритм шифрования
ALGORITHM=HS256
# Время жизни токена в минутах (1440 = 24 часа)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# --- База данных ---
# URL для подключения к PostgreSQL (внутри Docker)
DATABASE_URL=postgresql://user:password@db:5432/corporate_platform

# --- Начальные данные ---
# Пароль для автоматически создаваемых тестовых пользователей
INITIAL_ADMIN_PASSWORD=password123
```

3. Запустите проект через Docker Compose:
```bash
docker-compose up --build
```