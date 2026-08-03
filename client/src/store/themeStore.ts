import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode: ThemeMode) {
  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', isDark);
}

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  init: () => void;
}

let systemListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system',

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  init: () => {
    const theme = get().theme;
    applyTheme(theme);

    // Если выбран "системная" — следим за сменой темы ОС в реальном времени
    if (!systemListenerAttached) {
      systemListenerAttached = true;
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', () => {
        if (get().theme === 'system') {
          applyTheme('system');
        }
      });
    }
  },
}));
