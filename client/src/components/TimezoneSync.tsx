import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { settingsAPI } from '../api/settings';

// Сообщает серверу часовой пояс устройства, чтобы "сегодня", недельные и месячные бюджеты
// считались по местному времени. Отправляется один раз на пользователя и пояс (повторно — только при смене пояса).
export const TimezoneSync: React.FC = () => {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;

    const key = `tz-synced:${userId}`;
    try {
      if (localStorage.getItem(key) === tz) return;
    } catch {
      return;
    }

    settingsAPI
      .updateProfile({ timezone: tz })
      .then(() => {
        try {
          localStorage.setItem(key, tz);
        } catch {
          /* хранилище недоступно — попробуем в следующий раз */
        }
      })
      .catch((err) => console.error('Timezone sync failed:', err));
  }, [userId]);

  return null;
};
