import { prisma } from '../lib/prisma';


// Простой and надёжный способ превратить значение в ячейку CSV
function csvCell(value: string | number): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvCell).join(',')];
  rows.forEach((row) => lines.push(row.map(csvCell).join(',')));
  return lines.join('\r\n');
}

class ExportService {
  async exportTransactionsCSV(userId: string, dateFrom?: Date, dateTo?: Date): Promise<string> {
    const where: any = { userId, isDeleted: false };
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = dateFrom;
      if (dateTo) where.transactionDate.lte = dateTo;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { transactionDate: 'desc' },
    });

    const headers = [
      'Дата',
      'Тип',
      'Категория',
      'Счёт',
      'Сумма',
      'Валюта',
      'Название',
      'Магазин',
      'Описание',
      'Оценка',
    ];

    const rows = transactions.map((t) => [
      new Date(t.transactionDate).toLocaleString('ru-RU'),
      t.type === 'income' ? 'Доход' : 'Расход',
      t.category?.name || '',
      t.account?.name || '',
      t.amount.toString(),
      t.currency,
      t.title || '',
      t.shop || '',
      t.description || '',
      t.rating ? t.rating.toString() : '',
    ]);

    return toCsv(headers, rows);
  }

  async exportAccountsCSV(userId: string): Promise<string> {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Название', 'Баланс', 'Валюта', 'Активен', 'Дата создания'];

    const rows = accounts.map((a) => [
      a.name,
      a.balance.toString(),
      a.currency,
      a.isActive ? 'Да' : 'Нет',
      new Date(a.createdAt).toLocaleString('ru-RU'),
    ]);

    return toCsv(headers, rows);
  }

  async exportGoalsCSV(userId: string): Promise<string> {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Название', 'Цель', 'Накоплено', 'Прогресс %', 'Срок', 'Статус'];

    const rows = goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const progress = target > 0 ? (current / target) * 100 : 0;

      return [
        g.name,
        g.targetAmount.toString(),
        g.currentAmount.toString(),
        progress.toFixed(1),
        g.deadline ? new Date(g.deadline).toLocaleDateString('ru-RU') : '',
        g.isCompleted ? 'Достигнута' : 'В процессе',
      ];
    });

    return toCsv(headers, rows);
  }
}

export default new ExportService();
