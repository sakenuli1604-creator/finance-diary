import React, { useEffect, useState } from 'react';
import { feedAPI } from '../../api/feed';
import { FeedEvent } from '../../types';
import { Card } from '../ui/Card';

const SEVERITY_STYLES: Record<string, string> = {
  success: 'bg-income/10 border-income/30',
  info: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-orange-500/10 border-orange-500/30',
  error: 'bg-expense/10 border-expense/30',
};

interface FeedWidgetProps {
  limit?: number;
}

export const FeedWidget: React.FC<FeedWidgetProps> = ({ limit = 3 }) => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    feedAPI
      .getFeed(limit)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));
  }, [limit]);

  if (isLoading) return null;
  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <Card
          key={event.id}
          className={`p-3 border ${SEVERITY_STYLES[event.severity] || ''}`}
        >
          <div className="flex gap-2 items-start">
            <span className="text-xl shrink-0">{event.icon}</span>
            <div className="min-w-0">
              <p className="font-medium text-sm text-primary">{event.title}</p>
              <p className="text-xs text-secondary line-clamp-2">{event.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
