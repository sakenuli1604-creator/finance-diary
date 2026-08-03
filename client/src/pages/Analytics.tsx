import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { analyticsAPI } from '../api/analytics';
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

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const primaryCurrency = user?.primaryCurrency || '₸';
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [summary, setSummary] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [topExpenses, setTopExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let from: Date;

      if (period === 'week') {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        from = new Date(now.getFullYear(), 0, 1);
      }

      const fromStr = from.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];

      const [summaryData, categoryData, trendsData, topExpensesData] =
        await Promise.all([
          analyticsAPI.getSummary(fromStr, toStr),
          analyticsAPI.getByCategory(fromStr, toStr),
          analyticsAPI.getTrends(fromStr, toStr, period === 'week' ? 'day' : 'week'),
          analyticsAPI.getTopExpenses(fromStr, toStr, 5),
        ]);

      setSummary(summaryData);
      setByCategory(categoryData);
      setTrends(trendsData);
      setTopExpenses(topExpensesData);
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

  if (isLoading) {
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
              onClick={() => setPeriod('week')}
              className="flex-1"
            >
              Неделя
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('month')}
              className="flex-1"
            >
              Месяц
            </Button>
            <Button
              variant={period === 'year' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('year')}
              className="flex-1"
            >
              Год
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-expense" size={20} />
              <p className="text-sm text-secondary">Расходы</p>
            </div>
            <p className="text-2xl font-bold text-expense">
              -{formatAmount(summary?.totalExpense || 0)} {primaryCurrency}
            </p>
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
            <p className="text-sm text-secondary mb-2">Баланс</p>
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
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => formatAmount(value) + ' ' + primaryCurrency}
                    labelFormatter={(label) => {
                      const date = new Date(label);
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
        {byCategory.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Расходы по категориям</h2>

            {/* Pie Chart */}
            <div className="w-full h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory.filter((c) => c.type === 'expense')}
                    dataKey="total"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.categoryName} ${entry.percentage.toFixed(0)}%`}
                  >
                    {byCategory
                      .filter((c) => c.type === 'expense')
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatAmount(value) + ' ' + primaryCurrency} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {byCategory
                .filter((c) => c.type === 'expense')
                .map((category, index) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium text-primary">
                          {category.categoryIcon} {category.categoryName}
                        </p>
                        <p className="text-xs text-secondary">
                          {category.count} операций
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatAmount(category.total)} {primaryCurrency}
                      </p>
                      <p className="text-xs text-secondary">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Top Expenses */}
        {topExpenses.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Топ-5 расходов</h2>
            <div className="space-y-3">
              {topExpenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-expense/10 text-expense flex items-center justify-center font-bold text-sm">
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
                  <p className="font-bold text-expense">
                    {formatAmount(Number(expense.amount))} {expense.currency}
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
              Недостаточно данных для аналитики
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
