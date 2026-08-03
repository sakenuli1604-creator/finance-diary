import React from 'react';
import { Account } from '../../types';
import { Card } from '../ui/Card';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU').format(balance);
  };

  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: account.color || '#E5E7EB' }}
          >
            {account.icon || '💳'}
          </div>

          <div>
            <h3 className="font-semibold text-primary">{account.name}</h3>
            {!account.isActive && (
              <span className="text-xs text-secondary">Архивирован</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-primary">
            {formatBalance(Number(account.balance))} {account.currency}
          </p>
        </div>
      </div>
    </Card>
  );
};
