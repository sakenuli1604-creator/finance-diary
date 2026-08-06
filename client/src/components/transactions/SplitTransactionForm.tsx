import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAccountsStore } from '../../store/accountsStore';
import { useCategoriesStore } from '../../store/categoriesStore';
import { Button } from '../ui/Button';
import { CreateSplitTransactionData, SplitPart } from '../../api/transactions';

interface SplitTransactionFormProps {
  type: 'income' | 'expense';
  onSubmit: (data: CreateSplitTransactionData) => Promise<void>;
  isLoading?: boolean;
}

interface Row {
  categoryId: string;
  amount: string;
}

export const SplitTransactionForm: React.FC<SplitTransactionFormProps> = ({
  type,
  onSubmit,
  isLoading = false,
}) => {
  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [accountId, setAccountId] = useState('');
  const [title, setTitle] = useState('');
  const [shop, setShop] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { categoryId: '', amount: '' },
    { categoryId: '', amount: '' },
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchCategories(type);
  }, [type, fetchCategories]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const selectedCurrency = accounts.find((a) => a.id === accountId)?.currency || '';
  const filteredCategories = categories.filter((c) => c.type === type);

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { categoryId: '', amount: '' }]);

  const removeRow = (index: number) => {
    if (rows.length <= 2) return; // минимум 2 части, иначе это не разбивка
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!accountId) {
      setError('Выберите счёт');
      return;
    }

    const parts: SplitPart[] = rows
      .filter((r) => r.categoryId && parseFloat(r.amount) > 0)
      .map((r) => ({ categoryId: r.categoryId, amount: parseFloat(r.amount) }));

    if (parts.length < 2) {
      setError('Заполните минимум 2 категории с суммами');
      return;
    }

    try {
      await onSubmit({
        accountId,
        type,
        parts,
        title: title.trim() || undefined,
        shop: shop.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось сохранить операцию');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Счёт</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary"
          required
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name} ({a.balance} {a.currency})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Название (необязательно)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Чек из супермаркета"
          className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Части операции</label>
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={row.categoryId}
                onChange={(e) => updateRow(index, { categoryId: e.target.value })}
                className="flex-1 px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary"
              >
                <option value="">Категория...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={row.amount}
                onChange={(e) => updateRow(index, { amount: e.target.value })}
                className="w-28 px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary text-right"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 2}
                className="text-secondary hover:text-expense disabled:opacity-30 shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={16} />
          Добавить категорию
        </button>
      </div>

      <div className="flex items-center justify-between px-1 py-2 border-t border-line">
        <span className="text-sm text-secondary">Итого</span>
        <span className="text-lg font-bold text-primary">
          {total.toLocaleString('ru-RU')} {selectedCurrency}
        </span>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" fullWidth isLoading={isLoading}>
        Сохранить разбитую операцию
      </Button>
    </form>
  );
};
