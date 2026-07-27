import React, { useEffect } from 'react';
import { useCategoriesStore } from '../../store/categoriesStore';

interface CategorySelectorProps {
  type: 'income' | 'expense';
  selectedCategoryId?: string;
  onSelect: (categoryId: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  type,
  selectedCategoryId,
  onSelect,
}) => {
  const { categories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories(type);
  }, [type, fetchCategories]);

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Категория
      </label>
      <div className="grid grid-cols-3 gap-2">
        {filteredCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedCategoryId === category.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">{category.icon || '📌'}</div>
            <div className="text-xs font-medium text-gray-700">{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
