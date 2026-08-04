import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  PieChart,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { accountsAPI } from '../api/accounts';
import { transactionsAPI } from '../api/transactions';
import { FeedWidget } from '../components/feed/FeedWidget';
import { goalsAPI } from '../api/goals';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const primaryCurrency = user?.primaryCurrency || '₸';

  const [totalBalance, setTotalBalance] = useState(0);
  const [todayStats, setTodayStats] = useState({ income: 0, expense: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [balance, today, recent, goalsData] = await Promise.all([
        accountsAPI.getTotalBalance(),
        transactionsAPI.getTodayStats(),
        transactionsAPI.getRecent(5),
        goalsAPI.getAll(),
      ]);

      setTotalBalance(balance);
      setTodayStats(today);
      setRecentTransactions(recent);
      setGoals(goalsData.filter((g) => !g.isCompleted).slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm">Добро пожаловать,</p>
              <h1 className="text-2xl font-bold">{user?.name} 👋</h1>
            </div>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-white hover:bg-blue-500 p-2 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Total Balance Card */}
          <Card className="bg-surface/10 backdrop-blur-lg border-white/20 p-6">
            <p className="text-blue-100 text-sm mb-2">Общий баланс</p>
            <p className="text-4xl font-bold mb-4">
              {formatAmount(totalBalance)} {primaryCurrency}
            </p>

            {/* Today Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/10 rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Доходы сегодня</p>
                <p className="text-lg font-semibold text-green-300">
                  +{formatAmount(todayStats.income)} {primaryCurrency}
                </p>
              </div>
              <div className="bg-surface/10 rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Расходы сегодня</p>
                <p className="text-lg font-semibold text-red-300">
                  -{formatAmount(todayStats.expense)} {primaryCurrency}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card
              onClick={() => navigate('/transactions/add')}
              className="p-4 active:scale-95 transition-transform"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-expense/10 text-expense rounded-full flex items-center justify-center">
                  <TrendingDown size={24} />
                </div>
                <p className="font-medium text-primary">Добавить расход</p>
              </div>
            </Card>

            <Card
              onClick={() => navigate('/transactions/add')}
              className="p-4 active:scale-95 transition-transform"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-income/10 text-income rounded-full flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <p className="font-medium text-primary">Добавить доход</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">События</h2>
            <Link to="/feed" className="text-blue-600 text-sm font-medium">
              Все →
            </Link>
          </div>
          <FeedWidget />
        </div>

        {/* Main Menu */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/accounts">
            <Card className="p-6 hover:bg-muted transition-colors active:scale-95">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-blue-600" size={24} />
                <h3 className="font-semibold text-primary">Счета</h3>
              </div>
              <p className="text-sm text-secondary">Управление счетами</p>
            </Card>
          </Link>

          <Link to="/transactions">
            <Card className="p-6 hover:bg-muted transition-colors active:scale-95">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="text-purple-600" size={24} />
                <h3 className="font-semibold text-primary">Транзакции</h3>
              </div>
              <p className="text-sm text-secondary">История операций</p>
            </Card>
          </Link>

          <Link to="/goals">
            <Card className="p-6 hover:bg-muted transition-colors active:scale-95">
              <div className="flex items-center gap-3 mb-2">
                <Target className="text-orange-600" size={24} />
                <h3 className="font-semibold text-primary">Цели</h3>
              </div>
              <p className="text-sm text-secondary">Планирование</p>
            </Card>
          </Link>

          <Link to="/analytics">
            <Card className="p-6 hover:bg-muted transition-colors active:scale-95">
              <div className="flex items-center gap-3 mb-2">
                <PieChart className="text-income" size={24} />
                <h3 className="font-semibold text-primary">Аналитика</h3>
              </div>
              <p className="text-sm text-secondary">Статистика</p>
            </Card>
          </Link>
        </div>

        {/* Active Goals */}
        {goals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Активные цели</h2>
              <Link to="/goals" className="text-blue-600 text-sm font-medium">
                Все →
              </Link>
            </div>
            <div className="space-y-2">
              {goals.map((goal) => {
                const progress =
                  (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                return (
                  <Card
                    key={goal.id}
                    onClick={() => navigate(`/goals/${goal.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon || '🎯'}</span>
                        <span className="font-medium text-primary">
                          {goal.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted-strong rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Последние операции</h2>
              <Link
                to="/transactions"
                className="text-blue-600 text-sm font-medium"
              >
                Все →
              </Link>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  className="p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{
                          backgroundColor:
                            transaction.category?.color || '#E5E7EB',
                        }}
                      >
                        {transaction.category?.icon || '📌'}
                      </div>
                      <div>
                        <p className="font-medium text-primary">
                          {transaction.title || transaction.category?.name}
                        </p>
                        <p className="text-xs text-secondary">
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-bold ${
                        transaction.type === 'income'
                          ? 'text-income'
                          : 'text-expense'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(Number(transaction.amount))} {transaction.currency}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/transactions/add')}
        className="fixed bottom-20 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-10"
      >
        <Plus size={32} />
      </button>

      {/* Menu Modal */}
      <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="space-y-2">
          <Link to="/categories" onClick={() => setIsMenuOpen(false)}>
            <Card className="p-4 hover:bg-muted">
              <p className="font-medium text-primary">Категории</p>
            </Card>
          </Link>

          <Link to="/budgets" onClick={() => setIsMenuOpen(false)}>
            <Card className="p-4 hover:bg-muted">
              <p className="font-medium text-primary">Бюджеты</p>
            </Card>
          </Link>

          <Link to="/settings" onClick={() => setIsMenuOpen(false)}>
            <Card className="p-4 hover:bg-muted">
              <p className="font-medium text-primary">Настройки</p>
            </Card>
          </Link>

          <Card
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }}
            className="p-4 hover:bg-expense/10 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-expense">
              <LogOut size={20} />
              <p className="font-medium">Выйти</p>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
};
