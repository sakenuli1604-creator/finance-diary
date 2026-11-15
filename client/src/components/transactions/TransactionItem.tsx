import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Repeat } from 'lucide-react';
import { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Amount } from '../ui/Amount';
import { useTransactionsStore } from '../../store/transactionsStore';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  // Когда операции сгруппированы по дням, дата уже есть в заголовке группы — показываем только время
  showDate?: boolean;
  // Режим выбора: свайпы отключены, тап — выбрать/снять, слева чекбокс
  selectMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
}

const SWIPE_THRESHOLD = 72; // px, после которого срабатывает действие
const MAX_SWIPE = 96;

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
  showDate = true,
  selectMode = false,
  selected = false,
  onLongPress,
}) => {
  const navigate = useNavigate();
  const { deleteTransaction } = useTransactionsStore();

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const moved = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const formatAmount = (amount: number) => new Intl.NumberFormat('ru-RU').format(amount);

  const formatDate = (date: string) =>
    showDate
      ? new Date(date).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const handlePointerDown = (e: React.PointerEvent) => {
    longPressFired.current = false;
    if (selectMode) return;
    startX.current = e.clientX;
    pointerId.current = e.pointerId;
    moved.current = false;
    setIsDragging(true);

    // долгое нажатие включает режим выбора
    clearLongPress();
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (!moved.current) {
          longPressFired.current = true;
          pointerId.current = null;
          setIsDragging(false);
          setDragX(0);
          onLongPress();
        }
      }, 500);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (selectMode || pointerId.current !== e.pointerId) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) {
      moved.current = true;
      clearLongPress();
    }
    const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, delta));
    setDragX(clamped);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    clearLongPress();
    if (selectMode || pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setIsDragging(false);

    if (dragX <= -SWIPE_THRESHOLD) {
      if (confirm('Удалить операцию? Её можно будет восстановить из корзины.')) {
        await deleteTransaction(transaction.id);
      }
    } else if (dragX >= SWIPE_THRESHOLD) {
      navigate('/transactions/add', {
        state: {
          repeat: {
            type: transaction.type,
            accountId: transaction.accountId,
            categoryId: transaction.categoryId,
            amount: Number(transaction.amount),
            title: transaction.title || '',
            description: transaction.description || '',
            shop: transaction.shop || '',
          },
        },
      });
    }
    setDragX(0);
  };

  const handleClick = () => {
    // клик после долгого нажатия (оно уже включило режим выбора) игнорируем
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    // клик после свайпа не должен открывать детали операции
    if (moved.current) {
      moved.current = false;
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Фон под карточкой — действия, открывающиеся при свайпе */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-white">
          <Repeat size={20} />
          <span className="text-sm font-medium">Повторить</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm font-medium">Удалить</span>
          <Trash2 size={20} />
        </div>
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            dragX > 0
              ? 'linear-gradient(to right, rgb(var(--color-income)), transparent 60%)'
              : dragX < 0
              ? 'linear-gradient(to left, rgb(var(--color-expense)), transparent 60%)'
              : 'transparent',
        }}
      />

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
        }}
      >
        <Card
          onClick={handleClick}
          className={`p-3.5 transition-colors ${selected ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selected}
                  readOnly
                  className="w-5 h-5 shrink-0 pointer-events-none"
                  aria-label="Выбрать операцию"
                />
              )}
              {/* Category Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: transaction.category?.color || '#E5E7EB' }}
              >
                {transaction.category?.icon || '📌'}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <h3 className="font-medium text-primary flex items-center gap-1.5">
                  <span className="truncate">{transaction.title || transaction.category?.name}</span>
                  {transaction.splitGroupId && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-secondary font-normal"
                      title="Часть операции, разбитой на несколько категорий"
                    >
                      разбито
                    </span>
                  )}
                </h3>
                <p className="text-sm text-secondary truncate">
                  {transaction.title && transaction.category?.name
                    ? `${transaction.category.name} • `
                    : ''}
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
            <div className="text-right shrink-0">
              <p
                className={`text-lg font-bold ${
                  transaction.type === 'income' ? 'text-income' : 'text-expense'
                }`}
              >
                <Amount>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatAmount(Number(transaction.amount))} {transaction.currency}
                </Amount>
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
      </div>
    </div>
  );
};
