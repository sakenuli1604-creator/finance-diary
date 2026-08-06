import { create } from 'zustand';

const STORAGE_KEY = 'amounts-hidden';

interface PrivacyState {
  hidden: boolean;
  toggle: () => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  hidden: localStorage.getItem(STORAGE_KEY) === 'true',

  toggle: () => {
    const next = !get().hidden;
    localStorage.setItem(STORAGE_KEY, String(next));
    set({ hidden: next });
  },
}));
