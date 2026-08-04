import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { transactionsAPI } from '../api/transactions';
import { Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Trash: React.FC = () => {
  const navigate = useNavigate();
  const [deleted, setDeleted] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmptying, setIsEmptying] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await transactionsAPI.getDeleted();
      setDeleted(data);
    } catch (error) {
      console.error('Failed to load trash:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      setBusyId(id);
      await transactionsAPI.restore(id);
      setDeleted((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to restore:', error);
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Удалить навсегда? Это действие нельзя отменить.')) return;
    try {
      setBusyId(id);
      await transactionsAPI.permanentDelete(id);
      setDeleted((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to permanently delete:', error);
    } finally {
      setBusyId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (
      !confirm(
        'Очистить корзину? Все операции, которые сейчас в корзине, будут удалены навсегда.'
      )
    )
      return;
    try {
      setIsEmptying(true);
      const result = await transactionsAPI.emptyTrash(0); // 0 дней = удалить всё, что сейчас в корзине
      await load();
      alert(`Удалено безвозвратно: ${result.count}`);
    } catch (error) {
      console.error('Failed to empty trash:', error);
    } finally {
      setIsEmptying(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount);

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/transactions')}
                className="text-secondary hover:text-primary"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-primary">Корзина</h1>
            </div>
            {deleted.length > 0 && (
              <Button variant="danger" onClick={handleEmptyTrash} isLoading={isEmptying}>
                Очистить
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {deleted.length > 0 && (
          <Card className="p-4 flex gap-3 bg-expense/10 border-expense/30">
            <AlertTriangle className="text-expense shrink-0" size={20} />
            <p className="text-sm text-secondary">
              Операции в корзине автоматически удаляются навсегда через 30 дней. Баланс
              счёта уже пересчитан без них.
            </p>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : deleted.length === 0 ? (
          <Card className="p-8 text-center">
            <Trash2 className="mx-auto mb-4 text-secondary" size={40} />
            <p className="text-secondary">Корзина пуста</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {deleted.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-muted shrink-0 opacity-60">
                      {t.category?.icon || '📌'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-primary truncate">
                        {t.title || t.category?.name || 'Операция'}
                      </p>
                      <p className="text-xs text-secondary">Удалено: {formatDate(t.deletedAt)}</p>
                    </div>
                  </div>
                  <p
                    className={`font-bold shrink-0 ${
                      t.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatAmount(Number(t.amount))} {t.currency}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    isLoading={busyId === t.id}
                    onClick={() => handleRestore(t.id)}
                    className="flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Восстановить
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    isLoading={busyId === t.id}
                    onClick={() => handlePermanentDelete(t.id)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Удалить навсегда
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
