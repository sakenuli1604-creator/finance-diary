# 📦 Инструкция по установке и запуску

## Шаг 1: Распаковка

Распакуйте архив в любую папку.

## Шаг 2: Установка зависимостей

### Установите Node.js

Скачайте и установите Node.js 18+ с официального сайта:
https://nodejs.org/

Проверьте установку:
```bash
node --version
npm --version
```

### Установите Docker Desktop

Скачайте и установите Docker Desktop:
https://www.docker.com/products/docker-desktop/

## Шаг 3: Запуск базы данных

Откройте терминал в корневой папке проекта и выполните:

```bash
docker-compose up -d
```

Это запустит PostgreSQL базу данных в контейнере.

## Шаг 4: Настройка Backend

```bash
cd server
npm install

# На Windows:
copy .env.example .env
# На Mac/Linux:
cp .env.example .env

npx prisma migrate dev --name init
npm run dev
```

Сервер запустится на http://localhost:5000

## Шаг 5: Настройка Frontend

Откройте **НОВЫЙ** терминал (не закрывая предыдущий) и выполните:

```bash
cd client
npm install
npm run dev
```

Приложение откроется на http://localhost:5173

## Шаг 6: Использование

1. Откройте браузер
2. Перейдите на http://localhost:5173
3. Зарегистрируйте новый аккаунт
4. Начните пользоваться!

---

## Возможные проблемы

### Порт уже занят

**Backend** (`server/src/server.ts`):
```typescript
const PORT = process.env.PORT || 5001;
```

**Frontend** (`client/vite.config.ts`):
```typescript
server: {
  port: 5174,
}
```

### Docker не запускается

Убедитесь что Docker Desktop запущен и работает.

### Ошибка подключения к базе данных

```bash
docker ps
```
Вы должны увидеть контейнер `finance-diary-db` в списке.

### Ошибка при установке зависимостей

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

## Остановка проекта

```bash
# Остановить серверы: Ctrl+C в терминалах
# Остановить базу данных:
docker-compose down
```

## Удаление проекта

```bash
docker-compose down -v
```
