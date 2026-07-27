import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Проверяем счет
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (Number(account.balance) < amount) {
      throw new Error('Insufficient funds');
    }

    // Выполняем операцию
    const result = await prisma.$transaction(async (tx) => {
      // Увеличиваем сумму цели
      const newCurrentAmount = Number(goal.currentAmount) + amount;
      const isCompleted = newCurrentAmount >= Number(goal.targetAmount);

      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrentAmount,
          isCompleted,
          updatedAt: new Date(),
        },
        include: {
          account: true,
        },
      });

      // Списываем со счета
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: { decrement: amount },
        },
      });

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

    // Проверяем счет
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Выполняем операцию
    const result = await prisma.$transaction(async (tx) => {
      // Уменьшаем сумму цели
      const newCurrentAmount = Number(goal.currentAmount) - amount;

      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrentAmount,
          isCompleted: false,
          updatedAt: new Date(),
        },
        include: {
          account: true,
        },
      });

      // Зачисляем на счет
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: { increment: amount },
        },
      });

      return updatedGoal;
    });

    return result;
  }
}

export default new GoalService();
