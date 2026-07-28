import { create } from 'zustand';
import { settingsAPI } from '../api/settings';

interface ExchangeRatesState {
  rates: Record<string, number> | null;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
}

export const useExchangeRatesStore = create<ExchangeRatesState>((set, get) => ({
  rates: null,
  isLoading: false,

  fetchRates: async () => {
    if (get().rates || get().isLoading) return;

    try {
      set({ isLoading: true });
      const response = await settingsAPI.getExchangeRates();
      set({ rates: response.rates, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
