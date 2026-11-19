import { BrowserSupport } from './components/BrowserSupport';
import { ConnectionPanel } from './components/ConnectionPanel';
import { HistoryList } from './components/HistoryList';
import { InstallBanner } from './components/InstallBanner';
import { LiveSignal } from './components/LiveSignal';
import { useFlipperBle } from './hooks/useFlipperBle';
import { usePwaInstall } from './hooks/usePwaInstall';
import { APP_VERSION } from './version';
import './App.css';

export default function App() {
  const ble = useFlipperBle();
  const pwa = usePwaInstall();

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden />
      <div className="wave-grid" aria-hidden />

      <p className="version-badge" aria-label={`Versión ${APP_VERSION}`}>
        v{APP_VERSION}
      </p>

      <header className="hero">
        <p className="brand">DolphinPulse</p>
        <h1>Pulso RF Proteco, en vivo</h1>
        <p className="lede">
          Flipper Zero escucha 433.92 MHz y empuja cada código por BLE a esta PWA.
        </p>
      </header>

      <InstallBanner
        installed={pwa.installed}
        canPrompt={pwa.canPrompt}
        hint={pwa.hint}
        onInstall={() => void pwa.install()}
      />

      <BrowserSupport state={ble.state} btAvailable={ble.btAvailable} />

      <main className="layout">
        <ConnectionPanel
          state={ble.state}
          deviceName={ble.deviceName}
          error={ble.error}
          onConnect={() => void ble.connect()}
          onDisconnect={ble.disconnect}
          onSimulate={ble.simulate}
        />
        <LiveSignal latest={ble.latest} pulseToken={ble.pulseToken} />
        <HistoryList history={ble.history} onClear={ble.clearHistory} />
      </main>

      <footer className="footer">
        <span>HTTPS + Chrome/Edge · Web Bluetooth Serial</span>
        <span>433.92 MHz · AM650 · Proteco</span>
      </footer>
    </div>
  );
}
