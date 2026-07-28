import api from './axios';
import { User } from '../types';

export interface UpdateProfileData {
  name?: string;
  primaryCurrency?: string;
}

export interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
}

export const settingsAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/settings/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await api.patch<User>('/settings/profile', data);
    return response.data;
  },

  getExchangeRates: async (): Promise<RatesResponse> => {
    const response = await api.get<RatesResponse>('/settings/exchange-rates');
    return response.data;
  },
};
