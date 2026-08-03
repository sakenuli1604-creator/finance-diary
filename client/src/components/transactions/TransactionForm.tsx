import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CategorySelector } from './CategorySelector';
import { useAccountsStore } from '../../store/accountsStore';
import { CreateTransactionData } from '../../api/transactions';

interface TransactionFormProps {
  type: 'income' | 'expense';
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CreateTransactionData>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  type,
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const { accounts, fetchAccounts } = useAccountsStore();

  const [formData, setFormData] = useState<CreateTransactionData>({
    accountId: initialData?.accountId || '',
    categoryId: initialData?.categoryId || '',
    type,
    amount: initialData?.amount || 0,
    title: initialData?.title || '',
    description: initialData?.description || '',
    shop: initialData?.shop || '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const isFirstTypeSync = useRef(true);
  useEffect(() => {
    if (isFirstTypeSync.current) {
      isFirstTypeSync.current = false;
      setFormData((prev) => ({ ...prev, type }));
      return;
    }
    setFormData((prev) => ({ ...prev, type, categoryId: '' }));
  }, [type]);

  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts]);

  const selectedCurrency =
    accounts.find((a) => a.id === formData.accountId)?.currency || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account — выбираем счёт первым, чтобы сразу было понятно, в какой валюте вводится сумма */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Счет
        </label>
        <select
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.icon} {account.name} ({account.balance} {account.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Amount - BIG */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Сумма
        </label>
        <div className="flex items-center justify-center gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="0"
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
            }
            className="w-full text-4xl font-bold text-center py-4 border-b-2 border-line focus:border-blue-500 outline-none"
            required
            autoFocus
          />
          <span className="text-3xl font-bold text-secondary shrink-0">
            {selectedCurrency}
          </span>
        </div>
      </div>

      {/* Category */}
      <CategorySelector
        type={type}
        selectedCategoryId={formData.categoryId}
        onSelect={(categoryId) => setFormData({ ...formData, categoryId })}
      />

      {/* Optional fields */}
      <details className="border rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-secondary">
          Дополнительно (опционально)
        </summary>
        <div className="mt-4 space-y-3">
          <Input
            label="Название"
            placeholder="Например: Продукты"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <Input
            label="Магазин"
            placeholder="Например: Magnum"
            value={formData.shop}
            onChange={(e) => setFormData({ ...formData, shop: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Дополнительные детали..."
            />
          </div>

          <Input
            type="date"
            label="Дата"
            value={formData.transactionDate}
            onChange={(e) =>
              setFormData({ ...formData, transactionDate: e.target.value })
            }
          />
        </div>
      </details>

      <Button type="submit" fullWidth isLoading={isLoading}>
        {type === 'income' ? 'Добавить доход' : 'Добавить расход'}
      </Button>
    </form>
  );
};
