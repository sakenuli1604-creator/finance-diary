import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Не удалось сменить пароль. Проверьте соединение и попробуйте ещё раз.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Финансовый дневник</h1>
          <p className="text-secondary mt-2">Новый пароль</p>
        </div>

        <div className="bg-surface p-8 rounded-2xl shadow-lg">
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-primary">В ссылке не хватает кода сброса.</p>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                Запросить новую ссылку
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4 text-center">
              <p className="text-primary">Пароль изменён. Теперь можно войти с новым паролем.</p>
              <Button fullWidth onClick={() => navigate('/login')}>
                Войти
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                name="password"
                label="Новый пароль"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
              />
              <Input
                type="password"
                name="confirmPassword"
                label="Повторите пароль"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                required
              />

              {error && (
                <div className="bg-expense/10 text-expense px-4 py-3 rounded-lg text-sm">
                  {error}{' '}
                  {error.includes('недействительна') && (
                    <Link to="/forgot-password" className="underline font-medium">
                      Запросить новую
                    </Link>
                  )}
                </div>
              )}

              <Button type="submit" fullWidth isLoading={isLoading}>
                Сохранить пароль
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
