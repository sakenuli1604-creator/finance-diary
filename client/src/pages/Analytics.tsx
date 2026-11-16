import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Hash,
} from 'lucide-react';
import { analyticsAPI, ProjectAnalytics } from '../api/analytics';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Period = 'week' | 'month' | 'year';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Границы периода со сдвигом: offset 0 — текущий, -1 — предыдущий и т.д.
// Неделя — календарная (пн–вс). Для текущего периода конец = сегодня, чтобы не рисовать пустое будущее.
const getPeriodBounds = (period: Period, offset: number) => {
  const now = new Date();
  let start: Date;
  let fullEnd: Date;

  if (period === 'week') {
    const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday + offset * 7);
    fullEnd = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    fullEnd = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0));
  } else {
    start = new Date(now.getFullYear() + offset, 0, 1);
    fullEnd = endOfDay(new Date(start.getFullYear(), 11, 31));
  }

  return {
    from: startOfDay(start),
    to: offset === 0 ? endOfDay(now) : fullEnd,
    fullEnd,
  };
};

// Предыдущий период для сравнения. Для текущего (неполного) периода берём столько же дней от начала
const getPrevBounds = (period: Period, offset: number) => {
  const cur = getPeriodBounds(period, offset);
  const prev = getPeriodBounds(period, offset - 1);
  if (offset < 0) return { from: prev.from, to: prev.fullEnd };
  const elapsed = cur.to.getTime() - cur.from.getTime();
  return {
    from: prev.from,
    to: new Date(Math.min(prev.fullEnd.getTime(), prev.from.getTime() + elapsed)),
  };
};

