import api from './axios';

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  type: string;
  total: number;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  income: number;
  expense: number;
}

export const analyticsAPI = {
  getSummary: async (from?: string, to?: string): Promise<AnalyticsSummary> => {
    const response = await api.get<AnalyticsSummary>('/analytics/summary', {
      params: { from, to },
    });
    return response.data;
  },

  getByCategory: async (from?: string, to?: string): Promise<CategoryAnalytics[]> => {
    const response = await api.get<CategoryAnalytics[]>('/analytics/by-category', {
      params: { from, to },
    });
    return response.data;
  },

  getTrends: async (
    from: string,
    to: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<TrendData[]> => {
    const response = await api.get<TrendData[]>('/analytics/trends', {
      params: { from, to, groupBy },
    });
    return response.data;
  },

  getTopExpenses: async (from?: string, to?: string, limit = 10): Promise<any[]> => {
    const response = await api.get('/analytics/top-expenses', {
      params: { from, to, limit },
    });
    return response.data;
  },

  getExpensiveDays: async (from?: string, to?: string, limit = 5): Promise<any[]> => {
    const response = await api.get('/analytics/expensive-days', {
      params: { from, to, limit },
    });
    return response.data;
  },

  getAccountsBreakdown: async (): Promise<any[]> => {
    const response = await api.get('/analytics/accounts-breakdown');
    return response.data;
  },

  getRatingStats: async (): Promise<any> => {
    const response = await api.get('/analytics/rating-stats');
    return response.data;
  },

  getPendingReviews: async (): Promise<any[]> => {
    const response = await api.get('/analytics/pending-reviews');
    return response.data;
  },

  getRegrettedPurchases: async (): Promise<any[]> => {
    const response = await api.get('/analytics/regretted-purchases');
    return response.data;
  },
};
