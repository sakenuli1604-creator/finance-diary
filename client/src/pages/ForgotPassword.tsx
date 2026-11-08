import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setIsLoading(true);
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(
        err.response?.status === 429
          ? 'Слишком много запросов. Попробуйте через 15 минут.'
          : 'Не удалось отправить запрос. Проверьте соединение и попробуйте ещё раз.'
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
          <p className="text-secondary mt-2">Восстановление пароля</p>
        </div>

        <div className="bg-surface p-8 rounded-2xl shadow-lg">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-primary">
                Если аккаунт с адресом <b>{email}</b> существует, мы отправили на него письмо со
                ссылкой для сброса пароля.
              </p>
              <p className="text-secondary text-sm">
                Письмо может идти до пары минут. Проверьте также папку «Спам». Ссылка действует 1 час.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-secondary text-sm">
                Введите email, с которым вы регистрировались — пришлём ссылку для создания нового пароля.
              </p>
              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
              />

              {error && (
                <div className="bg-expense/10 text-expense px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <Button type="submit" fullWidth isLoading={isLoading}>
                Отправить ссылку
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
