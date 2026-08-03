import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Button } from '../components/ui/Button';
import { CreateTransactionData } from '../api/transactions';

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createTransaction } = useTransactionsStore();
  const repeatTemplate = (location.state as { repeat?: Partial<CreateTransactionData> } | null)
    ?.repeat;
  const [type, setType] = useState<'income' | 'expense'>(repeatTemplate?.type || 'expense');
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

        {/* Form */}
        <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
          <TransactionForm
            type={type}
            onSubmit={handleSubmit}
            isLoading={isCreating}
            initialData={repeatTemplate}
          />
        </div>
      </div>
    </div>
  );
};
