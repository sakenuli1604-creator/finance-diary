import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate('/');
    } catch (error) {
      // Ошибка обрабатывается в store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Финансовый дневник</h1>
          <p className="text-secondary mt-2">Войдите в свой аккаунт</p>
        </div>

        <div className="bg-surface p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              type="password"
              name="password"
              label="Пароль"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error && (
              <div className="bg-expense/10 text-expense px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Войти
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
