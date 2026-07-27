import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { useCategoriesStore } from '../store/categoriesStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const CATEGORY_ICONS = [
  '🍔', '🚕', '🛍️', '📦', '💸', '🎮', '🚌', '🏠', '💊', '📚',
  '💻', '📱', '⌚', '👕', '✈️', '🎬', '☕', '🍕', '🎓', '💼',
  '🎁', '💰', '💵', '📌', '🔧', '⚽', '🎵', '📸', '🚗', '🏋️',
];

const CATEGORY_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
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
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
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
                              className="p-1 text-gray-600 hover:text-blue-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1 text-gray-600 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {category.name}
                      </p>
                      {category.isDefault && (
                        <p className="text-xs text-gray-500 mt-1">По умолчанию</p>
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
                              className="p-1 text-gray-600 hover:text-blue-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1 text-gray-600 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {category.name}
                      </p>
                      {category.isDefault && (
                        <p className="text-xs text-gray-500 mt-1">По умолчанию</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`p-2 text-2xl rounded-lg border-2 transition-all ${
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-12 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <Button type="submit" fullWidth>
            {editingCategory ? 'Сохранить' : 'Создать'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
