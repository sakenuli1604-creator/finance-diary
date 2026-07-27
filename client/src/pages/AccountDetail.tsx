import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { useAccountsStore } from '../store/accountsStore';
import { accountsAPI } from '../api/accounts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AccountForm } from '../components/accounts/AccountForm';

export const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedAccount, fetchAccount, updateAccount, deleteAccount } =
    useAccountsStore();

  const [history, setHistory] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccount(id);
      loadHistory(id);
    }
  }, [id, fetchAccount]);

  const loadHistory = async (accountId: string) => {
    try {
      const data = await accountsAPI.getHistory(accountId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      setIsUpdating(true);
      await updateAccount(id!, data);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update account:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот счет?')) return;

    try {
      setIsDeleting(true);
      await deleteAccount(id!);
      navigate('/accounts');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU').format(balance);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedAccount) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/accounts')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedAccount.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: selectedAccount.color || '#E5E7EB' }}
            >
              {selectedAccount.icon || '💳'}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsEditModalOpen(true)}
              >
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

          <p className="text-sm text-gray-600 mb-1">Баланс</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatBalance(Number(selectedAccount.balance))}{' '}
            {selectedAccount.currency}
          </p>
        </Card>

        {/* History */}
        <div>
          <h2 className="text-lg font-semibold mb-3">История операций</h2>
          {history.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Пока нет операций
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-semibold ${
                        Number(item.amount) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {Number(item.amount) >= 0 ? '+' : ''}
                      {formatBalance(Number(item.amount))} {selectedAccount.currency}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать счет"
      >
        <AccountForm
          initialData={{
            name: selectedAccount.name,
            balance: Number(selectedAccount.balance),
            currency: selectedAccount.currency,
            icon: selectedAccount.icon || undefined,
            color: selectedAccount.color || undefined,
          }}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
        />
      </Modal>
    </div>
  );
};
