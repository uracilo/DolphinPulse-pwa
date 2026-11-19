import type { DolphinPulseEvent } from '../types/dolphin';

type Props = {
  history: DolphinPulseEvent[];
  onClear: () => void;
};

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function HistoryList({ history, onClear }: Props) {
  return (
    <section className="panel history-panel" aria-label="Historial">
      <div className="history-head">
        <h2>Historial</h2>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={onClear}
          disabled={history.length === 0}
        >
          Limpiar
        </button>
      </div>

      {history.length === 0 ? (
        <p className="empty-history">Sin lecturas todavía.</p>
      ) : (
        <ul className="history-list">
          {history.map((item) => (
            <li key={item.id} className="history-item">
              <div>
                <p className="history-code">{item.code}</p>
                <p className="history-meta">
                  {item.protocol}
                  {item.btn ? ` · ${item.btn}` : ''} · {formatTime(item.receivedAt)}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => void copyText(item.code)}
              >
                Copiar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
