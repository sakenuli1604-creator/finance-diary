import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, Search, X, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { useAuthStore } from '../store/authStore';
import { useExchangeRatesStore } from '../store/exchangeRatesStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Amount } from '../components/ui/Amount';
import { convertAmount } from '../utils/currency';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, fetchTransactions } = useTransactionsStore();
  const { user } = useAuthStore();
  const { rates, fetchRates } = useExchangeRatesStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
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

  const applyQuickDateRange = (preset: 'today' | 'week' | 'month') => {
    const now = new Date();
    const toStr = (d: Date) => d.toISOString().split('T')[0];

    let from: Date;
    if (preset === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'week') {
      from = new Date(now);
      from.setDate(now.getDate() - now.getDay() + 1); // с понедельника
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateFrom(toStr(from));
    setDateTo(toStr(now));
  };

  // Бэкенд уже применил все фильтры (включая type для income/expense не всегда,
  // поэтому дублируем фильтр по типу и на клиенте — для мгновенного переключения вкладок)
  const filteredTransactions = (
    filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)
  )
    .slice()
    .sort((a, b) => {
      let result = 0;
      if (sortBy === 'amount') {
        result = Number(a.amount) - Number(b.amount);
      } else if (sortBy === 'category') {
        result = (a.category?.name || '').localeCompare(b.category?.name || '');
      } else {
        result = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
      }
      return sortDir === 'asc' ? result : -result;
    });

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
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-secondary hover:text-primary"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-primary">Транзакции</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/trash')}
                className="text-secondary hover:text-primary"
                title="Корзина"
              >
                <Trash2 size={22} />
              </button>
              <button
                onClick={() => setIsFilterPanelOpen((v) => !v)}
                className="relative text-secondary hover:text-primary"
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
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию, категории, магазину..."
            className="w-full pl-10 pr-9 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-surface"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Advanced Filter Panel */}
        {isFilterPanelOpen && (
          <Card className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Категория</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              <label className="block text-sm font-medium text-secondary mb-2">Сумма</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="от"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-secondary">—</span>
                <input
                  type="number"
                  placeholder="до"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Период</label>

              <div className="flex flex-wrap gap-2 mb-2">
                {(['today', 'week', 'month'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyQuickDateRange(preset)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-secondary hover:text-primary transition-colors"
                  >
                    {preset === 'today' ? 'Сегодня' : preset === 'week' ? 'Неделя' : 'Месяц'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-secondary">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            <p className="text-sm text-secondary mb-1">Доходы</p>
            <p className="text-xl font-bold text-income">
              <Amount>
                +{formatAmount(totalIncome)} {primaryCurrency}
              </Amount>
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-secondary mb-1">Расходы</p>
            <p className="text-xl font-bold text-expense">
              <Amount>
                -{formatAmount(totalExpense)} {primaryCurrency}
              </Amount>
            </p>
          </Card>
        </div>

        {/* Filter Tabs + Sort */}
        <div className="flex gap-2 items-center">
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

          <div className="ml-auto flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm px-2 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
            >
              <option value="date">По дате</option>
              <option value="amount">По сумме</option>
              <option value="category">По категории</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="p-2 border border-line rounded-lg text-secondary hover:text-primary shrink-0"
              title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}
            >
              {sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>
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
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-secondary mb-4">Нет транзакций</p>
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
