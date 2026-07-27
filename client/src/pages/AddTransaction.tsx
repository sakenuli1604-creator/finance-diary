import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Button } from '../components/ui/Button';

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { createTransaction } = useTransactionsStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Новая операция
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <TransactionForm
            type={type}
            onSubmit={handleSubmit}
            isLoading={isCreating}
          />
        </div>
      </div>
    </div>
  );
};
