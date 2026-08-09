import { prisma } from '../lib/prisma';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';


export interface CreateBudgetDTO {
  categoryId?: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface UpdateBudgetDTO {
  name?: string;
  amount?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive?: boolean;
}

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();

  if (period === 'daily') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (period === 'weekly') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    // getDay(): 0 = воскресенье. Приводим к понедельнику как началу недели
    // (у нас в СНГ неделя начинается с понедельника, не с воскресенья).
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(now.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (period === 'yearly') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    };
  }

  // monthly по умолчанию
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

class BudgetService {
  private async attachSpent(userId: string, budget: any, rates: Record<string, number>) {
    const { start, end } = getPeriodRange(budget.period);

    const where: any = {
      userId,
      type: 'expense',
      isDeleted: false,
      transactionDate: { gte: start, lt: end },
    };
    if (budget.categoryId) where.categoryId = budget.categoryId;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: { select: { currency: true } } },
    });

    const spent = transactions.reduce(
      (sum, t) => sum + convertAmount(Number(t.amount), t.currency, budget.currency, rates),
      0
    );

    const amount = Number(budget.amount);
    const percentage = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;

    return {
      ...budget,
      spent,
      percentage,
      remaining: Math.max(amount - spent, 0),
      isOverBudget: spent > amount,
    };
  }

  async getAll(userId: string, activeOnly = true) {
    const where: any = { userId };
    if (activeOnly) where.isActive = true;

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const hasMixedCurrencies = budgets.length > 0; // курс нужен почти всегда — расходы могут быть в других валютах
    let rates: Record<string, number> = {};
    if (hasMixedCurrencies) {
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — считаем без конвертации там, где валюты совпадают
      }
    }

    return Promise.all(budgets.map((b) => this.attachSpent(userId, b, rates)));
  }

  async getById(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!budget) {
      throw new Error('Budget not found');
    }

    let rates: Record<string, number> = {};
    try {
      rates = (await getExchangeRates()).rates;
    } catch {
      // без курса
    }

    return this.attachSpent(userId, budget, rates);
  }

  async create(userId: string, data: CreateBudgetDTO) {
    if (!data.name || !data.amount || data.amount <= 0) {
      throw new Error('name and a positive amount are required');
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, OR: [{ userId }, { userId: null }] },
      });
      if (!category) {
        throw new Error('Category not found');
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { primaryCurrency: true } });

    return prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        name: data.name,
        amount: data.amount,
        currency: user?.primaryCurrency || '₸',
        period: data.period,
      },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, data: UpdateBudgetDTO) {
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error('Budget not found');
    }

    return prisma.budget.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(userId: string, id: string) {
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error('Budget not found');
    }
    await prisma.budget.delete({ where: { id } });
  }

  // Бюджеты, которые почти исчерпаны или превышены — для предупреждений/ленты событий
  async getAlerts(userId: string) {
    const budgets = await this.getAll(userId, true);
    return budgets
      .filter((b) => b.percentage >= 80)
      .map((b) => ({
        budgetId: b.id,
        budgetName: b.name,
        categoryName: b.category?.name,
        percentage: b.percentage,
        remaining: b.remaining,
        currency: b.currency,
        isOverBudget: b.isOverBudget,
        severity: b.isOverBudget ? 'critical' : b.percentage >= 90 ? 'warning' : 'info',
      }));
  }
}

export default new BudgetService();
