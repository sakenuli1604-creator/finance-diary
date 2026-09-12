import { create } from 'zustand';
import { transfersAPI, CreateTransferData } from '../api/transfers';
import { Transfer } from '../types';

interface TransfersState {
  transfers: Transfer[];
  isLoading: boolean;
  error: string | null;

  fetchTransfers: () => Promise<void>;
  createTransfer: (data: CreateTransferData) => Promise<Transfer>;
  clearError: () => void;
}

export const useTransfersStore = create<TransfersState>((set) => ({
  transfers: [],
  isLoading: false,
  error: null,

  fetchTransfers: async () => {
    try {
      set({ isLoading: true, error: null });
      const transfers = await transfersAPI.getAll();
      set({ transfers, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Не удалось загрузить переводы',
        isLoading: false,
      });
    }
  },

  createTransfer: async (data: CreateTransferData) => {
    try {
      set({ isLoading: true, error: null });
      const transfer = await transfersAPI.create(data);
      set((state) => ({ transfers: [transfer, ...state.transfers], isLoading: false }));
      return transfer;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Не удалось выполнить перевод',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
