import { PrismaClient } from '@prisma/client';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';

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

    if (Number(fromAccount.balance) < data.amount) {
      throw new Error('Insufficient funds');
    }

    // Если валюты счетов разные — конвертируем сумму по текущему курсу.
    // Снапшотим обе валюты на момент перевода, чтобы дальнейшая смена
    // валюты счёта не искажала историю (та же логика, что и у транзакций).
    let receivedAmount = data.amount;
    if (fromAccount.currency !== toAccount.currency) {
      let rates: Record<string, number> = {};
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — переводим 1:1, лучше приблизительно, чем упасть с ошибкой
      }
      receivedAmount = convertAmount(data.amount, fromAccount.currency, toAccount.currency, rates);
    }

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.create({
        data: {
          userId,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          amount: data.amount,
          currency: fromAccount.currency,
          receivedAmount,
          toCurrency: toAccount.currency,
          description: data.description,
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      await tx.account.update({
        where: { id: data.fromAccountId },
        data: {
          balance: { decrement: data.amount },
        },
      });

      await tx.account.update({
        where: { id: data.toAccountId },
        data: {
          balance: { increment: receivedAmount },
        },
      });

      return transfer;
    });

    return result;
  }

  async delete(transferId: string, userId: string) {
    const transfer = await this.getById(transferId, userId);

    const fromAccount = transfer.fromAccount;
    const toAccount = transfer.toAccount;

    let amountForFrom = Number(transfer.amount);
    if (transfer.currency !== fromAccount.currency) {
      let rates: Record<string, number> = {};
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — откатываем как есть
      }
      amountForFrom = convertAmount(Number(transfer.amount), transfer.currency, fromAccount.currency, rates);
    }

    let amountForTo = Number(transfer.receivedAmount);
    if (transfer.toCurrency !== toAccount.currency) {
      let rates: Record<string, number> = {};
      try {
        rates = (await getExchangeRates()).rates;
      } catch {
        // без курса — откатываем как есть
      }
      amountForTo = convertAmount(Number(transfer.receivedAmount), transfer.toCurrency, toAccount.currency, rates);
    }

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: transfer.fromAccountId },
        data: {
          balance: { increment: amountForFrom },
        },
      });

      await tx.account.update({
        where: { id: transfer.toAccountId },
        data: {
          balance: { decrement: amountForTo },
        },
      });

      await tx.transfer.delete({
        where: { id: transferId },
      });
    });

    return { message: 'Transfer cancelled' };
  }
}

export default new TransferService();
