import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CreateAccountData } from '../../api/accounts';

interface AccountFormProps {
  onSubmit: (data: CreateAccountData) => Promise<void>;
  initialData?: CreateAccountData;
  isLoading?: boolean;
}

const ICONS = ['💳', '💰', '🏦', '💵', '💸', '🎓', '💼', '🏠', '🚗', '✈️'];
const COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
];

export const AccountForm: React.FC<AccountFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateAccountData>({
    name: initialData?.name || '',
    balance: initialData?.balance || 0,
    currency: initialData?.currency || '₸',
    icon: initialData?.icon || '💳',
    color: initialData?.color || '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Название счета"
        placeholder="Kaspi Gold"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Начальный баланс"
        type="number"
        step="0.01"
        placeholder="0"
        value={formData.balance}
        onChange={(e) =>
          setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
        }
      />

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Валюта
        </label>
        <select
          className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        >
          <option value="₸">₸ (Тенге)</option>
          <option value="$">$ (Доллар)</option>
          <option value="€">€ (Евро)</option>
          <option value="₽">₽ (Рубль)</option>
          <option value="₴">₴ (Гривна)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Иконка
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ICONS.map((icon) => (
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

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Цвет
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-10 rounded-lg border-2 transition-all ${
                formData.color === color
                  ? 'border-primary scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        {initialData ? 'Сохранить' : 'Создать счет'}
      </Button>
    </form>
  );
};
