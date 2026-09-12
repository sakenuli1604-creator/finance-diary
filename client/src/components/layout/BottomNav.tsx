import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, TrendingDown, Target, PieChart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/accounts', icon: Wallet, label: 'Счета' },
    { path: '/transactions', icon: TrendingDown, label: 'Операции' },
    { path: '/goals', icon: Target, label: 'Цели' },
    { path: '/analytics', icon: PieChart, label: 'Аналитика' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line safe-area-bottom z-50">
      <div className="grid grid-cols-5 max-w-4xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
