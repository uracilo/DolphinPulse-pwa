import type { DolphinPulseEvent } from '../types/dolphin';

type Props = {
  latest: DolphinPulseEvent | null;
  pulseToken: number;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LiveSignal({ latest, pulseToken }: Props) {
  return (
    <section className="panel live-panel" aria-live="polite">
      <div key={pulseToken} className={`pulse-ring ${latest ? 'pulse-ring-active' : ''}`} />
      <p className="eyebrow">Última señal Proteco</p>
      {latest ? (
        <>
          <p className="code-display">{latest.code}</p>
          <dl className="meta-grid">
            <div>
              <dt>Protocolo</dt>
              <dd>{latest.protocol}</dd>
            </div>
            <div>
              <dt>Botón</dt>
              <dd>{latest.btn ?? '—'}</dd>
            </div>
            <div>
              <dt>Frecuencia</dt>
              <dd>{(latest.freq / 1_000_000).toFixed(2)} MHz</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>{formatTime(latest.receivedAt)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="empty-live">
          Esperando trama… inicia DolphinPulse en el Flipper y pulsa el mando.
        </p>
      )}
    </section>
  );
}
