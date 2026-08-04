import React from 'react';
import { Transaction } from '../../types';
import { Card } from '../ui/Card';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
}) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: transaction.category?.color || '#E5E7EB' }}
          >
            {transaction.category?.icon || '📌'}
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium text-primary">
              {transaction.title || transaction.category?.name}
            </h3>
            <p className="text-sm text-secondary">
              {formatDate(transaction.transactionDate)}
              {transaction.shop && ` • ${transaction.shop}`}
            </p>
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {transaction.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="text-[11px] px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p
            className={`text-lg font-bold ${
              transaction.type === 'income' ? 'text-income' : 'text-expense'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatAmount(Number(transaction.amount))} {transaction.currency}
          </p>
          {transaction.rating && (
            <div className="flex gap-0.5 justify-end mt-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < transaction.rating! ? 'text-yellow-400' : 'text-secondary'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
