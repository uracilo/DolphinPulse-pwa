import { useCallback, useEffect, useRef, useState } from 'react';
import { playPulseSound, unlockPulseSound } from '../audio/pulseSound';
import {
  FlipperBleSession,
  isBluetoothAvailable,
  isWebBluetoothSupported,
} from '../ble/flipperBle';
import { simulateProtecoEvent } from '../ble/parseDolphinJson';
import type { BleConnectionState, DolphinPulseEvent } from '../types/dolphin';

const HISTORY_LIMIT = 80;
const DEBOUNCE_MS = 500;

export function useFlipperBle() {
  const [state, setState] = useState<BleConnectionState>(() =>
    isWebBluetoothSupported() ? 'disconnected' : 'unsupported',
  );
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<DolphinPulseEvent | null>(null);
  const [history, setHistory] = useState<DolphinPulseEvent[]>([]);
  const [pulseToken, setPulseToken] = useState(0);
  const [btAvailable, setBtAvailable] = useState<boolean | null>(null);

  const sessionRef = useRef<FlipperBleSession | null>(null);
  const lastPushRef = useRef<{ code: string; at: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    isBluetoothAvailable().then((ok) => {
      if (!cancelled) setBtAvailable(ok);
    });
    return () => {
      cancelled = true;
      sessionRef.current?.disconnect();
      sessionRef.current = null;
    };
  }, []);

  const pushEvent = useCallback((event: DolphinPulseEvent) => {
    const now = Date.now();
    const prev = lastPushRef.current;
    if (prev && prev.code === event.code && now - prev.at < DEBOUNCE_MS) {
      return;
    }
    lastPushRef.current = { code: event.code, at: now };
    setLatest(event);
    setPulseToken((n) => n + 1);
    setHistory((prevHist) => [event, ...prevHist].slice(0, HISTORY_LIMIT));
    playPulseSound();
  }, []);

  const connect = useCallback(async () => {
    if (!isWebBluetoothSupported()) {
      setState('unsupported');
      setError('Este navegador no soporta Web Bluetooth (p. ej. Safari en iOS). Usa Chrome o Edge.');
      return;
    }

    setError(null);
    setState('connecting');
    await unlockPulseSound();

    try {
      sessionRef.current?.disconnect();
      const session = new FlipperBleSession({
        onEvent: pushEvent,
        onDisconnected: () => {
          setState('disconnected');
          setDeviceName(null);
        },
        onError: (message) => {
          setError(message);
          setState('error');
        },
      });
      sessionRef.current = session;
      const name = await session.connect();
      setDeviceName(name);
      setState('connected');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo conectar al Flipper por BLE.';
      setError(message);
      setState('error');
      setDeviceName(null);
      sessionRef.current = null;
    }
  }, [pushEvent]);

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setDeviceName(null);
    setState(isWebBluetoothSupported() ? 'disconnected' : 'unsupported');
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLatest(null);
  }, []);

  const simulate = useCallback(() => {
    void unlockPulseSound();
    const code = `0x${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .toUpperCase()
      .padStart(6, '0')}`;
    const buttons = ['A', 'B', 'C', 'D'] as const;
    const btn = buttons[Math.floor(Math.random() * buttons.length)];
    pushEvent(simulateProtecoEvent(code, btn));
  }, [pushEvent]);

  return {
    state,
    deviceName,
    error,
    latest,
    history,
    pulseToken,
    btAvailable,
    connect,
    disconnect,
    clearHistory,
    simulate,
  };
}
