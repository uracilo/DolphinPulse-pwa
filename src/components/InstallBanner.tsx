type Props = {
  installed: boolean;
  canPrompt: boolean;
  hint: string | null;
  onInstall: () => void;
};

export function InstallBanner({ installed, canPrompt, hint, onInstall }: Props) {
  if (installed) {
    return (
      <aside className="notice notice-ok" role="status">
        App instalada. Ábrela desde el icono de inicio y usa <strong>Conectar Flipper</strong>.
      </aside>
    );
  }

  return (
    <aside className="notice notice-install" role="region" aria-label="Instalar PWA">
      <div className="install-row">
        <p>
          En Android abre esta URL en <strong>Chrome</strong> (no el navegador de WhatsApp) y
          instálala para usarla a pantalla completa.
        </p>
        <button type="button" className="btn btn-primary" onClick={onInstall}>
          {canPrompt ? 'Instalar app' : 'Cómo instalar'}
        </button>
      </div>
      {hint ? <p className="install-hint">{hint}</p> : null}
    </aside>
  );
}
