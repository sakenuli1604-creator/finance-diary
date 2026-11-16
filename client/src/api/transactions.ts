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
  tagIds?: string[];
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
  tagIds?: string[];
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  amountMin?: number;
  amountMax?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'amount' | 'category';
  sortDir?: 'asc' | 'desc';
}

export interface TransactionTotalsRow {
  currency: string;
  type: 'income' | 'expense';
  sum: number;
  count: number;
}

export interface SplitPart {
  categoryId: string;
  amount: number;
}

export interface CreateSplitTransactionData {
  accountId: string;
  type: 'income' | 'expense';
  parts: SplitPart[];
  title?: string;
  description?: string;
  shop?: string;
  transactionDate?: string;
}

export interface ImportRow {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  title?: string;
  categoryId: string;
}

export interface ImportAnalysis {
  duplicates: boolean[];
  suggestions: (string | null)[];
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

  createSplit: async (data: CreateSplitTransactionData): Promise<Transaction[]> => {
    const response = await api.post<Transaction[]>('/transactions/split', data);
    return response.data;
  },

  // Итоги по тем же фильтрам, но по всем подходящим операциям (не только по загруженной странице)
  getTotals: async (filters?: TransactionFilters): Promise<TransactionTotalsRow[]> => {
    const response = await api.get<TransactionTotalsRow[]>('/transactions/totals', {
      params: filters,
    });
    return response.data;
  },

  analyzeImport: async (accountId: string, rows: ImportRow[]): Promise<ImportAnalysis> => {
    // Сервер не знает часовой пояс пользователя, поэтому границы календарного дня считаем здесь
    const payload = rows.map((r) => {
      const d = new Date(r.date);
      return {
        date: r.date,
        dayStart: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString(),
        dayEnd: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString(),
        amount: r.amount,
        type: r.type,
        title: r.title,
      };
    });
    const response = await api.post<ImportAnalysis>('/transactions/import/analyze', {
      accountId,
      rows: payload,
    });
    return response.data;
  },

  bulkImport: async (accountId: string, rows: ImportRow[]): Promise<{ imported: number }> => {
    const response = await api.post<{ imported: number }>('/transactions/import', {
      accountId,
      rows,
    });
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

  getShopSuggestions: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/transactions/shops');
    return response.data;
  },

  getDeleted: async (limit = 50): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/transactions/deleted', {
      params: { limit },
    });
    return response.data;
  },

  restore: async (id: string): Promise<void> => {
    await api.post(`/transactions/${id}/restore`);
  },

  permanentDelete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}/permanent`);
  },

  emptyTrash: async (days = 30): Promise<{ count: number }> => {
    const response = await api.delete('/transactions/trash/empty', {
      params: { days },
    });
    return response.data;
  },
};
