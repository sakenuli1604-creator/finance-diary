# 🚀 Инструкция по деплою

Деплой backend на Railway и frontend на Vercel — оба бесплатно.

---

## Шаг 1: Загрузка кода на GitHub

```bash
git init
git add .
git commit -m "Initial commit: Finance Diary App"
git remote add origin https://github.com/YOUR_USERNAME/finance-diary.git
git branch -M main
git push -u origin main
```

---

## Шаг 2: Backend на Railway

1. https://railway.app → Login with GitHub
2. New Project → Deploy from GitHub repo → выберите `finance-diary`
3. Настройки сервиса:
   - Root Directory: `/server`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`
4. Добавьте PostgreSQL: New → Database → Add PostgreSQL
   (переменная `DATABASE_URL` подставится автоматически)
5. Variables:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<сгенерированный секрет, см. ниже>
   PORT=5000
   NODE_ENV=production
   ```
   Генерация секрета:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
6. Settings → Networking → Generate Domain — это ваш backend URL.

---

## Шаг 3: Frontend на Vercel

1. https://vercel.com → Continue with GitHub
2. Add New → Project → импортируйте `finance-diary`
3. Framework Preset: Vite
   Root Directory: `client`
   Build Command: `npm run build`
   Output Directory: `dist`
4. Environment Variables:
   ```env
   VITE_API_URL=https://ваш-backend-url.railway.app/api
   ```
5. Deploy.

---

## Шаг 4: CORS для продакшена

Обновите `server/src/app.ts`, ограничив origin вашим доменом на Vercel:

```typescript
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
```

И добавьте в Railway Variables:
```env
CORS_ORIGIN=https://ваш-сайт.vercel.app
```

Закоммитьте и запушьте — Railway пересоберёт сервис автоматически.

---

## Проверка

- [ ] Сайт открывается на Vercel-домене
- [ ] Регистрация и вход работают
- [ ] Счета создаются
- [ ] Транзакции создаются
- [ ] Переводы, цели, аналитика работают

Логи в случае проблем: Railway → Deployments → логи; Vercel → Deployments →
конкретный деплой → логи сборки.

---

## Альтернативы

- Backend: Render.com (Root Directory `server`, те же команды сборки/старта)
- Frontend: Netlify (Base directory `client`, Publish directory `client/dist`)

---

## Частые проблемы

**CORS error** — проверьте `CORS_ORIGIN` в переменных Railway и что домен
указан без слэша на конце.

**Cannot connect to database** — проверьте `DATABASE_URL`, что миграции
применились (`prisma migrate deploy` в Start Command).

**Build failed on Vercel** — проверьте, что Root Directory = `client`.

**500 Internal Server Error** — смотрите логи Railway; часто это
непройденные миграции или отсутствующая переменная окружения.

---

## PWA-установка после деплоя

- iOS Safari: «Поделиться» → «На экран Домой»
- Android Chrome: меню → «Установить приложение»

Иконки `icon-192.png` и `icon-512.png`, на которые ссылается
`client/public/manifest.json`, ещё не созданы — добавьте свои перед
финальным деплоем, иначе иконка PWA будет пустой.
