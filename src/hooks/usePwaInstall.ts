import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setHint(null);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setHint(null);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferred(null);
      return;
    }

    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua);
    const isSamsung = /SamsungBrowser/i.test(ua);

    if (isAndroid && (isChrome || isSamsung)) {
      setHint(
        'En Chrome: menú ⋮ → “Instalar app” o “Añadir a la pantalla de inicio”. Ábrela en Chrome (no en WhatsApp/Telegram).',
      );
    } else if (isAndroid) {
      setHint('Abre https://uracilo.github.io/DolphinPulse-pwa/ en Chrome para poder instalarla.');
    } else {
      setHint('En escritorio usa Chrome/Edge → icono de instalar en la barra de direcciones.');
    }
  }, [deferred]);

  return {
    canPrompt: Boolean(deferred),
    installed,
    hint,
    install,
  };
}
