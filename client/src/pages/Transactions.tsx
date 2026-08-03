import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, Search, X } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { useAuthStore } from '../store/authStore';
import { useExchangeRatesStore } from '../store/exchangeRatesStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { convertAmount } from '../utils/currency';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, fetchTransactions } = useTransactionsStore();
  const { user } = useAuthStore();
  const { rates, fetchRates } = useExchangeRatesStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const primaryCurrency = user?.primaryCurrency || '₸';

  // Поиск и расширенные фильтры
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced-версия searchInput
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const activeAdvancedFiltersCount = [categoryId, amountMin, amountMax, dateFrom, dateTo].filter(
    Boolean
  ).length;

  // Debounce для поля поиска — не долбим бэкенд на каждое нажатие клавиши
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchTransactions({
      type: filter !== 'all' ? filter : undefined,
      search: search || undefined,
      categoryId: categoryId || undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [filter, search, categoryId, amountMin, amountMax, dateFrom, dateTo, fetchTransactions]);

  useEffect(() => {
    fetchRates();
    fetchCategories();
  }, [fetchRates, fetchCategories]);

  const resetAdvancedFilters = () => {
    setCategoryId('');
    setAmountMin('');
    setAmountMax('');
    setDateFrom('');
    setDateTo('');
  };

  // Бэкенд уже применил все фильтры (включая type для income/expense не всегда,
  // поэтому дублируем фильтр по типу и на клиенте — для мгновенного переключения вкладок)
  const filteredTransactions =
    filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

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
            <button
              onClick={() => setIsFilterPanelOpen((v) => !v)}
              className="relative text-gray-600 hover:text-gray-900"
            >
              <Filter size={24} />
              {activeAdvancedFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeAdvancedFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию, категории, магазину..."
            className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Advanced Filter Panel */}
        {isFilterPanelOpen && (
          <Card className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Все категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сумма</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="от"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  placeholder="до"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Период</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {activeAdvancedFiltersCount > 0 && (
              <button
                onClick={resetAdvancedFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Сбросить фильтры
              </button>
            )}
          </Card>
        )}

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
