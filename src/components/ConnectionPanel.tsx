import type { BleConnectionState } from '../types/dolphin';

type Props = {
  state: BleConnectionState;
  deviceName: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSimulate: () => void;
};

const labels: Record<BleConnectionState, string> = {
  unsupported: 'No soportado',
  disconnected: 'Desconectado',
  connecting: 'Conectando…',
  connected: 'Conectado',
  error: 'Error',
};

export function ConnectionPanel({
  state,
  deviceName,
  error,
  onConnect,
  onDisconnect,
  onSimulate,
}: Props) {
  const busy = state === 'connecting';
  const connected = state === 'connected';
  const canConnect = state === 'disconnected' || state === 'error';

  return (
    <section className="panel connection-panel" aria-label="Conexión BLE">
      <div className="status-row">
        <span className={`status-dot status-${state}`} aria-hidden />
        <div>
          <p className="status-label">{labels[state]}</p>
          <p className="status-meta">
            {connected && deviceName
              ? deviceName
              : 'Flipper Zero · perfil Serial BLE'}
          </p>
        </div>
      </div>

      <div className="actions">
        {connected ? (
          <button type="button" className="btn btn-ghost" onClick={onDisconnect}>
            Desconectar
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConnect}
            disabled={!canConnect || busy}
          >
            {busy ? 'Conectando…' : 'Conectar Flipper'}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onSimulate}>
          Simular pulso
        </button>
      </div>

      {error ? (
        <p className="error-line" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
