import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus, Minus } from 'lucide-react';
import { useGoalsStore } from '../store/goalsStore';
import { useAccountsStore } from '../store/accountsStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const GoalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedGoal, fetchGoal, deleteGoal, deposit, withdraw } =
    useGoalsStore();
  const { accounts, fetchAccounts } = useAccountsStore();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGoal(id);
    }
    fetchAccounts();
  }, [id, fetchGoal, fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

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

  const handleDeposit = async () => {
    try {
      setIsProcessing(true);
      await deposit(id!, amount, selectedAccountId);
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
      await withdraw(id!, amount, selectedAccountId);
      setIsWithdrawModalOpen(false);
      setAmount(0);
    } catch (error) {
      console.error('Failed to withdraw:', error);
    } finally {
      setIsProcessing(false);
    }
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
              <Button variant="secondary">
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
                {formatAmount(Number(selectedGoal.currentAmount))} ₸
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary mb-1">Цель</p>
              <p className="text-2xl font-semibold text-secondary">
                {formatAmount(Number(selectedGoal.targetAmount))} ₸
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="pt-4 border-t">
              <p className="text-sm text-secondary">
                Осталось накопить:{' '}
                <span className="font-bold text-primary">
                  {formatAmount(remaining)} ₸
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
        </Card>

        {/* Actions */}
        {!isCompleted && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Пополнить
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsWithdrawModalOpen(true)}
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
          <Input
            type="number"
            label="Сумма"
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
                  {account.currency})
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
          <Input
            type="number"
            label="Сумма"
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
    </div>
  );
};
