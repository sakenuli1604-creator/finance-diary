import { prisma } from '../lib/prisma';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';


export interface CreateGoalDTO {
  name: string;
  targetAmount: number;
  accountId?: string;
  deadline?: Date;
  icon?: string;
}

export interface UpdateGoalDTO {
  name?: string;
  targetAmount?: number;
  deadline?: Date;
  icon?: string;
  isCompleted?: boolean;
}

class GoalService {
  async getAll(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals;
  }

  async getById(goalId: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      include: {
        account: true,
      },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return goal;
  }

  async create(userId: string, data: CreateGoalDTO) {
    // Если указан счет, проверяем что он существует
    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: data.accountId,
          userId,
        },
      });

      if (!account) {
        throw new Error('Account not found');
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        accountId: data.accountId,
        deadline: data.deadline,
        icon: data.icon,
      },
      include: {
        account: true,
      },
    });

    return goal;
  }

  async update(goalId: string, userId: string, data: UpdateGoalDTO) {
    await this.getById(goalId, userId);

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        account: true,
      },
    });

    return goal;
  }

  async delete(goalId: string, userId: string) {
    await this.getById(goalId, userId);

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { message: 'Goal deleted' };
  }

  async deposit(goalId: string, userId: string, amount: number, accountId: string) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const goal = await this.getById(goalId, userId);

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    if (Number(account.balance) < amount) {
      throw new Error('Insufficient funds');
    }

    // Цель хранится в основной валюте пользователя, а счёт может быть в
    // другой — конвертируем сумму пополнения, иначе цифры просто "плывут"
    // (та же логика, что и у транзакций/переводов).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryCurrency: true },
    });
    const primaryCurrency = user?.primaryCurrency || '₸';

    let amountInGoalCurrency = amount;
    if (account.currency !== primaryCurrency) {
      let rates: Record<string, number> = {};
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — переводим 1:1
      }
      amountInGoalCurrency = convertAmount(amount, account.currency, primaryCurrency, rates);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Списываем со счёта атомарно и сразу проверяем итог — защита от гонки
      // при параллельных операциях с одним и тем же счётом.
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
      if (Number(updatedAccount.balance) < 0) {
        throw new Error('Insufficient funds');
      }

      // Увеличиваем сумму цели тоже атомарно (не читаем-считаем-пишем)
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: amountInGoalCurrency }, updatedAt: new Date() },
        include: { account: true },
      });

      const isCompleted = Number(updatedGoal.currentAmount) >= Number(updatedGoal.targetAmount);
      if (isCompleted !== updatedGoal.isCompleted) {
        return tx.goal.update({
          where: { id: goalId },
          data: { isCompleted },
          include: { account: true },
        });
      }

      return updatedGoal;
    });

    return result;
  }

  async withdraw(goalId: string, userId: string, amount: number, accountId: string) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const goal = await this.getById(goalId, userId);
    if (Number(goal.currentAmount) < amount) {
      throw new Error('Insufficient goal funds');
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryCurrency: true },
    });
    const primaryCurrency = user?.primaryCurrency || '₸';

    let amountInAccountCurrency = amount;
    if (account.currency !== primaryCurrency) {
      let rates: Record<string, number> = {};
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — переводим 1:1
      }
      amountInAccountCurrency = convertAmount(amount, primaryCurrency, account.currency, rates);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Атомарно уменьшаем сумму цели и сразу проверяем итог
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: { decrement: amount },
          isCompleted: false,
          updatedAt: new Date(),
        },
        include: { account: true },
      });
      if (Number(updatedGoal.currentAmount) < 0) {
        throw new Error('Insufficient goal funds');
      }

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amountInAccountCurrency } },
      });

      return updatedGoal;
    });

    return result;
  }
}

export default new GoalService();
