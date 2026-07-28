import { create } from 'zustand';
import { User } from '../types';
import { authAPI, LoginData, RegisterData } from '../api/auth';
import { settingsAPI, UpdateProfileData } from '../api/settings';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(data);

      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.register(data);

      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    try {
      const user = await authAPI.getMe();
      set({ user, token });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const user = await settingsAPI.updateProfile(data);
      set((state) => ({ user: { ...state.user, ...user } as User, isLoading: false }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Не удалось обновить профиль',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
