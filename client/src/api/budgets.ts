import api from './axios';
import { Budget } from '../types';

export interface CreateBudgetData {
  categoryId?: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface UpdateBudgetData {
  name?: string;
  amount?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive?: boolean;
}

export const budgetsAPI = {
  getAll: async (activeOnly = true): Promise<Budget[]> => {
    const response = await api.get<Budget[]>('/budgets', { params: { active: activeOnly } });
    return response.data;
  },

  create: async (data: CreateBudgetData): Promise<Budget> => {
    const response = await api.post<Budget>('/budgets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBudgetData): Promise<Budget> => {
    const response = await api.put<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },
};
