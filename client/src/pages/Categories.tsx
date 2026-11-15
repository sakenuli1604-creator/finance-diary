import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { useCategoriesStore } from '../store/categoriesStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

// Иконки по группам — внутри выбора группы подписаны, чтобы быстрее найти нужную
const ICON_GROUPS: { title: string; icons: string[] }[] = [
  {
    title: 'Еда и напитки',
    icons: ['🍔', '🍕', '🍟', '🌭', '🥪', '🌮', '🍜', '🍣', '🍱', '🥗', '🍝', '🍳', '🥐', '🍞', '🧀', '🍰', '🍩', '🍫', '🍦', '☕', '🍵', '🧋', '🥤', '🍺', '🍷', '🛒', '🥩', '🍎', '🥕', '🍽️'],
  },
  {
    title: 'Транспорт',
    icons: ['🚕', '🚌', '🚗', '🚙', '🚇', '🚆', '✈️', '🚲', '🛴', '🏍️', '⛽', '🅿️', '🚢', '🛵', '🚖', '🚐', '🛣️', '🧳'],
  },
  {
    title: 'Дом и быт',
    icons: ['🏠', '🛋️', '🛏️', '💡', '🚿', '🧹', '🧺', '🔧', '🔨', '🪴', '🧴', '🪥', '📶', '🔌', '🗝️', '🐶', '🐱', '🧸'],
  },
  {
    title: 'Покупки и одежда',
    icons: ['🛍️', '👕', '👖', '👗', '👟', '👜', '🧥', '🧢', '👓', '💍', '⌚', '💄', '🎒', '📦', '🏷️', '🧦'],
  },
  {
    title: 'Техника и интернет',
    icons: ['💻', '📱', '🖥️', '⌨️', '🖱️', '🎧', '📷', '📸', '🔋', '💾', '🖨️', '📡', '🕹️', '☁️', '🌐', '🤖'],
  },
  {
    title: 'Развлечения и хобби',
    icons: ['🎮', '🎬', '🎵', '🎸', '🎨', '🎭', '🎤', '📖', '🎲', '🧩', '⚽', '🏀', '🏋️', '🏊', '🎣', '⛺', '🎉', '🎟️'],
  },
  {
    title: 'Здоровье и учёба',
    icons: ['💊', '🩺', '🦷', '🏥', '🧘', '💆', '💇', '📚', '🎓', '✏️', '📝', '🏫', '🧪', '🔬'],
  },
  {
    title: 'Деньги и работа',
    icons: ['💰', '💵', '💸', '💳', '🏦', '📈', '📉', '💼', '🧾', '🤝', '🎁', '🪙', '🏆', '📌', '❤️', '⭐'],
  },
];

const CATEGORY_COLORS = [
  // насыщенные
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C',
  // мягкие
  '#FCA5A5', '#FDBA74', '#FCD34D', '#BEF264', '#86EFAC', '#5EEAD4',
  '#7DD3FC', '#A5B4FC', '#C4B5FD', '#F0ABFC', '#F9A8D4', '#D6D3D1',
  // тёмные
  '#991B1B', '#9A3412', '#854D0E', '#3F6212', '#166534', '#115E59',
  '#155E75', '#1E40AF', '#3730A3', '#6B21A8', '#9D174D', '#1F2937',
];

export const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { categories, isLoading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoriesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: '📌',
    color: '#3B82F6',
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = (type: 'income' | 'expense') => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type,
      icon: '📌',
      color: '#3B82F6',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || '📌',
      color: category.color || '#3B82F6',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Не удалось удалить категорию');
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  const expenseCategories = filteredCategories.filter((c) => c.type === 'expense');
  const incomeCategories = filteredCategories.filter((c) => c.type === 'income');

  return (
    <div className="min-h-screen bg-app pb-24">
      {/* Header */}
      <div className="bg-surface border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Категории</h1>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
              className="flex-1"
            >
              Все
            </Button>
            <Button
              variant={filter === 'expense' ? 'primary' : 'secondary'}
              onClick={() => setFilter('expense')}
              className="flex-1"
            >
              Расходы
            </Button>
            <Button
              variant={filter === 'income' ? 'primary' : 'secondary'}
              onClick={() => setFilter('income')}
              className="flex-1"
            >
              Доходы
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : (
          <>
            {/* Expense Categories */}
            {(filter === 'all' || filter === 'expense') && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Расходы</h2>
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenCreate('expense')}
                    className="flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Добавить
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {expenseCategories.map((category) => (
                    <Card key={category.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: category.color || '#E5E7EB' }}
                        >
                          {category.icon || '📌'}
                        </div>
                        {!category.isDefault && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleOpenEdit(category)}
                              className="p-1 text-secondary hover:text-blue-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1 text-secondary hover:text-expense"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-primary text-sm">
                        {category.name}
                      </p>
                      {category.isDefault && (
                        <p className="text-xs text-secondary mt-1">По умолчанию</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Income Categories */}
            {(filter === 'all' || filter === 'income') && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Доходы</h2>
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenCreate('income')}
                    className="flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Добавить
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {incomeCategories.map((category) => (
                    <Card key={category.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: category.color || '#E5E7EB' }}
                        >
                          {category.icon || '📌'}
                        </div>
                        {!category.isDefault && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleOpenEdit(category)}
                              className="p-1 text-secondary hover:text-blue-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1 text-secondary hover:text-expense"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-primary text-sm">
                        {category.name}
                      </p>
                      {category.isDefault && (
                        <p className="text-xs text-secondary mt-1">По умолчанию</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Редактировать категорию' : 'Новая категория'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название"
            placeholder="Например: Продукты"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Иконка
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: formData.color || '#E5E7EB' }}
              >
                {formData.icon || '📌'}
              </div>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value.slice(0, 4) })}
                placeholder="или вставьте свой эмодзи"
                className="flex-1 px-3 py-2 text-sm border border-line rounded-lg bg-surface text-primary outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {ICON_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-xs text-secondary mb-1">{group.title}</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {group.icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`p-1.5 text-2xl rounded-lg border-2 transition-all ${
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
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Цвет
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-9 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-primary scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
            <label className="flex items-center gap-3 mt-3 text-sm text-secondary">
              Свой цвет
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(formData.color || '') ? formData.color : '#3B82F6'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                className="w-12 h-9 p-0 border border-line rounded-lg bg-transparent cursor-pointer"
              />
            </label>
          </div>

          <Button type="submit" fullWidth>
            {editingCategory ? 'Сохранить' : 'Создать'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
