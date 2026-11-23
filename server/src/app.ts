import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import transferRoutes from './routes/transfers';
import goalRoutes from './routes/goals';
import analyticsRoutes from './routes/analytics';
import settingsRoutes from './routes/settings';
import exportRoutes from './routes/export';
import tagRoutes from './routes/tags';
import budgetRoutes from './routes/budgets';
import feedRoutes from './routes/feed';
import integrationRoutes from './routes/integrations';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// За прокси Railway: берём реальный IP клиента из X-Forwarded-For (нужно для rate limit на логине)
app.set('trust proxy', 1);

// Middlewares
app.use(helmet());
// CORS_ORIGIN (необязательно): адреса фронтенда через запятую. Пока не задан — как раньше, разрешено всем.
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors(corsOrigins.length > 0 ? { origin: corsOrigins } : undefined));
// 100 КБ по умолчанию мало для импорта большой выписки (сотни строк за раз)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/feed', feedRoutes);
// Read-only интеграции с отдельным токеном (Genos). Выключено, пока не заданы GENOS_API_TOKEN и GENOS_USER_EMAIL
app.use('/api/integrations', integrationRoutes);

// Error handler
app.use(errorHandler);

export default app;
