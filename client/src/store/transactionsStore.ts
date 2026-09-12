import { create } from 'zustand';
import { Transaction } from '../types';
import {
  transactionsAPI,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  CreateSplitTransactionData,
} from '../api/transactions';

interface TransactionsState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;

  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchTransaction: (id: string) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<Transaction>;
  createSplitTransaction: (data: CreateSplitTransactionData) => Promise<Transaction[]>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addRating: (id: string, rating: number) => Promise<void>;
  clearError: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  selectedTransaction: null,
  isLoading: false,
  error: null,

  fetchTransactions: async (filters?: TransactionFilters) => {
    try {
      set({ isLoading: true, error: null });
      const transactions = await transactionsAPI.getAll(filters);
      set({ transactions, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch transactions',
        isLoading: false,
      });
    }
  },

  fetchTransaction: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const transaction = await transactionsAPI.getById(id);
      set({ selectedTransaction: transaction, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch transaction',
        isLoading: false,
      });
    }
  },

  createTransaction: async (data: CreateTransactionData) => {
    try {
      set({ isLoading: true, error: null });
      const transaction = await transactionsAPI.create(data);
      set((state) => ({
        transactions: [transaction, ...state.transactions],
        isLoading: false,
      }));
      return transaction;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create transaction',
        isLoading: false,
      });
      throw error;
    }
  },

  createSplitTransaction: async (data: CreateSplitTransactionData) => {
    try {
      set({ isLoading: true, error: null });
      const transactions = await transactionsAPI.createSplit(data);
      set((state) => ({
        transactions: [...transactions, ...state.transactions],
        isLoading: false,
      }));
      return transactions;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create split transaction',
        isLoading: false,
      });
      throw error;
    }
  },

  updateTransaction: async (id: string, data: UpdateTransactionData) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await transactionsAPI.update(id, data);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        selectedTransaction:
          state.selectedTransaction?.id === id ? updated : state.selectedTransaction,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update transaction',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await transactionsAPI.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete transaction',
        isLoading: false,
      });
      throw error;
    }
  },

  addRating: async (id: string, rating: number) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await transactionsAPI.addRating(id, rating);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        selectedTransaction:
          state.selectedTransaction?.id === id ? updated : state.selectedTransaction,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to add rating',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
