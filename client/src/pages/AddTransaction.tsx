import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { SplitTransactionForm } from '../components/transactions/SplitTransactionForm';
import { Button } from '../components/ui/Button';
import { CreateTransactionData, CreateSplitTransactionData } from '../api/transactions';

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { createTransaction, createSplitTransaction } = useTransactionsStore();
  const repeatTemplate = (location.state as { repeat?: Partial<CreateTransactionData> } | null)
    ?.repeat;
  const typeFromQuery = searchParams.get('type');
  const initialType: 'income' | 'expense' =
    repeatTemplate?.type || (typeFromQuery === 'income' ? 'income' : 'expense');
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsCreating(true);
      await createTransaction(data);
      navigate('/transactions');
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSplitSubmit = async (data: CreateSplitTransactionData) => {
    setIsCreating(true);
    try {
      await createSplitTransaction(data);
      navigate('/transactions');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">
              Новая операция
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {repeatTemplate && (
          <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-4 py-2">
            Повтор операции — проверьте сумму и счёт перед сохранением
          </p>
        )}

        {/* Type Selector */}
        <div className="flex gap-2">
          <Button
            variant={type === 'expense' ? 'primary' : 'secondary'}
            onClick={() => setType('expense')}
            fullWidth
          >
            Расход
          </Button>
          <Button
            variant={type === 'income' ? 'primary' : 'secondary'}
            onClick={() => setType('income')}
            fullWidth
          >
            Доход
          </Button>
        </div>

        {/* Split mode toggle — недоступен при повторе операции */}
        {!repeatTemplate && (
          <button
            type="button"
            onClick={() => setIsSplitMode((v) => !v)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isSplitMode ? '← Обычная операция' : 'Разбить на несколько категорий →'}
          </button>
        )}

        {/* Form */}
        <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
          {isSplitMode ? (
            <SplitTransactionForm type={type} onSubmit={handleSplitSubmit} isLoading={isCreating} />
          ) : (
            <TransactionForm
              type={type}
              onSubmit={handleSubmit}
              isLoading={isCreating}
              initialData={repeatTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
};
