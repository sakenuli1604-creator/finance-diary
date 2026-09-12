import api from './axios';
import { Category } from '../types';

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export const categoriesAPI = {
  getAll: async (type?: string): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories', {
      params: { type },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCategoryData>): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  getUsage: async (type?: string): Promise<Record<string, number>> => {
    const response = await api.get<Record<string, number>>('/categories/usage', {
      params: { type },
    });
    return response.data;
  },
};
