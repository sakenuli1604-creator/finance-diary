import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CreateGoalData } from '../../api/goals';
import { useAccountsStore } from '../../store/accountsStore';

interface GoalFormProps {
  onSubmit: (data: CreateGoalData) => Promise<void>;
  initialData?: Partial<CreateGoalData>;
  isLoading?: boolean;
}

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '💍', '🎓', '💻', '📱', '⌚', '🎮'];

export const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const { accounts, fetchAccounts } = useAccountsStore();

  const [formData, setFormData] = useState<CreateGoalData>({
    name: initialData?.name || '',
    targetAmount: initialData?.targetAmount || 0,
    accountId: initialData?.accountId,
    deadline: initialData?.deadline,
    icon: initialData?.icon || '🎯',
  });

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Название цели"
        placeholder="Например: Новый MacBook"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Сумма цели"
        type="number"
        step="0.01"
        placeholder="0"
        value={formData.targetAmount}
        onChange={(e) =>
          setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
        }
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Связать со счетом (опционально)
        </label>
        <select
          value={formData.accountId || ''}
          onChange={(e) =>
            setFormData({ ...formData, accountId: e.target.value || undefined })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="">Не связывать</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.icon} {account.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Крайний срок (опционально)"
        type="date"
        value={formData.deadline || ''}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Иконка
        </label>
        <div className="grid grid-cols-5 gap-2">
          {GOAL_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                formData.icon === icon
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData({ ...formData, icon })}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        {initialData ? 'Сохранить' : 'Создать цель'}
      </Button>
    </form>
  );
};
