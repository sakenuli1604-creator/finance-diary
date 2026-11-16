import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Filter,
  Search,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileUp,
  CheckSquare,
} from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { useAuthStore } from '../store/authStore';
import { useExchangeRatesStore } from '../store/exchangeRatesStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { TransactionItem } from '../components/transactions/TransactionItem';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Amount } from '../components/ui/Amount';
import { convertAmount } from '../utils/currency';
import { transactionsAPI, TransactionFilters, TransactionTotalsRow } from '../api/transactions';
import {
  useTransactionFiltersStore,
  resolveDateRange,
  localDayStartISO,
  localDayEndISO,
  DatePreset,
} from '../store/transactionFiltersStore';

// Позиция прокрутки списка: после правки операции возвращаемся туда же, где были
let savedScrollY = 0;

// Сколько операций подгружаем за раз; остальные — по кнопке «Показать ещё»
const PAGE_SIZE = 100;

const PRESET_LABELS: Record<string, string> = { today: 'Сегодня', week: 'Неделя', month: 'Месяц' };

const localDayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dayLabel = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((startOfToday.getTime() - date.getTime()) / 86400000);
  const base = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' as const } : {}),
  });
  if (diffDays === 0) return `Сегодня, ${base}`;
  if (diffDays === 1) return `Вчера, ${base}`;
  return `${date.toLocaleDateString('ru-RU', { weekday: 'short' })}, ${base}`;
};

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, fetchTransactions, hasMore, isLoadingMore, loadMoreTransactions } =
    useTransactionsStore();
  const [totals, setTotals] = useState<TransactionTotalsRow[] | null>(null);
  const { user } = useAuthStore();
  const { rates, fetchRates } = useExchangeRatesStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const f = useTransactionFiltersStore();
  const { type: filter, sortBy, sortDir, categoryId, amountMin, amountMax, datePreset, dateFrom, dateTo } = f;
  const primaryCurrency = user?.primaryCurrency || '₸';

  // Поиск: локальное поле + debounce в сохранённые фильтры
  const [searchInput, setSearchInput] = useState(f.search);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Режим выбора для массовых действий
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);

  const activeAdvancedFiltersCount = [categoryId, amountMin, amountMax, datePreset].filter(
    Boolean
  ).length;

  useEffect(() => {
    const timeout = setTimeout(() => f.set({ search: searchInput.trim() }), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Фильтры запроса (без страницы) — общие для списка, «Показать ещё» и итогов
  const queryFilters = useMemo<TransactionFilters>(() => {
    const range = resolveDateRange(datePreset, dateFrom, dateTo);
    return {
      type: filter !== 'all' ? filter : undefined,
      search: f.search || undefined,
      categoryId: categoryId || undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      dateFrom: localDayStartISO(range.from),
      dateTo: localDayEndISO(range.to),
      sortBy,
      sortDir,
    };
  }, [filter, f.search, categoryId, amountMin, amountMax, datePreset, dateFrom, dateTo, sortBy, sortDir]);

  const loadTransactions = useCallback(() => {
    transactionsAPI
      .getTotals(queryFilters)
      .then(setTotals)
      .catch((err) => console.error('Failed to load totals:', err));
    return fetchTransactions({ ...queryFilters, limit: PAGE_SIZE });
  }, [queryFilters, fetchTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Вернуть прокрутку на то место, где остановились до перехода к правке операции
  const scrollRestored = useRef(false);
  useEffect(() => {
    if (!scrollRestored.current && !isLoading && transactions.length > 0) {
      scrollRestored.current = true;
      requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
    }
  }, [isLoading, transactions.length]);
  useEffect(() => {
    return () => {
      savedScrollY = window.scrollY;
    };
  }, []);

  useEffect(() => {
    fetchRates();
    fetchCategories();
  }, [fetchRates, fetchCategories]);

  const resetAdvancedFilters = () => f.resetAdvanced();

  const applyQuickDateRange = (preset: DatePreset) =>
    f.set({ datePreset: datePreset === preset ? '' : preset });

  const resetEverything = () => {
    setSearchInput('');
    f.resetAll();
  };

  // Бэкенд уже применил все фильтры (включая type для income/expense не всегда,
  // поэтому дублируем фильтр по типу и на клиенте — для мгновенного переключения вкладок)
  // Сортировку и все фильтры уже применил сервер (иначе страницы не стыковались бы);
  // тип дублируем на клиенте — для мгновенного переключения вкладок
  const filteredTransactions =
    filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  // Итоги — по ВСЕМ операциям под фильтром, а не только по загруженной странице
  const sumTotals = (type: 'income' | 'expense') =>
    totals
      ? totals
          .filter((row) => row.type === type)
          .reduce((sum, row) => sum + convertAmount(row.sum, row.currency, primaryCurrency, rates), 0)
      : transactions
          .filter((t) => t.type === type)
          .reduce(
            (sum, t) => sum + convertAmount(Number(t.amount), t.currency, primaryCurrency, rates),
            0
          );
  const totalIncome = sumTotals('income');
  const totalExpense = sumTotals('expense');
  const totalCount = totals ? totals.reduce((n, row) => n + row.count, 0) : transactions.length;

  // ---------- Группировка по дням (только при сортировке по дате) ----------
  const groups = useMemo(() => {
    if (sortBy !== 'date') return null;
    const map = new Map<string, typeof filteredTransactions>();
    filteredTransactions.forEach((t) => {
      const key = localDayKey(t.transactionDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries());
  }, [filteredTransactions, sortBy]);

  const dayTotals = (list: typeof filteredTransactions) => {
    let income = 0;
    let expense = 0;
    list.forEach((t) => {
      const v = convertAmount(Number(t.amount), t.currency, primaryCurrency, rates);
      if (t.type === 'income') income += v;
      else expense += v;
    });
    return { income, expense };
  };

  // ---------- Выбор и массовые действия ----------
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startSelectWith = (id: string) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const selectedTxs = filteredTransactions.filter((t) => selectedIds.has(t.id));
  const selectedTypes = new Set(selectedTxs.map((t) => t.type));
  const singleSelectedType = selectedTypes.size === 1 ? Array.from(selectedTypes)[0] : null;

  const bulkChangeCategory = async (newCategoryId: string) => {
    if (!newCategoryId || selectedTxs.length === 0) return;
    try {
      setIsBulkWorking(true);
      for (const t of selectedTxs) {
        await transactionsAPI.update(t.id, { categoryId: newCategoryId });
      }
      await loadTransactions();
      exitSelectMode();
    } catch (err) {
      console.error('Bulk category change failed:', err);
      alert('Не удалось изменить категорию у части операций. Обновите список и попробуйте ещё раз.');
      await loadTransactions();
    } finally {
      setIsBulkWorking(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedTxs.length === 0) return;
    if (!confirm(`Удалить операций: ${selectedTxs.length}? Их можно будет восстановить из корзины.`)) return;
    try {
      setIsBulkWorking(true);
      for (const t of selectedTxs) {
        await transactionsAPI.delete(t.id);
      }
      await loadTransactions();
      exitSelectMode();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Не удалось удалить часть операций. Обновите список и попробуйте ещё раз.');
      await loadTransactions();
    } finally {
      setIsBulkWorking(false);
    }
  };

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
                onClick={() => navigate('/transactions/import')}
                className="text-secondary hover:text-primary"
                title="Импорт из выписки"
              >
                <FileUp size={22} />
              </button>
              <button
                onClick={() => {
                  setSelectMode((v) => !v);
                  setSelectedIds(new Set());
                }}
                className={selectMode ? 'text-blue-600' : 'text-secondary hover:text-primary'}
                title="Выбрать несколько"
              >
                <CheckSquare size={22} />
              </button>
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
                onChange={(e) => f.set({ categoryId: e.target.value })}
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
                  onChange={(e) => f.set({ amountMin: e.target.value })}
                  className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-secondary">—</span>
                <input
                  type="number"
                  placeholder="до"
                  value={amountMax}
                  onChange={(e) => f.set({ amountMax: e.target.value })}
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-secondary hover:text-primary'
                    }`}
                  >
                    {preset === 'today' ? 'Сегодня' : preset === 'week' ? 'Неделя' : 'Месяц'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={datePreset === 'custom' ? dateFrom : resolveDateRange(datePreset, '', '').from || ''}
                  onChange={(e) => f.set({ dateFrom: e.target.value, datePreset: 'custom' })}
                  className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-secondary">—</span>
                <input
                  type="date"
                  value={datePreset === 'custom' ? dateTo : resolveDateRange(datePreset, '', '').to || ''}
                  onChange={(e) => f.set({ dateTo: e.target.value, datePreset: 'custom' })}
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

        {/* Активные фильтры — видны всегда, раз они теперь сохраняются между заходами */}
        {(activeAdvancedFiltersCount > 0 || filter !== 'all' || f.search) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-secondary">Фильтры:</span>
            {f.search && (
              <button
                onClick={() => setSearchInput('')}
                className="px-2.5 py-1 rounded-full bg-muted text-primary flex items-center gap-1"
              >
                «{f.search}» <X size={12} />
              </button>
            )}
            {filter !== 'all' && (
              <button
                onClick={() => f.set({ type: 'all' })}
                className="px-2.5 py-1 rounded-full bg-muted text-primary flex items-center gap-1"
              >
                {filter === 'income' ? 'Доходы' : 'Расходы'} <X size={12} />
              </button>
            )}
            {categoryId && (
              <button
                onClick={() => f.set({ categoryId: '' })}
                className="px-2.5 py-1 rounded-full bg-muted text-primary flex items-center gap-1"
              >
                {categories.find((c) => c.id === categoryId)?.name || 'Категория'} <X size={12} />
              </button>
            )}
            {datePreset && (
              <button
                onClick={() => f.set({ datePreset: '', dateFrom: '', dateTo: '' })}
                className="px-2.5 py-1 rounded-full bg-muted text-primary flex items-center gap-1"
              >
                {datePreset === 'custom'
                  ? `${dateFrom || '…'} — ${dateTo || '…'}`
                  : PRESET_LABELS[datePreset]}{' '}
                <X size={12} />
              </button>
            )}
            {(amountMin || amountMax) && (
              <button
                onClick={() => f.set({ amountMin: '', amountMax: '' })}
                className="px-2.5 py-1 rounded-full bg-muted text-primary flex items-center gap-1"
              >
                {amountMin || '0'}–{amountMax || '∞'} <X size={12} />
              </button>
            )}
            <button onClick={resetEverything} className="text-blue-600 hover:text-blue-700">
              Сбросить всё
            </button>
          </div>
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
            onClick={() => f.set({ type: 'all' })}
          >
            Все
          </Button>
          <Button
            variant={filter === 'income' ? 'primary' : 'secondary'}
            onClick={() => f.set({ type: 'income' })}
          >
            Доходы
          </Button>
          <Button
            variant={filter === 'expense' ? 'primary' : 'secondary'}
            onClick={() => f.set({ type: 'expense' })}
          >
            Расходы
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => f.set({ sortBy: e.target.value as typeof sortBy })}
              className="text-sm px-2 py-2 border border-line rounded-lg bg-surface text-primary outline-none"
            >
              <option value="date">По дате</option>
              <option value="amount">По сумме</option>
              <option value="category">По категории</option>
            </select>
            <button
              onClick={() => f.set({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' })}
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
        {isLoading && transactions.length === 0 ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-secondary mb-4">Нет транзакций</p>
            {activeAdvancedFiltersCount > 0 || filter !== 'all' || f.search ? (
              <Button variant="secondary" onClick={resetEverything}>
                Сбросить фильтры
              </Button>
            ) : (
              <Button onClick={() => navigate('/transactions/add')}>Добавить первую</Button>
            )}
          </Card>
        ) : groups ? (
          <div className={`space-y-4 ${isLoading ? 'opacity-60' : ''}`}>
            {groups.map(([key, list]) => {
              const totals = dayTotals(list);
              return (
                <div key={key} className="space-y-2">
                  <div className="sticky top-0 z-10 -mx-4 px-4 py-1.5 bg-app/95 backdrop-blur flex items-baseline justify-between">
                    <h2 className="text-sm font-semibold text-secondary capitalize">{dayLabel(key)}</h2>
                    <span className="text-xs text-secondary">
                      {totals.expense > 0 && (
                        <span className="text-expense">
                          <Amount>-{formatAmount(totals.expense)}</Amount>
                        </span>
                      )}
                      {totals.expense > 0 && totals.income > 0 && ' · '}
                      {totals.income > 0 && (
                        <span className="text-income">
                          <Amount>+{formatAmount(totals.income)}</Amount>
                        </span>
                      )}
                    </span>
                  </div>
                  {list.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      showDate={false}
                      selectMode={selectMode}
                      selected={selectedIds.has(transaction.id)}
                      onLongPress={() => startSelectWith(transaction.id)}
                      onClick={() =>
                        selectMode
                          ? toggleSelected(transaction.id)
                          : navigate(`/transactions/${transaction.id}`)
                      }
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`space-y-2 ${isLoading ? 'opacity-60' : ''}`}>
            {filteredTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                selectMode={selectMode}
                selected={selectedIds.has(transaction.id)}
                onLongPress={() => startSelectWith(transaction.id)}
                onClick={() =>
                  selectMode
                    ? toggleSelected(transaction.id)
                    : navigate(`/transactions/${transaction.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Подгрузка следующих операций */}
      {!selectMode && filteredTransactions.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pb-24 text-center space-y-2">
          <p className="text-xs text-secondary">
            Показано {filteredTransactions.length} из {totalCount}
          </p>
          {hasMore && (
            <Button
              variant="secondary"
              isLoading={isLoadingMore}
              onClick={() => loadMoreTransactions({ ...queryFilters, limit: PAGE_SIZE })}
            >
              Показать ещё
            </Button>
          )}
        </div>
      )}

      {/* Панель массовых действий */}
      {selectMode && (
        <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-3">
          <div className="max-w-2xl mx-auto bg-surface border border-line rounded-xl shadow-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary font-medium">Выбрано: {selectedIds.size}</span>
              <div className="flex gap-3">
                <button
                  className="text-blue-600"
                  onClick={() => setSelectedIds(new Set(filteredTransactions.map((t) => t.id)))}
                >
                  Выбрать все
                </button>
                <button className="text-secondary" onClick={exitSelectMode}>
                  Отмена
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                disabled={!singleSelectedType || isBulkWorking}
                value=""
                onChange={(e) => bulkChangeCategory(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 text-sm border border-line rounded-lg bg-surface text-primary outline-none disabled:opacity-50"
              >
                <option value="">
                  {singleSelectedType || selectedIds.size === 0
                    ? 'Сменить категорию…'
                    : 'Выберите операции одного типа'}
                </option>
                {singleSelectedType &&
                  categories
                    .filter((c) => c.type === singleSelectedType)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
              </select>
              <Button
                variant="danger"
                disabled={selectedIds.size === 0}
                isLoading={isBulkWorking}
                onClick={bulkDelete}
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {!selectMode && (
      <button
        onClick={() => navigate('/transactions/add')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
      >
        <Plus size={28} />
      </button>
      )}
    </div>
  );
};
