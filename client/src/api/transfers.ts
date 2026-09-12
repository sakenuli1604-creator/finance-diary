import api from './axios';
import { Transfer } from '../types';

export interface CreateTransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export const transfersAPI = {
  getAll: async (limit = 50): Promise<Transfer[]> => {
    const response = await api.get<Transfer[]>('/transfers', {
      params: { limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Transfer> => {
    const response = await api.get<Transfer>(`/transfers/${id}`);
    return response.data;
  },

  create: async (data: CreateTransferData): Promise<Transfer> => {
    const response = await api.post<Transfer>('/transfers', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transfers/${id}`);
  },
};
