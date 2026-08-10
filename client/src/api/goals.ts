import api from './axios';
import { Goal } from '../types';

export interface GoalItemInput {
  name: string;
  targetAmount: number;
}

export interface CreateGoalData {
  name: string;
  targetAmount: number;
  accountId?: string;
  deadline?: string;
  icon?: string;
  items?: GoalItemInput[]; // если задано — создаём цель сразу разбитой на пункты
}

export interface UpdateGoalData {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  icon?: string;
  isCompleted?: boolean;
}

export const goalsAPI = {
  getAll: async (): Promise<Goal[]> => {
    const response = await api.get<Goal[]>('/goals');
    return response.data;
  },

  getById: async (id: string): Promise<Goal> => {
    const response = await api.get<Goal>(`/goals/${id}`);
    return response.data;
  },

  create: async (data: CreateGoalData): Promise<Goal> => {
    const response = await api.post<Goal>('/goals', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGoalData): Promise<Goal> => {
    const response = await api.put<Goal>(`/goals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },

  deposit: async (
    id: string,
    amount: number,
    accountId: string,
    itemId?: string
  ): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/deposit`, {
      amount,
      accountId,
      itemId,
    });
    return response.data;
  },

  withdraw: async (
    id: string,
    amount: number,
    accountId: string,
    itemId?: string
  ): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/withdraw`, {
      amount,
      accountId,
      itemId,
    });
    return response.data;
  },

  addItem: async (goalId: string, name: string, targetAmount: number): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${goalId}/items`, { name, targetAmount });
    return response.data;
  },

  removeItem: async (goalId: string, itemId: string): Promise<Goal> => {
    const response = await api.delete<Goal>(`/goals/${goalId}/items/${itemId}`);
    return response.data;
  },
};
