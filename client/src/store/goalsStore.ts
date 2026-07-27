import { create } from 'zustand';
import { Goal } from '../types';
import { goalsAPI, CreateGoalData, UpdateGoalData } from '../api/goals';

interface GoalsState {
  goals: Goal[];
  selectedGoal: Goal | null;
  isLoading: boolean;
  error: string | null;

  fetchGoals: () => Promise<void>;
  fetchGoal: (id: string) => Promise<void>;
  createGoal: (data: CreateGoalData) => Promise<Goal>;
  updateGoal: (id: string, data: UpdateGoalData) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deposit: (id: string, amount: number, accountId: string) => Promise<void>;
  withdraw: (id: string, amount: number, accountId: string) => Promise<void>;
  clearError: () => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  selectedGoal: null,
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    try {
      set({ isLoading: true, error: null });
      const goals = await goalsAPI.getAll();
      set({ goals, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch goals',
        isLoading: false,
      });
    }
  },

  fetchGoal: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const goal = await goalsAPI.getById(id);
      set({ selectedGoal: goal, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch goal',
        isLoading: false,
      });
    }
  },

  createGoal: async (data: CreateGoalData) => {
    try {
      set({ isLoading: true, error: null });
      const goal = await goalsAPI.create(data);
      set((state) => ({
        goals: [goal, ...state.goals],
        isLoading: false,
      }));
      return goal;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create goal',
        isLoading: false,
      });
      throw error;
    }
  },

  updateGoal: async (id: string, data: UpdateGoalData) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await goalsAPI.update(id, data);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
        selectedGoal: state.selectedGoal?.id === id ? updated : state.selectedGoal,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update goal',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteGoal: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await goalsAPI.delete(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete goal',
        isLoading: false,
      });
      throw error;
    }
  },

  deposit: async (id: string, amount: number, accountId: string) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await goalsAPI.deposit(id, amount, accountId);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
        selectedGoal: state.selectedGoal?.id === id ? updated : state.selectedGoal,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to deposit',
        isLoading: false,
      });
      throw error;
    }
  },

  withdraw: async (id: string, amount: number, accountId: string) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await goalsAPI.withdraw(id, amount, accountId);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
        selectedGoal: state.selectedGoal?.id === id ? updated : state.selectedGoal,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to withdraw',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
