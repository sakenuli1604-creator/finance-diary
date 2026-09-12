import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Button } from '../components/ui/Button';

export const EditTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedTransaction, fetchTransaction, updateTransaction, isLoading } =
    useTransactionsStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) fetchTransaction(id);
  }, [id, fetchTransaction]);

  useEffect(() => {
    if (selectedTransaction) {
      setType(selectedTransaction.type);
    }
  }, [selectedTransaction]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    try {
      setIsSaving(true);
      await updateTransaction(id, data);
      navigate(`/transactions/${id}`);
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !selectedTransaction) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-secondary">Загрузка...</p>
      </div>
    );
  }

  if (!selectedTransaction) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app pb-20">
      <div className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-secondary hover:text-primary">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Редактировать операцию</h1>
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

        <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
          <TransactionForm
            type={type}
            onSubmit={handleSubmit}
            isLoading={isSaving}
            initialData={{
              accountId: selectedTransaction.accountId,
              categoryId: selectedTransaction.categoryId,
              amount: Number(selectedTransaction.amount),
              title: selectedTransaction.title || '',
              description: selectedTransaction.description || '',
              shop: selectedTransaction.shop || '',
              tagIds: selectedTransaction.tags?.map((t) => t.tag.id) || [],
            }}
          />
        </div>
      </div>
    </div>
  );
};
