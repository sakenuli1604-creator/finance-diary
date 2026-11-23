import { prisma } from '../lib/prisma';
import analyticsService from './analyticsService';
import { getUserTimezone } from '../utils/userTimezone';
import { startOfMonthTz } from '../utils/timezone';

export type IntegrationPeriod = 'month' | 'last_month' | 'all';
export const INTEGRATION_PERIODS: IntegrationPeriod[] = ['month', 'last_month', 'all'];

const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

class IntegrationService {
  // Сводка для внешних систем: итоги периода + траты по проектным тегам.
  // Границы месяца считаются в часовом поясе пользователя (как в бюджетах и ленте).
  async getOverview(userId: string, period: IntegrationPeriod, now: Date = new Date()) {
    const tz = await getUserTimezone(userId);

    let from: Date | undefined;
    let to: Date | undefined;
    if (period === 'month') {
      from = startOfMonthTz(now, tz);
      to = new Date(startOfMonthTz(now, tz, 1).getTime() - 1);
    } else if (period === 'last_month') {
      from = startOfMonthTz(now, tz, -1);
      to = new Date(startOfMonthTz(now, tz).getTime() - 1);
    }

    const projectTags = await prisma.tag.findMany({
      where: { userId, isProject: true },
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    });
    const projectTagIds = projectTags.map((t: { id: string }) => t.id);

    const [summary, regular, projects] = await Promise.all([
      analyticsService.getSummary(userId, from, to),
      // «обычные» траты: без операций с проектными тегами
      projectTagIds.length ? analyticsService.getSummary(userId, from, to, projectTagIds) : Promise.resolve(null),
      analyticsService.getProjectsBreakdown(userId, from, to),
    ]);

    // округляем сначала итоги, а проектные траты считаем как разность: так суммы в ответе всегда сходятся
    const totalExpense = round2(summary.totalExpense);
    const regularExpense = round2(regular ? regular.totalExpense : summary.totalExpense);

    return {
      period,
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      timezone: tz,
      currency: summary.currency,
      totalIncome: round2(summary.totalIncome),
      totalExpense,
      regularExpense,
      projectExpense: round2(totalExpense - regularExpense),
      savings: round2(summary.savings),
      balance: round2(summary.balance),
      transactionCount: summary.transactionCount,
      // траты по проектам; операция с несколькими проектными тегами учитывается в каждом из них
      projects: projects.map((p: { tagId: string; name: string; color: string; total: number; count: number }) => ({
        tagId: p.tagId,
        name: p.name,
        color: p.color,
        total: round2(p.total),
        count: p.count,
      })),
      // все проектные теги (даже без трат), чтобы их можно было выбрать для связи
      projectTags,
      generatedAt: new Date().toISOString(),
    };
  }
}

export default new IntegrationService();
