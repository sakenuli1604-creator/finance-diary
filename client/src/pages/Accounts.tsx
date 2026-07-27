import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAccountsStore } from '../store/accountsStore';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountForm } from '../components/accounts/AccountForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const {
    accounts,
    isLoading,
    fetchAccounts,
    createAccount,
  } = useAccountsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.isActive ? Number(acc.balance) : 0),
    0
  );

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU').format(balance);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Счета</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Total Balance */}
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Общий баланс</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatBalance(totalBalance)} ₸
          </p>
        </Card>

        {/* Add Account Button */}
        <Button
          onClick={() => setIsModalOpen(true)}
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Добавить счет
        </Button>

        {/* Accounts List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">У вас пока нет счетов</p>
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
    </div>
  );
};
