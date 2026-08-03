import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ThemeMode } from '../store/themeStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CURRENCIES } from '../utils/currency';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isLoading } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState(user?.name || '');
  const [primaryCurrency, setPrimaryCurrency] = useState(user?.primaryCurrency || '₸');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await updateProfile({ name, primaryCurrency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось сохранить изменения');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Светлая', icon: <Sun size={18} /> },
    { value: 'dark', label: 'Тёмная', icon: <Moon size={18} /> },
    { value: 'system', label: 'Системная', icon: <Monitor size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-app pb-20">
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Настройки</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Тема оформления */}
        <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
          <label className="block text-sm font-medium text-secondary mb-3">
            Тема оформления
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-colors ${
                  theme === opt.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                    : 'border-line text-secondary hover:text-primary'
                }`}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-xl shadow-sm border border-line p-6 space-y-4"
        >
          <Input
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Основная валюта
            </label>
            <select
              value={primaryCurrency}
              onChange={(e) => setPrimaryCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-surface text-primary"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-secondary mt-1">
              Суммы по счетам в других валютах будут автоматически конвертироваться в основную
              валюту по текущему курсу — на главной, в транзакциях и в аналитике.
            </p>
          </div>

          {error && <p className="text-expense text-sm">{error}</p>}
          {saved && <p className="text-income text-sm">Сохранено ✓</p>}

          <Button type="submit" fullWidth isLoading={isLoading}>
            Сохранить
          </Button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line bg-surface text-expense font-medium hover:bg-expense/10 transition-colors"
        >
          <LogOut size={18} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};
