import type { BleConnectionState } from '../types/dolphin';

type Props = {
  state: BleConnectionState;
  btAvailable: boolean | null;
};

export function BrowserSupport({ state, btAvailable }: Props) {
  if (state !== 'unsupported' && btAvailable !== false) {
    return null;
  }

  const isIos =
    typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <aside className="notice notice-warn" role="status">
      <strong>Web Bluetooth no disponible.</strong>{' '}
      {isIos
        ? 'Safari en iOS no implementa Web Bluetooth. Abre DolphinPulse en Chrome o Edge (Android / escritorio) por HTTPS.'
        : 'Usa Chrome o Edge en escritorio/Android, con HTTPS (o localhost).'}
    </aside>
  );
}
