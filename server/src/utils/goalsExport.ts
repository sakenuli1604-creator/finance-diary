// Цели для внешних интеграций (Genos): превращаем строки из базы в простой JSON.
// Модуль не зависит от Prisma, поэтому его легко проверять отдельно.

export interface GoalItemRow {
  name: string;
  targetAmount: unknown;
  currentAmount: unknown;
  isCompleted: boolean;
}

export interface GoalRow {
  id: string;
  name: string;
  currency: string;
  targetAmount: unknown;
  currentAmount: unknown;
  deadline: Date | null;
  isCompleted: boolean;
  updatedAt: Date;
  items: GoalItemRow[];
}

const round2 = (value: unknown): number => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// Срок цели как календарная дата в часовом поясе пользователя (YYYY-MM-DD).
export function dateInTimezone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function serializeGoals(goals: GoalRow[], timeZone: string, now: Date = new Date()) {
  return {
    timezone: timeZone,
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      currency: goal.currency,
      targetAmount: round2(goal.targetAmount),
      currentAmount: round2(goal.currentAmount),
      deadlineDate: goal.deadline ? dateInTimezone(goal.deadline, timeZone) : null,
      isCompleted: goal.isCompleted,
      updatedAt: goal.updatedAt.toISOString(),
      // подцели: что уже набрано, а что ещё нет
      items: goal.items.map((item) => ({
        name: item.name,
        targetAmount: round2(item.targetAmount),
        currentAmount: round2(item.currentAmount),
        isCompleted: item.isCompleted,
      })),
    })),
    generatedAt: now.toISOString(),
  };
}
