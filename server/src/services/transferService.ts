import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

class TransferService {
  async getAll(userId: string, limit = 50) {
    const transfers = await prisma.transfer.findMany({
      where: { userId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transfers;
  }

  async getById(transferId: string, userId: string) {
    const transfer = await prisma.transfer.findFirst({
      where: {
        id: transferId,
        userId,
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return transfer;
  }

  async create(userId: string, data: CreateTransferDTO) {
    // Проверяем что оба счета принадлежат пользователю
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({
        where: { id: data.fromAccountId, userId },
      }),
      prisma.account.findFirst({
        where: { id: data.toAccountId, userId },
      }),
    ]);

    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    if (data.fromAccountId === data.toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Проверяем достаточно ли средств
    if (Number(fromAccount.balance) < data.amount) {
      throw new Error('Insufficient funds');
    }

    // Выполняем перевод в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем запись о переводе
      const transfer = await tx.transfer.create({
        data: {
          userId,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          amount: data.amount,
          description: data.description,
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      // Списываем со счета-источника
      await tx.account.update({
        where: { id: data.fromAccountId },
        data: {
          balance: { decrement: data.amount },
        },
      });

      // Зачисляем на счет-получатель
      await tx.account.update({
        where: { id: data.toAccountId },
        data: {
          balance: { increment: data.amount },
        },
      });

      return transfer;
    });

    return result;
  }

  async delete(transferId: string, userId: string) {
    const transfer = await this.getById(transferId, userId);

    // Отменяем перевод
    await prisma.$transaction(async (tx) => {
      // Возвращаем деньги обратно
      await tx.account.update({
        where: { id: transfer.fromAccountId },
        data: {
          balance: { increment: Number(transfer.amount) },
        },
      });

      await tx.account.update({
        where: { id: transfer.toAccountId },
        data: {
          balance: { decrement: Number(transfer.amount) },
        },
      });

      // Удаляем запись о переводе
      await tx.transfer.delete({
        where: { id: transferId },
      });
    });

    return { message: 'Transfer cancelled' };
  }
}

export default new TransferService();
