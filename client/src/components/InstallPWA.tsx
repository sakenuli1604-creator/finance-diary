import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { isPWAInstalled, canPromptInstall, promptInstallPWA } from '../registerSW';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const InstallPWA: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isPWAInstalled()) return;
    if (localStorage.getItem('pwa-install-dismissed')) return;

    // Событие beforeinstallprompt может прилететь не сразу — подождём немного,
    // а дальше периодически проверяем, появилась ли возможность установки
    const interval = setInterval(() => {
      if (canPromptInstall()) {
        setShowPrompt(true);
        clearInterval(interval);
      }
    }, 1000);

    const timeout = setTimeout(() => clearInterval(interval), 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await promptInstallPWA();
    if (installed) setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="p-4 shadow-lg">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Download className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary mb-1">Установить приложение</h3>
            <p className="text-sm text-secondary mb-3">
              Добавьте на главный экран для быстрого доступа, как обычное приложение
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1">
                Установить
              </Button>
              <Button variant="secondary" onClick={handleDismiss}>
                Позже
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-secondary hover:text-primary shrink-0">
            <X size={20} />
          </button>
        </div>
      </Card>
    </div>
  );
};