const periodLabel = (period: Period, offset: number) => {
  const { from, fullEnd } = getPeriodBounds(period, offset);
  if (period === 'year') return String(from.getFullYear());
  if (period === 'month') {
    const label = from
      .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      .replace(/\s?г\.$/, '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const sameMonth = from.getMonth() === fullEnd.getMonth();
  return sameMonth
    ? `${from.getDate()}–${fullEnd.getDate()} ${fullEnd.toLocaleDateString('ru-RU', { month: 'short' })}`
    : `${from.getDate()} ${from.toLocaleDateString('ru-RU', { month: 'short' })} – ${fullEnd.getDate()} ${fullEnd.toLocaleDateString('ru-RU', { month: 'short' })}`;
};

// Изменение к прошлому периоду. Для расходов рост — плохо (красный), для доходов — хорошо
const Delta: React.FC<{ current: number; previous: number; upIsGood: boolean }> = ({
  current,
  previous,
  upIsGood,
}) => {
  if (!previous || previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) {
    return <p className="text-xs text-secondary mt-1">≈ как в прошлом периоде</p>;
  }
  const up = pct > 0;
  const good = up === upIsGood;
  return (
    <p className={`text-xs mt-1 ${good ? 'text-income' : 'text-expense'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% к прошлому периоду
    </p>
  );
};

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const primaryCurrency = user?.primaryCurrency || '₸';
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0); // 0 — текущий период, -1 — предыдущий, ...
  const [categoryView, setCategoryView] = useState<'expense' | 'income'>('expense');
  const [prevSummary, setPrevSummary] = useState<any>(null);
  // счётчики запросов: устаревший ответ не должен перезаписать свежий при быстром листании периодов
  const loadId = useRef(0);
  const topId = useRef(0);
  const [summary, setSummary] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [topExpenses, setTopExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<ProjectAnalytics[]>([]);
  const [tagsBreakdown, setTagsBreakdown] = useState<ProjectAnalytics[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, offset, excludeTagIds]);

  // Топ-5 грузим отдельно: он зависит ещё и от переключателя "Расходы / Доходы"
  useEffect(() => {
    const id = ++topId.current;
    const bounds = getPeriodBounds(period, offset);
    analyticsAPI
      .getTopExpenses(bounds.from.toISOString(), bounds.to.toISOString(), 5, excludeTagIds, categoryView)
      .then((data) => {
        if (id === topId.current) setTopExpenses(data);
      })
      .catch((error) => console.error('Failed to load top list:', error));
  }, [period, offset, excludeTagIds, categoryView]);

  const trendsGroupBy = period === 'week' ? 'day' : period === 'month' ? 'week' : 'month';

  const changePeriod = (next: Period) => {
    setPeriod(next);
    setOffset(0);
  };

  const loadData = async () => {
    const id = ++loadId.current;
    setIsLoading(true);
    try {
      const bounds = getPeriodBounds(period, offset);
      const prevBounds = getPrevBounds(period, offset);
      // Отправляем моменты времени (границы дня в часовом поясе пользователя), а не "голые" даты:
      // сервер читает дату как полночь UTC, из-за чего последний день периода выпадал
      const fromStr = bounds.from.toISOString();
      const toStr = bounds.to.toISOString();

      const [summaryData, prevSummaryData, categoryData, trendsData, projectsData, tagsBreakdownData] =
        await Promise.all([
          analyticsAPI.getSummary(fromStr, toStr, excludeTagIds),
          analyticsAPI.getSummary(prevBounds.from.toISOString(), prevBounds.to.toISOString(), excludeTagIds),
          analyticsAPI.getByCategory(fromStr, toStr, excludeTagIds),
          analyticsAPI.getTrends(fromStr, toStr, trendsGroupBy, excludeTagIds),
          analyticsAPI.getProjects(fromStr, toStr),
          analyticsAPI.getTagsBreakdown(fromStr, toStr),
        ]);

      if (id !== loadId.current) return;
      setSummary(summaryData);
      setPrevSummary(prevSummaryData);
      setByCategory(categoryData);
      setTrends(trendsData);
      setProjects(projectsData);
      setTagsBreakdown(tagsBreakdownData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#6366F1',
    '#14B8A6',
  ];

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Аналитика</h1>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            <Button
              variant={period === 'week' ? 'primary' : 'secondary'}
              onClick={() => changePeriod('week')}
              className="flex-1"
            >
              Неделя
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'secondary'}
              onClick={() => changePeriod('month')}
              className="flex-1"
            >
              Месяц
            </Button>
            <Button
              variant={period === 'year' ? 'primary' : 'secondary'}
              onClick={() => changePeriod('year')}
              className="flex-1"
            >
              Год
            </Button>
          </div>

          {/* Навигация по прошлым периодам */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-muted"
              aria-label="Предыдущий период"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="text-center">
              <p className="font-semibold text-primary">{periodLabel(period, offset)}</p>
              {offset !== 0 && (
                <button
                  onClick={() => setOffset(0)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  К текущему периоду
                </button>
              )}
            </div>
            <button
              onClick={() => setOffset((o) => Math.min(0, o + 1))}
              disabled={offset === 0}
              className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Следующий период"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {projects.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-secondary mb-1.5">
                Скрыть из основной аналитики:
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {projects.map((project) => (
                  <label
                    key={project.tagId}
                    className="flex items-center gap-1.5 text-sm text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={excludeTagIds.includes(project.tagId)}
                      onChange={(e) =>
                        setExcludeTagIds((prev) =>
                          e.target.checked
                            ? [...prev, project.tagId]
                            : prev.filter((id) => id !== project.tagId)
                        )
                      }
                    />
                    #{project.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`max-w-4xl mx-auto px-4 py-6 space-y-6 transition-opacity ${isLoading ? 'opacity-50' : ''}`}
      >
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-income" size={20} />
              <p className="text-sm text-secondary">Доходы</p>
            </div>
            <p className="text-2xl font-bold text-income">
              +{formatAmount(summary?.totalIncome || 0)} {primaryCurrency}
            </p>
            <Delta
              current={summary?.totalIncome || 0}
              previous={prevSummary?.totalIncome || 0}
              upIsGood
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-expense" size={20} />
              <p className="text-sm text-secondary">Расходы</p>
            </div>
            <p className="text-2xl font-bold text-expense">
              -{formatAmount(summary?.totalExpense || 0)} {primaryCurrency}
            </p>
            <Delta
              current={summary?.totalExpense || 0}
              previous={prevSummary?.totalExpense || 0}
              upIsGood={false}
            />
          </Card>

          <Card className="p-4">
            <p className="text-sm text-secondary mb-2">Накопления</p>
            <p
              className={`text-2xl font-bold ${
                (summary?.savings || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}
            >
              {(summary?.savings || 0) >= 0 ? '+' : ''}
              {formatAmount(summary?.savings || 0)} {primaryCurrency}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-secondary mb-2">{offset === 0 ? 'Баланс' : 'Баланс сейчас'}</p>
            <p className="text-2xl font-bold text-primary">
              {formatAmount(summary?.balance || 0)} {primaryCurrency}
            </p>
          </Card>
        </div>

        {/* Trends Chart */}
        {trends.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Динамика</h2>
            <div className="w-full h-64 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (trendsGroupBy === 'month') {
                        return date.toLocaleDateString('ru-RU', { month: 'short' });
                      }
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => formatAmount(value) + ' ' + primaryCurrency}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      if (trendsGroupBy === 'month') {
                        return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
                      }
                      return date.toLocaleDateString('ru-RU');
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Доходы"
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Расходы"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {byCategory.length > 0 && (() => {
          const viewCategories = byCategory.filter((c) => c.type === categoryView);
          const colorFor = (c: any, index: number) => c.categoryColor || COLORS[index % COLORS.length];
          return (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-semibold">
                  {categoryView === 'expense' ? 'Расходы по категориям' : 'Доходы по категориям'}
                </h2>
                <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
                  {(['expense', 'income'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setCategoryView(v)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        categoryView === v ? 'bg-surface text-primary shadow-sm' : 'text-secondary'
                      }`}
                    >
                      {v === 'expense' ? 'Расходы' : 'Доходы'}
                    </button>
                  ))}
                </div>
              </div>

              {viewCategories.length === 0 ? (
                <p className="text-secondary text-sm text-center py-6">
                  За этот период нет {categoryView === 'expense' ? 'расходов' : 'доходов'}
                </p>
              ) : (
                <>
                  {/* Pie Chart */}
                  <div className="w-full h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={viewCategories}
                          dataKey="total"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.categoryName} ${entry.percentage.toFixed(0)}%`}
                        >
                          {viewCategories.map((entry, index) => (
                            <Cell key={`cell-${entry.categoryId}`} fill={colorFor(entry, index)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatAmount(value) + ' ' + primaryCurrency} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category List */}
                  <div className="space-y-2">
                    {viewCategories.map((category, index) => (
                      <div
                        key={category.categoryId}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: colorFor(category, index) }}
                          />
                          <div>
                            <p className="font-medium text-primary">
                              {category.categoryIcon} {category.categoryName}
                            </p>
                            <p className="text-xs text-secondary">{category.count} операций</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatAmount(category.total)} {primaryCurrency}
                          </p>
                          <p className="text-xs text-secondary">{category.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          );
        })()}

        {/* Top Expenses */}
        {topExpenses.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              {categoryView === 'expense' ? 'Топ-5 расходов' : 'Топ-5 доходов'}
            </h2>
            <div className="space-y-3">
              {topExpenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        categoryView === 'expense' ? 'bg-expense/10 text-expense' : 'bg-income/10 text-income'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {expense.title || expense.category.name}
                      </p>
                      <p className="text-xs text-secondary">
                        {new Date(expense.transactionDate).toLocaleDateString('ru-RU')}
                        {expense.shop && ` • ${expense.shop}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold ${categoryView === 'expense' ? 'text-expense' : 'text-income'}`}>
                    {formatAmount(Number(expense.amount))} {expense.currency}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={18} className="text-secondary" />
              <h2 className="text-lg font-semibold">Проекты</h2>
            </div>
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.tagId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <p className="font-medium text-primary">#{project.name}</p>
                      <p className="text-xs text-secondary">{project.count} операций</p>
                    </div>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatAmount(project.total)} {primaryCurrency}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-secondary mt-3">
              Сумма, потраченная на каждый проект целиком — независимо от того, скрыт ли он из аналитики выше.
            </p>
          </Card>
        )}

        {/* By tag (обычные теги — не проектные) */}
        {tagsBreakdown.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Hash size={18} className="text-secondary" />
              <h2 className="text-lg font-semibold">По тегам</h2>
            </div>
            <div className="space-y-2">
              {tagsBreakdown.map((tag) => (
                <div
                  key={tag.tagId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div>
                      <p className="font-medium text-primary">#{tag.name}</p>
                      <p className="text-xs text-secondary">{tag.count} операций</p>
                    </div>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatAmount(tag.total)} {primaryCurrency}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* No Data */}
        {!summary?.transactionCount && (
          <Card className="p-8 text-center">
            <p className="text-secondary mb-4">
              {offset === 0 ? 'Недостаточно данных для аналитики' : 'За этот период нет операций'}
            </p>
            <Button onClick={() => navigate('/transactions/add')}>
              Добавить транзакцию
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
