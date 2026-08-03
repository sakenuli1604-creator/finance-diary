import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Repeat } from 'lucide-react';
import { useTransactionsStore } from '../store/transactionsStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTransaction, fetchTransaction, deleteTransaction, addRating } =
    useTransactionsStore();

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTransaction(id);
    }
  }, [id, fetchTransaction]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту транзакцию?')) return;

    try {
      setIsDeleting(true);
      await deleteTransaction(id!);
      navigate('/transactions');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setIsDeleting(false);
    }
  };

  const handleRate = async (rating: number) => {
    try {
      await addRating(id!, rating);
    } catch (error) {
      console.error('Failed to rate:', error);
    }
  };

  const handleRepeat = () => {
    if (!selectedTransaction) return;
    navigate('/transactions/add', {
      state: {
        repeat: {
          type: selectedTransaction.type,
          accountId: selectedTransaction.accountId,
          categoryId: selectedTransaction.categoryId,
          amount: Number(selectedTransaction.amount),
          title: selectedTransaction.title || '',
          description: selectedTransaction.description || '',
          shop: selectedTransaction.shop || '',
        },
      },
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedTransaction) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/transactions')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Детали</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Main Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                backgroundColor: selectedTransaction.category?.color || '#E5E7EB',
              }}
            >
              {selectedTransaction.category?.icon || '📌'}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">
                <Edit2 size={18} />
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2">
            {selectedTransaction.title || selectedTransaction.category?.name}
          </h2>

          <p
            className={`text-4xl font-bold mb-4 ${
              selectedTransaction.type === 'income'
                ? 'text-income'
                : 'text-expense'
            }`}
          >
            {selectedTransaction.type === 'income' ? '+' : '-'}
            {formatAmount(Number(selectedTransaction.amount))}{' '}
            {selectedTransaction.currency}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Категория:</span>
              <span className="font-medium">
                {selectedTransaction.category?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Счет:</span>
              <span className="font-medium">
                {selectedTransaction.account?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Дата:</span>
              <span className="font-medium">
                {formatDate(selectedTransaction.transactionDate)}
              </span>
            </div>
            {selectedTransaction.shop && (
              <div className="flex justify-between">
                <span className="text-secondary">Магазин:</span>
                <span className="font-medium">{selectedTransaction.shop}</span>
              </div>
            )}
          </div>

          {selectedTransaction.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-secondary">Описание:</p>
              <p className="mt-1">{selectedTransaction.description}</p>
            </div>
          )}
        </Card>

        {/* Repeat */}
        <Button
          onClick={handleRepeat}
          variant="secondary"
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Repeat size={18} />
          Повторить операцию
        </Button>

        {/* Rating (for expenses) */}
        {selectedTransaction.type === 'expense' && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Оцените покупку</h3>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className={`text-3xl transition-all ${
                    selectedTransaction.rating &&
                    rating <= selectedTransaction.rating
                      ? 'text-yellow-400 scale-110'
                      : 'text-secondary hover:text-yellow-400'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {selectedTransaction.rating && (
              <p className="text-center text-sm text-secondary mt-2">
                Оценка: {selectedTransaction.rating}/5
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
