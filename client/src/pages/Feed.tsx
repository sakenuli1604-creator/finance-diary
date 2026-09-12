import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { feedAPI } from '../api/feed';
import { FeedEvent } from '../types';
import { Card } from '../components/ui/Card';

const SEVERITY_STYLES: Record<string, string> = {
  success: 'bg-income/10 border-income/30',
  info: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-orange-500/10 border-orange-500/30',
  error: 'bg-expense/10 border-expense/30',
};

export const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await feedAPI.getFeed(30);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
  };

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-app pb-24">
      <div className="bg-surface border-b border-line sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="text-secondary hover:text-primary">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-primary">Лента событий</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-secondary hover:text-primary disabled:opacity-50"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-secondary">Загрузка...</div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-secondary mb-2">Пока нет событий</p>
            <p className="text-sm text-secondary">
              Они появятся по мере того, как вы будете пользоваться приложением
            </p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className={`p-4 border ${SEVERITY_STYLES[event.severity] || ''}`}>
              <div className="flex gap-3">
                <div className="text-3xl shrink-0">{event.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary mb-1">{event.title}</h3>
                  <p className="text-sm text-secondary mb-2">{event.description}</p>
                  <p className="text-xs text-secondary">{formatDate(event.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
