# API — статус реализации

Backend полностью реализован (controller+service+routes+middleware) для
**всех** разделов: Auth, Accounts, Transactions, Categories, Transfers,
Goals, Analytics. Заглушек `501` больше не осталось.

### Auth ✅
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Accounts ✅
```
GET    /api/accounts
POST   /api/accounts
GET    /api/accounts/:id
PUT    /api/accounts/:id
DELETE /api/accounts/:id
GET    /api/accounts/:id/history
GET    /api/accounts/total-balance
```

### Transactions ✅
```
GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/recent
GET    /api/transactions/today-stats
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id
PATCH  /api/transactions/:id/rating
```
Создание/редактирование/удаление транзакции атомарно (`$transaction`)
корректирует баланс связанного счёта — списывает при расходе, начисляет
при доходе, откатывает старое значение при изменении суммы/счёта.

### Categories ✅
```
GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PUT    /api/categories/:id
DELETE /api/categories/:id
```
Дефолтные категории (`isDefault: true`, `userId: null`) нельзя редактировать
или удалять. Категорию с уже привязанными транзакциями удалить нельзя —
сервис вернёт 400 `Cannot delete a category that has transactions`.

### Transfers ✅
```
GET    /api/transfers
GET    /api/transfers/:id
POST   /api/transfers
DELETE /api/transfers/:id
```

### Goals ✅
```
GET    /api/goals
GET    /api/goals/:id
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id
POST   /api/goals/:id/deposit
POST   /api/goals/:id/withdraw
```

### Analytics ✅
```
GET    /api/analytics/summary
GET    /api/analytics/by-category
GET    /api/analytics/trends
GET    /api/analytics/top-expenses
GET    /api/analytics/expensive-days
GET    /api/analytics/accounts-breakdown
GET    /api/analytics/rating-stats
GET    /api/analytics/pending-reviews
GET    /api/analytics/regretted-purchases
```

---

## Известные ограничения (не баги, а осознанно не сделано)

- Страница `/settings` — в Dashboard есть ссылка на неё, но `Settings.tsx`
  никогда не был написан. Переход на `/settings` просто отбрасывает на
  Dashboard через wildcard-роут `*`.
- `client/public/manifest.json` ссылается на `icon-192.png`/`icon-512.png`,
  которые не созданы — добавьте свои иконки перед PWA-деплоем.
- Загрузка фото чеков (Cloudinary/S3) из исходного ТЗ не реализована —
  поля `photoUrl`/`receiptUrl` есть в схеме БД, но эндпоинта загрузки файла
  нет.
