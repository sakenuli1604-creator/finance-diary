import { PrismaClient } from '@prisma/client';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';

const prisma = new PrismaClient();

export interface CreateTransactionDTO {
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  title?: string;
  description?: string;
  shop?: string;
  location?: string;
  transactionDate?: string;
}

export interface UpdateTransactionDTO {
  accountId?: string;
  categoryId?: string;
  amount?: number;
  title?: string;
  description?: string;
  shop?: string;
  location?: string;
  rating?: number;
  transactionDate?: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string; // поиск по названию/описанию/магазину/локации/категории
  amountMin?: number;
  amountMax?: number;
  limit?: number;
}

class TransactionService {
  private async assertAccountOwnership(userId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  private async assertCategoryOwnership(userId: string, categoryId: string) {
    // категория либо дефолтная (userId = null), либо принадлежит пользователю
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { userId: null }],
      },
    });
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async getAll(userId: string, filters: TransactionFilters = {}) {
    const where: any = { userId };

    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;

    if (filters.dateFrom || filters.dateTo) {
      where.transactionDate = {};
      if (filters.dateFrom) where.transactionDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.transactionDate.lte = new Date(filters.dateTo);
    }

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {};
      if (filters.amountMin !== undefined) where.amount.gte = filters.amountMin;
      if (filters.amountMax !== undefined) where.amount.lte = filters.amountMax;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shop: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    return prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { transactionDate: 'desc' },
      take: filters.limit ?? undefined,
    });
  }

  async getById(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { account: true, category: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async create(userId: string, data: CreateTransactionDTO) {
    if (!data.accountId || !data.categoryId) {
      throw new Error('accountId and categoryId are required');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (data.type !== 'income' && data.type !== 'expense') {
      throw new Error('type must be income or expense');
    }

    const account = await this.assertAccountOwnership(userId, data.accountId);
    await this.assertCategoryOwnership(userId, data.categoryId);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: data.type,
          amount: data.amount,
          currency: account.currency,
          title: data.title,
          description: data.description,
          shop: data.shop,
          location: data.location,
          transactionDate: data.transactionDate
            ? new Date(data.transactionDate)
            : new Date(),
        },
        include: { account: true, category: true },
      });

      // Обновляем баланс счета
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance:
            data.type === 'income'
              ? { increment: data.amount }
              : { decrement: data.amount },
        },
      });

      return transaction;
    });

    return result;
  }

  async update(userId: string, id: string, data: UpdateTransactionDTO) {
    const existing = await this.getById(userId, id);

    let newAccount = null;
    if (data.accountId) {
      newAccount = await this.assertAccountOwnership(userId, data.accountId);
    }
    if (data.categoryId) {
      await this.assertCategoryOwnership(userId, data.categoryId);
    }

    const newAccountId = data.accountId ?? existing.accountId;
    const newAmount = data.amount ?? Number(existing.amount);

    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Откатываем эффект старой транзакции на старом счете.
      // Если валюту счёта поменяли после создания операции, старая сумма
      // хранится в уже "чужой" для счёта валюте — сначала конвертируем.
      const oldAccountCurrency = existing.account.currency;
      let oldAmountInAccountCurrency = Number(existing.amount);
      if (existing.currency !== oldAccountCurrency) {
        let rates: Record<string, number> = {};
        try {
          rates = (await getExchangeRates()).rates;
        } catch {
          // без курса — откатываем как есть, лучше приблизительно, чем не откатить вовсе
        }
        oldAmountInAccountCurrency = convertAmount(
          Number(existing.amount),
          existing.currency,
          oldAccountCurrency,
          rates
        );
      }

      const oldSign = existing.type === 'income' ? -1 : 1;
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: oldSign * oldAmountInAccountCurrency },
        },
      });

      // Применяем эффект новой версии на (возможно новом) счете
      const newSign = existing.type === 'income' ? 1 : -1;
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          balance: { increment: newSign * newAmount },
        },
      });

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...(data.accountId !== undefined && {
            accountId: data.accountId,
            currency: newAccount!.currency,
          }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.shop !== undefined && { shop: data.shop }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.rating !== undefined && {
            rating: data.rating,
            ratingDate: new Date(),
          }),
          ...(data.transactionDate !== undefined && {
            transactionDate: new Date(data.transactionDate),
          }),
        },
        include: { account: true, category: true },
      });

      return updated;
    });

    return result;
  }

  async delete(userId: string, id: string) {
    const existing = await this.getById(userId, id);

    const accountCurrency = existing.account.currency;
    let amountInAccountCurrency = Number(existing.amount);
    if (existing.currency !== accountCurrency) {
      let rates: Record<string, number> = {};
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — откатываем как есть
      }
      amountInAccountCurrency = convertAmount(
        Number(existing.amount),
        existing.currency,
        accountCurrency,
        rates
      );
    }

    await prisma.$transaction(async (tx) => {
      const sign = existing.type === 'income' ? -1 : 1;

      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: sign * amountInAccountCurrency },
        },
      });

      await tx.transaction.delete({ where: { id } });
    });
  }

  async addRating(userId: string, id: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    await this.getById(userId, id);

    return prisma.transaction.update({
      where: { id },
      data: { rating, ratingDate: new Date() },
      include: { account: true, category: true },
    });
  }

  async getRecent(userId: string, limit = 10) {
    return prisma.transaction.findMany({
      where: { userId },
      include: { account: true, category: true },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });
  }

  async getTodayStats(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { primaryCurrency: true } }),
      prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: { gte: startOfDay, lte: endOfDay },
        },
        include: { account: { select: { currency: true } } },
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

    const toPrimary = (amount: number, fromCurrency?: string) =>
      convertAmount(amount, fromCurrency || primaryCurrency, primaryCurrency, rates);

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + toPrimary(Number(t.amount), t.currency), 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + toPrimary(Number(t.amount), t.currency), 0);

    return { income, expense, currency: primaryCurrency };
  }
}

export default new TransactionService();
