import { PrismaClient } from '@prisma/client';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';

const prisma = new PrismaClient();

class AnalyticsService {
  async getSummary(userId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { userId, isDeleted: false };

    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const [user, transactions, accounts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { primaryCurrency: true } }),
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: { select: { currency: true } },
        },
      }),
      prisma.account.findMany({
        where: { userId, isActive: true },
        select: { balance: true, currency: true },
      }),
    ]);

    const primaryCurrency = user?.primaryCurrency || '₸';
    const hasMixedCurrencies =
      transactions.some((t) => t.currency && t.currency !== primaryCurrency) ||
      accounts.some((acc) => acc.currency !== primaryCurrency);

    let rates: Record<string, number> = {};
    if (hasMixedCurrencies) {
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — считаем без конвертации
      }
    }

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce(
        (sum, t) =>
          sum + convertAmount(Number(t.amount), t.currency || primaryCurrency, primaryCurrency, rates),
        0
      );

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce(
        (sum, t) =>
          sum + convertAmount(Number(t.amount), t.currency || primaryCurrency, primaryCurrency, rates),
        0
      );

    const savings = income - expense;

    // Баланс всех активных счетов, сконвертированный в основную валюту
    const balance = accounts.reduce(
      (sum, acc) => sum + convertAmount(Number(acc.balance), acc.currency, primaryCurrency, rates),
      0
    );

    return {
      totalIncome: income,
      totalExpense: expense,
      savings,
      balance,
      transactionCount: transactions.length,
      currency: primaryCurrency,
    };
  }

  async getByCategory(userId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { userId, isDeleted: false };

    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { primaryCurrency: true } }),
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: { select: { currency: true } },
        },
      }),
    ]);

    const primaryCurrency = user?.primaryCurrency || '₸';
    const hasMixedCurrencies = transactions.some(
      (t) => t.currency && t.currency !== primaryCurrency
    );

    let rates: Record<string, number> = {};
    if (hasMixedCurrencies) {
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — считаем без конвертации
      }
    }

    // Группируем по категориям
    const categoryMap = new Map();

    transactions.forEach((t) => {
      const categoryId = t.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: t.category.name,
          categoryIcon: t.category.icon,
          categoryColor: t.category.color,
          type: t.type,
          total: 0,
          count: 0,
        });
      }

      const cat = categoryMap.get(categoryId);
      cat.total += convertAmount(Number(t.amount), t.currency || primaryCurrency, primaryCurrency, rates);
      cat.count += 1;
    });

    const result = Array.from(categoryMap.values());

    // Добавляем процент
    const totalExpense = result
      .filter((c) => c.type === 'expense')
      .reduce((sum, c) => sum + c.total, 0);

    const totalIncome = result
      .filter((c) => c.type === 'income')
      .reduce((sum, c) => sum + c.total, 0);

    result.forEach((c) => {
      c.percentage =
        c.type === 'expense'
          ? (c.total / totalExpense) * 100
          : (c.total / totalIncome) * 100;
    });

    return result.sort((a, b) => b.total - a.total);
  }

  async getTrends(userId: string, dateFrom: Date, dateTo: Date, groupBy: 'day' | 'week' | 'month' = 'day') {
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { primaryCurrency: true } }),
      prisma.transaction.findMany({
        where: {
          userId,
          isDeleted: false,
          transactionDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        include: { account: { select: { currency: true } } },
        orderBy: {
          transactionDate: 'asc',
        },
      }),
    ]);

    const primaryCurrency = user?.primaryCurrency || '₸';
    const hasMixedCurrencies = transactions.some(
      (t) => t.currency && t.currency !== primaryCurrency
    );

    let rates: Record<string, number> = {};
    if (hasMixedCurrencies) {
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — считаем без конвертации
      }
    }

    // Группируем по датам
    const trendMap = new Map();

    transactions.forEach((t) => {
      let dateKey: string;
      const date = new Date(t.transactionDate);

      if (groupBy === 'day') {
        dateKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else {
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: dateKey,
          income: 0,
          expense: 0,
        });
      }

      const trend = trendMap.get(dateKey);
      const converted = convertAmount(Number(t.amount), t.currency || primaryCurrency, primaryCurrency, rates);
      if (t.type === 'income') {
        trend.income += converted;
      } else {
        trend.expense += converted;
      }
    });

    return Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  async getTopExpenses(userId: string, dateFrom?: Date, dateTo?: Date, limit = 10) {
    const where: any = {
      userId,
      type: 'expense',
      isDeleted: false,
    };

    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const expenses = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: {
        amount: 'desc',
      },
      take: limit,
    });

    return expenses;
  }

  async getExpensiveDays(userId: string, dateFrom?: Date, dateTo?: Date, limit = 5) {
    const where: any = {
      userId,
      type: 'expense',
      isDeleted: false,
    };

    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const expenses = await prisma.transaction.findMany({
      where,
    });

    // Группируем по дням
    const dayMap = new Map();

    expenses.forEach((t) => {
      const dateKey = new Date(t.transactionDate).toISOString().split('T')[0];

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: dateKey,
          total: 0,
          count: 0,
        });
      }

      const day = dayMap.get(dateKey);
      day.total += Number(t.amount);
      day.count += 1;
    });

    return Array.from(dayMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  async getAccountsBreakdown(userId: string) {
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const total = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    return accounts.map((acc) => ({
      accountId: acc.id,
      accountName: acc.name,
      balance: Number(acc.balance),
      percentage: total > 0 ? (Number(acc.balance) / total) * 100 : 0,
      icon: acc.icon,
      color: acc.color,
    }));
  }

  async getRatingStats(userId: string) {
    const ratedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        isDeleted: false,
        rating: {
          not: null,
        },
      },
    });

    const total = ratedTransactions.length;
    const successful = ratedTransactions.filter((t) => t.rating! >= 4).length;
    const regretted = ratedTransactions.filter((t) => t.rating! <= 2).length;

    return {
      total,
      successful,
      regretted,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      regretRate: total > 0 ? (regretted / total) * 100 : 0,
    };
  }

  async getPendingReviews(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pending = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        isDeleted: false,
        rating: null,
        transactionDate: {
          lte: sevenDaysAgo,
        },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
      take: 20,
    });

    return pending;
  }

  async getRegrettedPurchases(userId: string) {
    const regretted = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        isDeleted: false,
        rating: {
          lte: 2,
        },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: {
        ratingDate: 'desc',
      },
    });

    return regretted;
  }
}

export default new AnalyticsService();
