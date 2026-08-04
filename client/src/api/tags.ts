import api from './axios';
import { Tag } from '../types';

export interface CreateTagData {
  name: string;
  color?: string;
}

export const tagsAPI = {
  getAll: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },

  create: async (data: CreateTagData): Promise<Tag> => {
    const response = await api.post<Tag>('/tags', data);
    return response.data;
  },

  update: async (id: string, data: CreateTagData): Promise<Tag> => {
    const response = await api.put<Tag>(`/tags/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },

  setTransactionTags: async (transactionId: string, tagIds: string[]): Promise<void> => {
    await api.post(`/tags/transaction/${transactionId}`, { tagIds });
  },
};
