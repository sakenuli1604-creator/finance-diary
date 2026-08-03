import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useAccountsStore } from '../store/accountsStore';
import { useAuthStore } from '../store/authStore';
import { useExchangeRatesStore } from '../store/exchangeRatesStore';
import { useTransfersStore } from '../store/transfersStore';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountForm } from '../components/accounts/AccountForm';
import { TransferForm } from '../components/transfers/TransferForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { convertAmount } from '../utils/currency';

export const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const {
    accounts,
    isLoading,
    fetchAccounts,
    createAccount,
  } = useAccountsStore();
  const { user } = useAuthStore();
  const { rates, fetchRates } = useExchangeRatesStore();
  const { createTransfer } = useTransfersStore();
  const primaryCurrency = user?.primaryCurrency || '₸';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleCreateAccount = async (data: any) => {
    try {
      setIsCreating(true);
      await createAccount(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTransfer = async (data: Parameters<typeof createTransfer>[0]) => {
    await createTransfer(data);
    setIsTransferModalOpen(false);
    fetchAccounts(); // подтягиваем свежие балансы обоих счетов
  };

  const totalBalance = accounts.reduce(
    (sum, acc) =>
      sum +
      (acc.isActive ? convertAmount(Number(acc.balance), acc.currency, primaryCurrency, rates) : 0),
    0
  );

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU').format(balance);
  };

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Header */}
      <div className="bg-surface border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-secondary hover:text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-primary">Счета</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Total Balance */}
        <Card className="p-6">
          <p className="text-sm text-secondary mb-1">Общий баланс</p>
          <p className="text-3xl font-bold text-primary">
            {formatBalance(totalBalance)} {primaryCurrency}
          </p>
        </Card>

        {/* Add Account / Transfer Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Добавить счет
          </Button>
          {accounts.length >= 2 && (
            <Button
              onClick={() => setIsTransferModalOpen(true)}
              variant="secondary"
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeftRight size={20} />
              Перевод
            </Button>
          )}
        </div>

        {/* Accounts List */}
        {isLoading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary mb-4">У вас пока нет счетов</p>
            <Button onClick={() => setIsModalOpen(true)}>
              Создать первый счет
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={() => navigate(`/accounts/${account.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новый счет"
      >
        <AccountForm onSubmit={handleCreateAccount} isLoading={isCreating} />
      </Modal>

      {/* Transfer Between Accounts Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Перевод между счетами"
      >
        <TransferForm
          accounts={accounts}
          rates={rates}
          onSubmit={handleTransfer}
          onCancel={() => setIsTransferModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
