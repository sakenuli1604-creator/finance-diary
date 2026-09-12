import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react';
import { useBudgetsStore } from '../store/budgetsStore';
import { useCategoriesStore } from '../store/categoriesStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const PERIOD_LABELS: Record<string, string> = {
  daily: 'День',
  weekly: 'Неделя',
  monthly: 'Месяц',
  yearly: 'Год',
};

export const Budgets: React.FC = () => {
  const navigate = useNavigate();
  const { budgets, isLoading, fetchBudgets, createBudget, deleteBudget } = useBudgetsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    categoryId: '',
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories('expense');
  }, [fetchBudgets, fetchCategories]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await createBudget({
        name: formData.name,
        amount: formData.amount,
        period: formData.period,
        categoryId: formData.categoryId || undefined,
      });
      setIsModalOpen(false);
      setFormData({ name: '', amount: 0, period: 'monthly', categoryId: '' });
    } catch (error) {
      console.error('Failed to create budget:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить бюджет?')) return;
    await deleteBudget(id);
  };

  const progressColor = (percentage = 0, isOver = false) => {
    if (isOver) return 'bg-expense';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-income';
  };

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-secondary hover:text-primary">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Бюджеты</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Button
          onClick={() => setIsModalOpen(true)}
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Создать бюджет
        </Button>

        {isLoading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : budgets.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="mx-auto mb-4 text-secondary" size={44} />
            <p className="text-secondary mb-4">У вас пока нет бюджетов</p>
            <Button onClick={() => setIsModalOpen(true)}>Создать первый бюджет</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-primary">{b.name}</h3>
                    <p className="text-sm text-secondary">
                      {b.category?.name || 'Общий'} • {PERIOD_LABELS[b.period]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary">
                      {formatAmount(b.spent || 0)} / {formatAmount(b.amount)} {b.currency}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        b.isOverBudget
                          ? 'text-expense'
                          : (b.percentage || 0) >= 80
                          ? 'text-orange-500'
                          : 'text-income'
                      }`}
                    >
                      {Math.round(b.percentage || 0)}%
                    </p>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${progressColor(
                      b.percentage,
                      b.isOverBudget
                    )}`}
                    style={{ width: `${Math.min(b.percentage || 0, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">
                    Осталось: {formatAmount(b.remaining || 0)} {b.currency}
                  </span>
                  <button onClick={() => handleDelete(b.id)} className="text-expense hover:opacity-80">
                    Удалить
                  </button>
                </div>

                {b.isOverBudget && (
                  <div className="mt-3 p-2 bg-expense/10 rounded-lg">
                    <p className="text-xs text-expense font-medium">
                      ⚠️ Бюджет превышен на {formatAmount((b.spent || 0) - b.amount)} {b.currency}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новый бюджет">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Название"
            placeholder="Например: Продукты"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Сумма"
            type="number"
            step="0.01"
            placeholder="0"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Период</label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
              className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary"
            >
              <option value="daily">День</option>
              <option value="weekly">Неделя</option>
              <option value="monthly">Месяц</option>
              <option value="yearly">Год</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Категория (опционально)
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary"
            >
              <option value="">Общий бюджет (все расходы)</option>
              {categories
                .filter((c) => c.type === 'expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
            </select>
          </div>

          <Button type="submit" fullWidth isLoading={isCreating}>
            Создать
          </Button>
        </form>
      </Modal>
    </div>
  );
};
