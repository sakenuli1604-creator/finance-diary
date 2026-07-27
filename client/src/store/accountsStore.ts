import { create } from 'zustand';
import { Account } from '../types';
import { accountsAPI, CreateAccountData, UpdateAccountData } from '../api/accounts';

interface AccountsState {
  accounts: Account[];
  selectedAccount: Account | null;
  isLoading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  fetchAccount: (id: string) => Promise<void>;
  createAccount: (data: CreateAccountData) => Promise<Account>;
  updateAccount: (id: string, data: UpdateAccountData) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  selectedAccount: null,
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const accounts = await accountsAPI.getAll();
      set({ accounts, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch accounts',
        isLoading: false,
      });
    }
  },

  fetchAccount: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const account = await accountsAPI.getById(id);
      set({ selectedAccount: account, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch account',
        isLoading: false,
      });
    }
  },

  createAccount: async (data: CreateAccountData) => {
    try {
      set({ isLoading: true, error: null });
      const account = await accountsAPI.create(data);
      set((state) => ({
        accounts: [account, ...state.accounts],
        isLoading: false,
      }));
      return account;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create account',
        isLoading: false,
      });
      throw error;
    }
  },

  updateAccount: async (id: string, data: UpdateAccountData) => {
    try {
      set({ isLoading: true, error: null });
      const updatedAccount = await accountsAPI.update(id, data);
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc.id === id ? updatedAccount : acc
        ),
        selectedAccount:
          state.selectedAccount?.id === id ? updatedAccount : state.selectedAccount,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update account',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteAccount: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await accountsAPI.delete(id);
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete account',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
