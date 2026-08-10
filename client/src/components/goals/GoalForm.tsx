import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CreateGoalData, GoalItemInput } from '../../api/goals';
import { useAccountsStore } from '../../store/accountsStore';

interface GoalFormProps {
  onSubmit: (data: CreateGoalData) => Promise<void>;
  initialData?: Partial<CreateGoalData>;
  isLoading?: boolean;
  hasItems?: boolean;
}

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '💍', '🎓', '💻', '📱', '⌚', '🎮'];

export const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  hasItems = false,
}) => {
  const { accounts, fetchAccounts } = useAccountsStore();
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState<CreateGoalData>({
    name: initialData?.name || '',
    targetAmount: initialData?.targetAmount || 0,
    accountId: initialData?.accountId,
    deadline: initialData?.deadline,
    icon: initialData?.icon || '🎯',
  });

  // Разбивка на пункты доступна только при СОЗДАНИИ новой цели — для уже
  // существующей цели пункты добавляются/удаляются на её странице
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [items, setItems] = useState<GoalItemInput[]>([
    { name: '', targetAmount: 0 },
    { name: '', targetAmount: 0 },
  ]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const itemsTotal = items.reduce((sum, i) => sum + (i.targetAmount || 0), 0);

  const updateItem = (index: number, patch: Partial<GoalItemInput>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItemRow = () => setItems((prev) => [...prev, { name: '', targetAmount: 0 }]);

  const removeItemRow = (index: number) => {
    if (items.length <= 2) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSplitMode) {
      const validItems = items.filter((i) => i.name.trim() && i.targetAmount > 0);
      if (validItems.length < 2) {
        alert('Укажи минимум 2 пункта с названием и суммой');
        return;
      }
      await onSubmit({
        ...formData,
        targetAmount: 0, // addItem сам увеличит сумму цели на targetAmount каждого пункта
        items: validItems,
      });
      return;
    }

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

      {!isEditMode && (
        <button
          type="button"
          onClick={() => setIsSplitMode((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isSplitMode ? '← Одна общая сумма' : 'Разбить на несколько пунктов →'}
        </button>
      )}

      {isSplitMode && !isEditMode ? (
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Пункты цели
          </label>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="Например: Монитор"
                  className="flex-1 px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={item.targetAmount || ''}
                  onChange={(e) =>
                    updateItem(index, { targetAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-28 px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-surface text-primary text-right"
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  disabled={items.length <= 2}
                  className="text-secondary hover:text-expense disabled:opacity-30 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItemRow}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} />
            Добавить пункт
          </button>

          <div className="flex items-center justify-between px-1 py-2 mt-2 border-t border-line text-sm">
            <span className="text-secondary">Итого сумма цели</span>
            <span className="font-bold text-primary">{itemsTotal.toLocaleString('ru-RU')}</span>
          </div>
        </div>
      ) : (
        <>
          <Input
            label="Сумма цели"
            type="number"
            step="0.01"
            placeholder="0"
            value={formData.targetAmount}
            onChange={(e) =>
              setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })
            }
            disabled={hasItems}
            required
          />
          {hasItems && (
            <p className="text-xs text-secondary -mt-3">
              Сумма считается автоматически из пунктов цели — управляйте ей на странице цели
              (добавляя/удаляя пункты), а не здесь.
            </p>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Связать со счетом (опционально)
        </label>
        <select
          value={formData.accountId || ''}
          onChange={(e) =>
            setFormData({ ...formData, accountId: e.target.value || undefined })
          }
          className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
        <label className="block text-sm font-medium text-secondary mb-2">
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
                  : 'border-line hover:border-line'
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
