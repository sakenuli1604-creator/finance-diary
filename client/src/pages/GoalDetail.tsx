import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus, Minus } from 'lucide-react';
import { useGoalsStore } from '../store/goalsStore';
import { useAccountsStore } from '../store/accountsStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { GoalForm } from '../components/goals/GoalForm';

export const GoalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedGoal, fetchGoal, deleteGoal, deposit, withdraw, updateGoal, addGoalItem, removeGoalItem } =
    useGoalsStore();
  const { accounts, fetchAccounts } = useAccountsStore();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGoal(id);
    }
    fetchAccounts();
  }, [id, fetchGoal, fetchAccounts]);

  const didInitAccountSelection = useRef(false);

  useEffect(() => {
    if (didInitAccountSelection.current) return;
    if (accounts.length === 0 || !selectedGoal) return; // ждём пока оба загрузятся

    const linkedAccountExists =
      selectedGoal.accountId && accounts.some((a) => a.id === selectedGoal.accountId);

    setSelectedAccountId(linkedAccountExists ? selectedGoal.accountId! : accounts[0].id);
    didInitAccountSelection.current = true;
  }, [accounts, selectedGoal]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту цель?')) return;

    try {
      setIsDeleting(true);
      await deleteGoal(id!);
      navigate('/goals');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      setIsSaving(true);
      await updateGoal(id!, data);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setIsProcessing(true);
      await deposit(id!, amount, selectedAccountId, selectedItemId || undefined);
      setIsDepositModalOpen(false);
      setAmount(0);
    } catch (error) {
      console.error('Failed to deposit:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsProcessing(true);
      await withdraw(id!, amount, selectedAccountId, selectedItemId || undefined);
      setIsWithdrawModalOpen(false);
      setAmount(0);
    } catch (error) {
      console.error('Failed to withdraw:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      await addGoalItem(id!, newItemName, newItemAmount);
      setIsAddItemModalOpen(false);
      setNewItemName('');
      setNewItemAmount(0);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Удалить этот пункт цели? Накопленное на него спишется из общей суммы.')) return;
    try {
      await removeGoalItem(id!, itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const openDepositModal = (itemId?: string) => {
    setSelectedItemId(itemId || '');
    setIsDepositModalOpen(true);
  };

  const openWithdrawModal = (itemId?: string) => {
    setSelectedItemId(itemId || '');
    setIsWithdrawModalOpen(true);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  if (!selectedGoal) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const progress =
    (Number(selectedGoal.currentAmount) / Number(selectedGoal.targetAmount)) * 100;
  const isCompleted = progress >= 100;
  const remaining = Number(selectedGoal.targetAmount) - Number(selectedGoal.currentAmount);

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/goals')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">
              {selectedGoal.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Main Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl">{selectedGoal.icon || '🎯'}</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                <Edit2 size={18} />
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>

          {isCompleted && (
            <div className="mb-4 bg-income/10 border border-income/20 rounded-lg p-3">
              <p className="text-income font-semibold text-center">
                🎉 Цель достигнута!
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-secondary">Прогресс</span>
              <span className="text-sm font-semibold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-muted-strong rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-secondary mb-1">Накоплено</p>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(Number(selectedGoal.currentAmount))} {selectedGoal.currency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary mb-1">Цель</p>
              <p className="text-2xl font-semibold text-secondary">
                {formatAmount(Number(selectedGoal.targetAmount))} {selectedGoal.currency}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="pt-4 border-t">
              <p className="text-sm text-secondary">
                Осталось накопить:{' '}
                <span className="font-bold text-primary">
                  {formatAmount(remaining)} {selectedGoal.currency}
                </span>
              </p>
            </div>
          )}

          {selectedGoal.deadline && (
            <div className="pt-4 border-t mt-4">
              <p className="text-sm text-secondary">
                Крайний срок:{' '}
                <span className="font-medium">
                  {new Date(selectedGoal.deadline).toLocaleDateString('ru-RU')}
                </span>
              </p>
            </div>
          )}

          {selectedGoal.account && (
            <div className={selectedGoal.deadline ? 'mt-2' : 'pt-4 border-t mt-4'}>
              <p className="text-sm text-secondary">
                Привязанный счёт:{' '}
                <span className="font-medium text-primary">
                  {selectedGoal.account.icon} {selectedGoal.account.name}
                </span>
              </p>
            </div>
          )}
        </Card>

        {/* Items — разбивка цели на несколько вещей */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-primary">Пункты цели</h2>
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus size={16} />
              Добавить пункт
            </button>
          </div>

          {selectedGoal.items.length === 0 ? (
            <p className="text-sm text-secondary">
              Можно разбить эту цель на несколько вещей — например, «Игровой сетап» →
              монитор, клавиатура, мышь — и копить на каждую отдельно, пока не соберётся вся
              цель целиком.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedGoal.items.map((item) => {
                const itemProgress =
                  Number(item.targetAmount) > 0
                    ? (Number(item.currentAmount) / Number(item.targetAmount)) * 100
                    : 0;
                const itemDone = itemProgress >= 100;

                return (
                  <div key={item.id} className="border border-line rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-primary flex items-center gap-2">
                        {item.name}
                        {itemDone && <span className="text-income text-sm">✓</span>}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-secondary hover:text-expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="w-full bg-muted-strong rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          itemDone ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(itemProgress, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">
                        {formatAmount(Number(item.currentAmount))} / {formatAmount(Number(item.targetAmount))} {selectedGoal.currency}
                      </span>
                      {!itemDone && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDepositModal(item.id)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Пополнить
                          </button>
                          {Number(item.currentAmount) > 0 && (
                            <button
                              onClick={() => openWithdrawModal(item.id)}
                              className="text-secondary hover:text-primary font-medium"
                            >
                              Снять
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Actions — общее пополнение доступно только если цель НЕ разбита на пункты */}
        {!isCompleted && selectedGoal.items.length === 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => openDepositModal()}
              className="flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Пополнить
            </Button>
            <Button
              variant="secondary"
              onClick={() => openWithdrawModal()}
              className="flex items-center justify-center gap-2"
              disabled={Number(selectedGoal.currentAmount) === 0}
            >
              <Minus size={20} />
              Снять
            </Button>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Пополнить цель"
      >
        <div className="space-y-4">
          {selectedItemId && (
            <p className="text-sm text-secondary">
              Пункт: <span className="font-medium text-primary">
                {selectedGoal.items.find((i) => i.id === selectedItemId)?.name}
              </span>
            </p>
          )}
          <Input
            type="number"
            label={`Сумма (в валюте счёта${
              selectedAccountId
                ? `, ${accounts.find((a) => a.id === selectedAccountId)?.currency || ''}`
                : ''
            })`}
            placeholder="0"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Списать со счета
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name} ({account.balance}{' '}
                  {account.currency}){account.id === selectedGoal.accountId ? ' — привязан' : ''}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleDeposit}
            fullWidth
            isLoading={isProcessing}
            disabled={!amount || !selectedAccountId}
          >
            Пополнить
          </Button>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Снять средства"
      >
        <div className="space-y-4">
          {selectedItemId && (
            <p className="text-sm text-secondary">
              Пункт: <span className="font-medium text-primary">
                {selectedGoal.items.find((i) => i.id === selectedItemId)?.name}
              </span>
            </p>
          )}
          <Input
            type="number"
            label={`Сумма (в валюте цели, ${selectedGoal.currency})`}
            placeholder="0"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Зачислить на счет
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.icon} {account.name}
                  {account.id === selectedGoal.accountId ? ' — привязан' : ''}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleWithdraw}
            fullWidth
            isLoading={isProcessing}
            disabled={!amount || !selectedAccountId}
          >
            Снять
          </Button>
        </div>
      </Modal>
      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать цель"
      >
        <GoalForm
          onSubmit={handleUpdate}
          isLoading={isSaving}
          hasItems={selectedGoal.items.length > 0}
          initialData={{
            name: selectedGoal.name,
            targetAmount: Number(selectedGoal.targetAmount),
            accountId: selectedGoal.accountId,
            deadline: selectedGoal.deadline?.split('T')[0],
            icon: selectedGoal.icon,
            currency: selectedGoal.currency,
          }}
        />
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Добавить пункт цели"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Input
            label="Название"
            placeholder="Например: Монитор"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="number"
            label="Сколько нужно накопить"
            placeholder="0"
            value={newItemAmount || ''}
            onChange={(e) => setNewItemAmount(parseFloat(e.target.value) || 0)}
            required
          />
          <Button type="submit" fullWidth isLoading={isProcessing}>
            Добавить
          </Button>
        </form>
      </Modal>
    </div>
  );
};
