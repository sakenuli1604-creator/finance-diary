import { prisma } from '../lib/prisma';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';


export interface CreateAccountDTO {
  name: string;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
}

export interface UpdateAccountDTO {
  name?: string;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

class AccountService {
  async getAll(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getById(userId: string, id: string) {
    const account = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async create(userId: string, data: CreateAccountDTO) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Account name is required');
    }

    return prisma.account.create({
      data: {
        userId,
        name: data.name.trim(),
        balance: data.balance ?? 0,
        currency: data.currency ?? '₸',
        icon: data.icon,
        color: data.color,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateAccountDTO) {
    // проверяем что счет принадлежит пользователю
    await this.getById(userId, id);

    return prisma.account.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.balance !== undefined && { balance: data.balance }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.getById(userId, id);

    const [txCount, transferCount] = await Promise.all([
      prisma.transaction.count({ where: { accountId: id } }),
      prisma.transfer.count({
        where: { OR: [{ fromAccountId: id }, { toAccountId: id }] },
      }),
    ]);

    if (txCount > 0 || transferCount > 0) {
      // У счёта есть история операций — жёсткое удаление либо упадёт с
      // ошибкой внешнего ключа, либо (для транзакций, у которых onDelete:
      // Cascade) молча снесёт всю историю вместе со счётом. Ни то, ни другое
      // не нужно — архивируем вместо удаления, счёт просто перестаёт
      // считаться активным, но операции остаются на месте.
      await prisma.account.update({ where: { id }, data: { isActive: false } });
      return { archived: true };
    }

    await prisma.account.delete({ where: { id } });
    return { archived: false };
  }

  async getTotalBalance(userId: string) {
    const [user, accounts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { primaryCurrency: true } }),
      prisma.account.findMany({
        where: { userId, isActive: true },
        select: { balance: true, currency: true },
      }),
    ]);

    const primaryCurrency = user?.primaryCurrency || '₸';
    const hasMixedCurrencies = accounts.some((acc) => acc.currency !== primaryCurrency);

    let rates: Record<string, number> = {};
    if (hasMixedCurrencies) {
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // если курс недоступен — считаем без конвертации, лучше приблизительная сумма, чем ошибка
      }
    }

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + convertAmount(Number(acc.balance), acc.currency, primaryCurrency, rates),
      0
    );

    return { totalBalance, currency: primaryCurrency };
  }

  async getHistory(userId: string, accountId: string, limit = 50) {
    // проверяем что счет принадлежит пользователю
    await this.getById(userId, accountId);

    const [transactions, transfersOut, transfersIn] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, accountId, isDeleted: false },
        include: { category: true },
        orderBy: { transactionDate: 'desc' },
        take: limit,
      }),
      prisma.transfer.findMany({
        where: { userId, fromAccountId: accountId },
        include: { toAccount: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.transfer.findMany({
        where: { userId, toAccountId: accountId },
        include: { fromAccount: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const items = [
      ...transactions.map((t) => ({
        id: t.id,
        description: t.title || t.category?.name || 'Операция',
        date: t.transactionDate,
        amount: t.type === 'expense' ? -Number(t.amount) : Number(t.amount),
        currency: t.currency,
      })),
      ...transfersOut.map((t) => ({
        id: t.id,
        description: `Перевод → ${t.toAccount?.name ?? ''}`.trim(),
        date: t.createdAt,
        amount: -Number(t.amount),
        currency: t.currency,
      })),
      ...transfersIn.map((t) => ({
        id: t.id,
        description: `Перевод ← ${t.fromAccount?.name ?? ''}`.trim(),
        date: t.createdAt,
        // Важно: показываем именно зачисленную сумму в валюте ПОЛУЧАТЕЛЯ,
        // а не сумму списания у отправителя — если валюты счетов разные,
        // это разные числа.
        amount: Number(t.receivedAmount),
        currency: t.toCurrency,
      })),
    ];

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items.slice(0, limit);
  }
}

export default new AccountService();
