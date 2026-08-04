import express from 'express';
import cors from 'cors';
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
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
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

// Error handler
app.use(errorHandler);

export default app;
