import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AnalyticsService {
  async getSummary(userId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { userId };

    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savings = income - expense;

    // Баланс всех активных счетов
    const accountsBalance = await prisma.account.aggregate({
      where: {
        userId,
        isActive: true,
      },
      _sum: {
        balance: true,
      },
    });

    const balance = Number(accountsBalance._sum.balance || 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      savings,
      balance,
      transactionCount: transactions.length,
    };
  }

  async getByCategory(userId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { userId };

    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
    });

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
      cat.total += Number(t.amount);
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
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

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
      if (t.type === 'income') {
        trend.income += Number(t.amount);
      } else {
        trend.expense += Number(t.amount);
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
