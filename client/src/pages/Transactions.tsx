import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { useAuthStore } from '../store/authStore';
import { useExchangeRatesStore } from '../store/exchangeRatesStore';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { convertAmount } from '../utils/currency';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, fetchTransactions } = useTransactionsStore();
  const { user } = useAuthStore();
  const { rates, fetchRates } = useExchangeRatesStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const primaryCurrency = user?.primaryCurrency || '₸';

  useEffect(() => {
    fetchTransactions(filter !== 'all' ? { type: filter } : undefined);
  }, [filter, fetchTransactions]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce(
      (sum, t) =>
        sum + convertAmount(Number(t.amount), t.currency, primaryCurrency, rates),
      0
    );

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce(
      (sum, t) =>
        sum + convertAmount(Number(t.amount), t.currency, primaryCurrency, rates),
      0
    );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Транзакции</h1>
            </div>
            <button className="text-gray-600 hover:text-gray-900">
              <Filter size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Доходы</p>
            <p className="text-xl font-bold text-green-600">
              +{formatAmount(totalIncome)} {primaryCurrency}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-1">Расходы</p>
            <p className="text-xl font-bold text-red-600">
              -{formatAmount(totalExpense)} {primaryCurrency}
            </p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            Все
          </Button>
          <Button
            variant={filter === 'income' ? 'primary' : 'secondary'}
            onClick={() => setFilter('income')}
          >
            Доходы
          </Button>
          <Button
            variant={filter === 'expense' ? 'primary' : 'secondary'}
            onClick={() => setFilter('expense')}
          >
            Расходы
          </Button>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => navigate('/transactions/add')}
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Добавить операцию
        </Button>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">Нет транзакций</p>
            <Button onClick={() => navigate('/transactions/add')}>
              Добавить первую
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/transactions/add')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};
