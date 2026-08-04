import { create } from 'zustand';
import { Budget } from '../types';
import { budgetsAPI, CreateBudgetData } from '../api/budgets';

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  fetchBudgets: () => Promise<void>;
  createBudget: (data: CreateBudgetData) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: [],
  isLoading: false,

  fetchBudgets: async () => {
    try {
      set({ isLoading: true });
      const budgets = await budgetsAPI.getAll();
      set({ budgets, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  createBudget: async (data) => {
    const budget = await budgetsAPI.create(data);
    set({ budgets: [budget, ...get().budgets] });
    return budget;
  },

  deleteBudget: async (id) => {
    await budgetsAPI.delete(id);
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },
}));
