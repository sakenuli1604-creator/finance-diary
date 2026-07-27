import api from './axios';
import { Transaction } from '../types';

export interface CreateTransactionData {
  accountId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  title?: string;
  description?: string;
  shop?: string;
  location?: string;
  transactionDate?: string;
}

export interface UpdateTransactionData {
  accountId?: string;
  categoryId?: string;
  amount?: number;
  title?: string;
  description?: string;
  shop?: string;
  location?: string;
  rating?: number;
  transactionDate?: string;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export const transactionsAPI = {
  getAll: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTransactionData): Promise<Transaction> => {
    const response = await api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  addRating: async (id: string, rating: number): Promise<Transaction> => {
    const response = await api.patch<Transaction>(`/transactions/${id}/rating`, { rating });
    return response.data;
  },

  getRecent: async (limit = 10): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions/recent', {
      params: { limit },
    });
    return response.data;
  },

  getTodayStats: async (): Promise<{ income: number; expense: number }> => {
    const response = await api.get('/transactions/today-stats');
    return response.data;
  },
};
