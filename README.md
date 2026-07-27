# 💰 Финансовый дневник

Веб-приложение для учета личных финансов с аналитикой и планированием.

## Возможности

- ✅ Регистрация и авторизация
- 💳 Управление счетами (создание, редактирование, удаление)
- 💸 Учет доходов и расходов
- 📊 Аналитика и графики
- 🎯 Цели и накопления
- 📸 Прикрепление фото чеков
- ⭐ Оценка покупок

## Технологии

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT авторизация
- TypeScript

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (state management)
- React Query
- React Router

## Установка и запуск

### Требования

- Node.js 18+
- Docker Desktop (для PostgreSQL)

### Быстрый старт

1. Запустите базу данных:
```bash
docker-compose up -d
```

2. Установите зависимости и запустите backend:
```bash
cd server
npm install
npx prisma migrate dev
npm run dev
```

3. Установите зависимости и запустите frontend:
```bash
cd client
npm install
npm run dev
```

4. Откройте http://localhost:5173

## Структура проекта

```
finance-diary/
├── server/              # Backend API
│   ├── prisma/         # База данных и миграции
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── types/
│   └── package.json
├── client/             # Frontend приложение
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── api/
│   │   └── types/
│   └── package.json
└── docker-compose.yml
```

## Первое использование

1. Зарегистрируйтесь (создайте аккаунт)
2. Создайте первый счет (например, "Основной")
3. Добавьте первую транзакцию
4. Изучайте аналитику

## API Документация

После запуска сервера API будет доступно по адресу: `http://localhost:5000/api`

### Основные эндпоинты:

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/accounts` - Список счетов
- `POST /api/transactions` - Создать транзакцию
- `GET /api/analytics/summary` - Аналитика

## Разработка

### Backend

```bash
cd server
npm run dev    # Запуск с hot-reload
npm run build  # Сборка для продакшена
```

### Frontend

```bash
cd client
npm run dev    # Запуск dev сервера
npm run build  # Сборка для продакшена
npm run preview # Просмотр production сборки
```

### База данных

```bash
# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Открыть Prisma Studio (GUI для БД)
npx prisma studio

# Сбросить БД
npx prisma migrate reset
```

## Переменные окружения

### Server (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/finance_diary"
JWT_SECRET="your-secret-key"
PORT=5000
```

### Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## Деплой

### Backend (Railway, Render, Heroku)

1. Создайте PostgreSQL базу данных
2. Установите переменные окружения
3. Запустите `npm run build`
4. Запустите `npm start`

### Frontend (Vercel, Netlify)

1. Установите `VITE_API_URL` на URL вашего backend
2. Запустите `npm run build`
3. Загрузите папку `dist`

## Лицензия

MIT

## Примечание

Backend полностью реализован для всех разделов: **Auth, Accounts,
Transactions, Categories, Transfers, Goals, Analytics**. Заглушек не
осталось — весь стек (frontend + backend) рабочий end-to-end.
Известные ограничения — в конце `API_TODO.md`. Инструкция по деплою —
в `DEPLOY.md`.
