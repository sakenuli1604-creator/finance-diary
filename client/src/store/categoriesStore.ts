import { create } from 'zustand';
import { Category } from '../types';
import { categoriesAPI, CreateCategoryData } from '../api/categories';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: (type?: string) => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CreateCategoryData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (type?: string) => {
    try {
      set({ isLoading: true, error: null });
      const categories = await categoriesAPI.getAll(type);
      set({ categories, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch categories',
        isLoading: false,
      });
    }
  },

  createCategory: async (data: CreateCategoryData) => {
    try {
      set({ isLoading: true, error: null });
      const category = await categoriesAPI.create(data);
      set((state) => ({
        categories: [...state.categories, category],
        isLoading: false,
      }));
      return category;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create category',
        isLoading: false,
      });
      throw error;
    }
  },

  updateCategory: async (id: string, data: Partial<CreateCategoryData>) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await categoriesAPI.update(id, data);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updated : c)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update category',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await categoriesAPI.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete category',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
