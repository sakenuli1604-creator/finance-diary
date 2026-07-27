import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    clearError();
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Пароль должен быть минимум 6 символов');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate('/');
    } catch (error) {
      // Ошибка обрабатывается в store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Финансовый дневник</h1>
          <p className="text-gray-600 mt-2">Создайте свой аккаунт</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="name"
              label="Имя"
              placeholder="Ваше имя"
              value={formData.name}
              onChange={handleChange}
              required
            />

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

            <Input
              type="password"
              name="confirmPassword"
              label="Подтвердите пароль"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            {(error || validationError) && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error || validationError}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Зарегистрироваться
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
