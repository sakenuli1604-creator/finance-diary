import { prisma } from '../lib/prisma';
import { getExchangeRates } from './exchangeRateService';
import { convertAmount } from '../utils/currency';
import budgetService from './budgetService';


export interface FeedEvent {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  createdAt: Date;
  severity: 'success' | 'info' | 'warning' | 'error';
}

class FeedService {
  async getFeed(userId: string, limit = 20): Promise<FeedEvent[]> {
    const events: FeedEvent[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryCurrency: true },
    });
    const primaryCurrency = user?.primaryCurrency || '₸';

    // 1. Достигнутые цели
    const completedGoals = await prisma.goal.findMany({
      where: { userId, isCompleted: true, updatedAt: { gte: thirtyDaysAgo } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });
    for (const goal of completedGoals) {
      events.push({
        id: `goal-${goal.id}`,
        type: 'goal_completed',
        icon: '🎉',
        title: 'Цель достигнута!',
        description: `Поздравляем! Вы достигли цели «${goal.name}».`,
        createdAt: goal.updatedAt,
        severity: 'success',
      });
    }

    // 2. Бюджетные предупреждения (переиспользуем уже готовую логику)
    try {
      const alerts = await budgetService.getAlerts(userId);
      alerts.forEach((a) => {
        events.push({
          id: `budget-${a.budgetId}`,
          type: 'budget_alert',
          icon: a.isOverBudget ? '🚨' : '⚠️',
          title: a.isOverBudget ? 'Бюджет превышен!' : 'Бюджет почти исчерпан',
          description: `«${a.budgetName}»: израсходовано ${Math.round(a.percentage)}%${
            a.categoryName ? ` (${a.categoryName})` : ''
          }.`,
          createdAt: now,
          severity: a.isOverBudget ? 'error' : 'warning',
        });
      });
    } catch {
      // бюджеты — необязательная фича, не роняем всю ленту из-за них
    }

    // Курс нужен для сравнения расходов в разных валютах — получаем один раз
    let rates: Record<string, number> = {};
    try {
      rates = (await getExchangeRates()).rates;
    } catch {
      // без курса — часть событий может быть чуть неточной, не критично
    }

    // 3. Сравнение расходов с прошлым месяцем
    const monthComparison = await this.getMonthComparison(userId, primaryCurrency, rates);
    if (monthComparison) events.push(monthComparison);

    // 4. Самый дорогой день в текущем месяце
    const expensiveDay = await this.getMostExpensiveDay(userId, primaryCurrency, rates);
    if (expensiveDay) events.push(expensiveDay);

    // 5. Серия дней подряд с операциями
    const streak = await this.getStreak(userId);
    if (streak >= 7) {
      events.push({
        id: 'streak',
        type: 'streak',
        icon: '🔥',
        title: 'Отличная работа!',
        description: `Вы ведёте учёт уже ${streak} ${this.daysWord(streak)} подряд.`,
        createdAt: now,
        severity: 'success',
      });
    }

    // 6. Рекорд — самая крупная трата за последнюю неделю
    const record = await this.getBiggestRecentExpense(userId, primaryCurrency, rates);
    if (record) events.push(record);

    return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  private daysWord(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
    return 'дней';
  }

  private async getMonthComparison(
    userId: string,
    primaryCurrency: string,
    rates: Record<string, number>
  ): Promise<FeedEvent | null> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthTx, lastMonthTx] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          isDeleted: false,
          transactionDate: { gte: thisMonthStart },
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          isDeleted: false,
          transactionDate: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
    ]);

    const sum = (txs: typeof thisMonthTx) =>
      txs.reduce((s, t) => s + convertAmount(Number(t.amount), t.currency, primaryCurrency, rates), 0);

    const thisMonth = sum(thisMonthTx);
    const lastMonth = sum(lastMonthTx);

    if (lastMonth === 0) return null;

    const change = ((thisMonth - lastMonth) / lastMonth) * 100;
    if (Math.abs(change) < 10) return null;

    return {
      id: 'month-comparison',
      type: 'month_comparison',
      icon: change < 0 ? '📈' : '📉',
      title: change < 0 ? 'Отличные новости!' : 'Расходы выросли',
      description: `В этом месяце расходы ${change < 0 ? 'снизились' : 'выросли'} на ${Math.abs(
        change
      ).toFixed(0)}% по сравнению с прошлым.`,
      createdAt: new Date(),
      severity: change < 0 ? 'success' : 'info',
    };
  }

  private async getMostExpensiveDay(
    userId: string,
    primaryCurrency: string,
    rates: Record<string, number>
  ): Promise<FeedEvent | null> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId, type: 'expense', isDeleted: false, transactionDate: { gte: monthStart } },
    });
    if (transactions.length === 0) return null;

    const dayTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      const day = t.transactionDate.toISOString().split('T')[0];
      dayTotals[day] =
        (dayTotals[day] || 0) + convertAmount(Number(t.amount), t.currency, primaryCurrency, rates);
    });

    const days = Object.entries(dayTotals);
    const avg = days.reduce((s, [, v]) => s + v, 0) / days.length;
    const [topDay, topAmount] = days.reduce((max, cur) => (cur[1] > max[1] ? cur : max));

    if (topAmount <= avg * 1.5) return null;

    const isToday = topDay === now.toISOString().split('T')[0];
    return {
      id: 'expensive-day',
      type: 'expensive_day',
      icon: '💸',
      title: isToday ? 'Сегодня самый дорогой день!' : 'Рекорд расходов за месяц',
      description: `${
        isToday ? 'Сегодня' : new Date(topDay).toLocaleDateString('ru-RU')
      } потрачено ${Math.round(topAmount)} ${primaryCurrency} — заметно больше обычного.`,
      createdAt: now,
      severity: 'warning',
    };
  }

  private async getStreak(userId: string): Promise<number> {
    const transactions = await prisma.transaction.findMany({
      where: { userId, isDeleted: false },
      orderBy: { transactionDate: 'desc' },
      take: 365,
      select: { transactionDate: true },
    });
    if (transactions.length === 0) return 0;

    const uniqueDays: string[] = Array.from(
      new Set(transactions.map((t): string => t.transactionDate.toISOString().split('T')[0]))
    ).sort((a, b) => (a < b ? 1 : -1));

    let streak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const current = new Date(uniqueDays[i]);
      const next = new Date(uniqueDays[i + 1]);
      const diffDays = Math.round((current.getTime() - next.getTime()) / 86400000);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private async getBiggestRecentExpense(
    userId: string,
    primaryCurrency: string,
    rates: Record<string, number>
  ): Promise<FeedEvent | null> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const transactions = await prisma.transaction.findMany({
      where: { userId, type: 'expense', isDeleted: false, createdAt: { gte: weekAgo } },
      include: { category: true },
    });
    if (transactions.length === 0) return null;

    let biggest = transactions[0];
    let biggestConverted = convertAmount(
      Number(biggest.amount),
      biggest.currency,
      primaryCurrency,
      rates
    );

    for (const t of transactions.slice(1)) {
      const converted = convertAmount(Number(t.amount), t.currency, primaryCurrency, rates);
      if (converted > biggestConverted) {
        biggest = t;
        biggestConverted = converted;
      }
    }

    // Показываем только если это действительно заметная сумма (не шум)
    if (biggestConverted < 1) return null;

    return {
      id: 'biggest-transaction',
      type: 'record',
      icon: '💰',
      title: 'Крупная трата на этой неделе',
      description: `Самая большая покупка: «${biggest.title || biggest.category?.name || 'Операция'}» — ${Math.round(
        biggestConverted
      )} ${primaryCurrency}.`,
      createdAt: biggest.createdAt,
      severity: 'info',
    };
  }
}

export default new FeedService();
