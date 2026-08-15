import React from 'react';
import { Goal } from '../../types';
import { Card } from '../ui/Card';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
  const isCompleted = progress >= 100;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const daysLeft = goal.deadline
    ? Math.ceil(
        (new Date(goal.deadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{goal.icon || '🎯'}</div>
          <div>
            <h3 className="font-semibold text-primary">{goal.name}</h3>
            {daysLeft !== null && (
              <p className="text-xs text-secondary">
                {daysLeft > 0
                  ? `Осталось ${daysLeft} дней`
                  : daysLeft === 0
                  ? 'Сегодня!'
                  : 'Просрочено'}
              </p>
            )}
          </div>
        </div>
        {isCompleted && (
          <span className="bg-income/10 text-income text-xs font-medium px-2 py-1 rounded">
            ✓ Достигнута
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-muted-strong rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-secondary">Накоплено</p>
          <p className="text-lg font-bold text-primary">
            {formatAmount(Number(goal.currentAmount))} {goal.currency}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-secondary">Цель</p>
          <p className="text-lg font-semibold text-secondary">
            {formatAmount(Number(goal.targetAmount))} {goal.currency}
          </p>
        </div>
      </div>

      {/* Remaining */}
      {!isCompleted && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-sm text-secondary">
            Осталось:{' '}
            <span className="font-semibold text-primary">
              {formatAmount(Number(goal.targetAmount) - Number(goal.currentAmount))} {goal.currency}
            </span>
          </p>
        </div>
      )}
    </Card>
  );
};
