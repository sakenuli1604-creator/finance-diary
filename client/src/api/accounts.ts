import api from './axios';
import { Account } from '../types';

export interface CreateAccountData {
  name: string;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
}

export interface UpdateAccountData {
  name?: string;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export const accountsAPI = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/accounts');
    return response.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await api.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  create: async (data: CreateAccountData): Promise<Account> => {
    const response = await api.post<Account>('/accounts', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAccountData): Promise<Account> => {
    const response = await api.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },

  getTotalBalance: async (): Promise<number> => {
    const response = await api.get<{ totalBalance: number; currency: string }>(
      '/accounts/total-balance'
    );
    return response.data.totalBalance;
  },

  getHistory: async (id: string, limit = 50): Promise<any[]> => {
    const response = await api.get(`/accounts/${id}/history`, {
      params: { limit },
    });
    return response.data;
  },
};
