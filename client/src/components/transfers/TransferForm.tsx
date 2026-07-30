import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Account } from '../../types';
import { Button } from '../ui/Button';
import { CreateTransferData } from '../../api/transfers';
import { convertAmount } from '../../utils/currency';

interface TransferFormProps {
  accounts: Account[];
  rates: Record<string, number> | null;
  onSubmit: (data: CreateTransferData) => Promise<void>;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  accounts,
  rates,
  onSubmit,
  onCancel,
}) => {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(
    accounts.find((a) => a.id !== accounts[0]?.id)?.id || ''
  );
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const showsConversionHint =
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency && amount;

  const convertedPreview = showsConversionHint
    ? convertAmount(Number(amount), fromAccount!.currency, toAccount!.currency, rates)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromAccountId || !toAccountId) {
      setError('Выберите оба счёта');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Счета отправителя и получателя должны отличаться');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Укажите сумму перевода');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        fromAccountId,
        toAccountId,
        amount: Number(amount),
        description: description.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось выполнить перевод');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Откуда</label>
        <select
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.icon} {account.name} ({account.balance} {account.currency})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center">
        <ArrowRight className="text-gray-400" size={20} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Куда</label>
        <select
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.icon} {account.name} ({account.balance} {account.currency})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Сумма</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
            className="w-full text-3xl font-bold text-center py-3 border-b-2 border-gray-300 focus:border-blue-500 outline-none"
            required
            autoFocus
          />
          <span className="text-2xl font-bold text-gray-400 shrink-0">
            {fromAccount?.currency}
          </span>
        </div>
        {showsConversionHint && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Зачислится ≈ {convertedPreview!.toFixed(2)} {toAccount!.currency} по текущему курсу
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Комментарий (необязательно)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например: на путешествие"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
          Отмена
        </Button>
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          Перевести
        </Button>
      </div>
    </form>
  );
};
