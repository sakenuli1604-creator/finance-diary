export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Проверяем обновления раз в час, пока вкладка открыта
          setInterval(() => registration.update(), 60 * 60 * 1000);
        })
        .catch(() => {
          // офлайн-режим — необязательная фича, не мешаем работе приложения
        });
    });
  }
}

export function isPWAInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

let deferredInstallPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

export function canPromptInstall(): boolean {
  return deferredInstallPrompt !== null;
}

export async function promptInstallPWA(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return outcome === 'accepted';
}
