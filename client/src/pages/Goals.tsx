import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useGoalsStore } from '../store/goalsStore';
import { useAuthStore } from '../store/authStore';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalForm } from '../components/goals/GoalForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Goals: React.FC = () => {
  const navigate = useNavigate();
  const { goals, isLoading, fetchGoals, createGoal } = useGoalsStore();
  const { user } = useAuthStore();
  const primaryCurrency = user?.primaryCurrency || '₸';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (data: any) => {
    try {
      setIsCreating(true);
      await createGoal(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Цели</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Total Progress */}
        <Card className="p-6">
          <h3 className="text-sm text-secondary mb-2">Общий прогресс</h3>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(totalSaved)} {primaryCurrency}
              </p>
              <p className="text-sm text-secondary">
                из {formatAmount(totalTarget)} {primaryCurrency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-blue-600">
                {totalTarget > 0
                  ? Math.round((totalSaved / totalTarget) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
          <div className="w-full bg-muted-strong rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{
                width: `${
                  totalTarget > 0
                    ? Math.min((totalSaved / totalTarget) * 100, 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </Card>

        {/* Add Goal Button */}
        <Button
          onClick={() => setIsModalOpen(true)}
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Добавить цель
        </Button>

        {/* Active Goals */}
        {isLoading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-secondary mb-4">У вас пока нет целей</p>
            <Button onClick={() => setIsModalOpen(true)}>Создать первую цель</Button>
          </Card>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Активные цели</h2>
                <div className="space-y-3">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Достигнутые цели</h2>
                <div className="space-y-3 opacity-75">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новая цель"
      >
        <GoalForm onSubmit={handleCreateGoal} isLoading={isCreating} />
      </Modal>
    </div>
  );
};
