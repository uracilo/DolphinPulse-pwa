import {
  FLIPPER_NAME_PREFIXES,
  FLIPPER_SERIAL_OVERFLOW,
  FLIPPER_SERIAL_RPC_STATE,
  FLIPPER_SERIAL_RX,
  FLIPPER_SERIAL_SERVICE,
  FLIPPER_SERIAL_TX,
} from './constants';
import { consumeDolphinLines } from './parseDolphinJson';
import type { DolphinPulseEvent } from '../types/dolphin';

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

export async function isBluetoothAvailable(): Promise<boolean> {
  if (!isWebBluetoothSupported()) return false;
  try {
    return await navigator.bluetooth!.getAvailability();
  } catch {
    return false;
  }
}

export type FlipperBleHandlers = {
  onEvent: (event: DolphinPulseEvent) => void;
  onDisconnected: () => void;
  onError: (message: string) => void;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Flipper firmware names:
 *   TX (...61) = INDICATE  → phone receives (our "RX")
 *   RX (...62) = WRITE     → phone transmits
 * Phone-facing aliases in constants keep RX=61.
 */
async function enableReceive(
  service: BluetoothRemoteGATTService,
): Promise<BluetoothRemoteGATTCharacteristic> {
  const prefer = [FLIPPER_SERIAL_RX, FLIPPER_SERIAL_TX];
  let lastErr: unknown;

  for (const uuid of prefer) {
    try {
      const ch = await service.getCharacteristic(uuid);
      const canSubscribe = ch.properties.notify || ch.properties.indicate;
      if (!canSubscribe) continue;

      /* Touch the char first — forces pairing/encryption when AUTHEN is required. */
      if (ch.properties.read) {
        try {
          await ch.readValue();
        } catch {
          /* pairing dialog may still proceed */
        }
        await sleep(250);
      }

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await ch.startNotifications();
          /* Nudge Flipper's write characteristic — helps settle AUTHEN/CCCD. */
          try {
            const writeCh = await service.getCharacteristic(FLIPPER_SERIAL_TX);
            const ping = new Uint8Array([0x0a]);
            if (writeCh.properties.writeWithoutResponse) {
              await writeCh.writeValueWithoutResponse(ping);
            } else if (writeCh.properties.write) {
              await writeCh.writeValue(ping);
            }
          } catch {
            /* optional */
          }
          return ch;
        } catch (err) {
          lastErr = err;
          await sleep(200 * (attempt + 1));
        }
      }
    } catch (err) {
      lastErr = err;
    }
  }

  const detail = lastErr instanceof Error ? lastErr.message : String(lastErr ?? '');
  throw new Error(
    `GATT falló al suscribir el Serial (${detail}). ` +
      'En el Flipper abre DolphinPulse → Test PWA (BLE advertising). ' +
      'Si sale un PIN, acéptalo. En el teléfono: Ajustes → Bluetooth → olvida el Flipper y reintenta en Chrome.',
  );
}

export class FlipperBleSession {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private lineBuffer = { value: '' };
  private decoder = new TextDecoder('utf-8');
  private handlers: FlipperBleHandlers;
  private onValueChanged = (ev: Event) => {
    const target = ev.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    const text = this.decoder.decode(target.value, { stream: true });
    const events = consumeDolphinLines(text, this.lineBuffer);
    for (const event of events) {
      this.handlers.onEvent(event);
    }
  };
  private onGattDisconnected = () => {
    this.cleanupListeners();
    this.handlers.onDisconnected();
  };

  constructor(handlers: FlipperBleHandlers) {
    this.handlers = handlers;
  }

  async connect(): Promise<string> {
    if (!isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth no está disponible en este navegador.');
    }

    const device = await navigator.bluetooth!.requestDevice({
      filters: FLIPPER_NAME_PREFIXES.map((namePrefix) => ({ namePrefix })),
      optionalServices: [
        FLIPPER_SERIAL_SERVICE,
        FLIPPER_SERIAL_RX,
        FLIPPER_SERIAL_TX,
        FLIPPER_SERIAL_OVERFLOW,
        FLIPPER_SERIAL_RPC_STATE,
        'battery_service',
        'device_information',
      ],
    });

    if (!device.gatt) {
      throw new Error('El dispositivo no expone GATT.');
    }

    /* Drop stale links before a clean connect. */
    if (device.gatt.connected) {
      try {
        device.gatt.disconnect();
      } catch {
        /* ignore */
      }
      await sleep(400);
    }

    let server: BluetoothRemoteGATTServer | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        server = await device.gatt.connect();
        break;
      } catch (err) {
        if (attempt === 2) {
          const detail = err instanceof Error ? err.message : 'GATT connect failed';
          throw new Error(
            `${detail}. Abre Test PWA en el Flipper y vuelve a conectar (PIN si aparece).`,
          );
        }
        await sleep(500);
      }
    }
    if (!server) {
      throw new Error('No se pudo abrir GATT.');
    }

    await sleep(350);

    /* Warm discovery — reduces "GATT operation failed" on first service lookup. */
    try {
      await server.getPrimaryServices();
    } catch {
      await sleep(400);
    }

    const service = await this.resolveSerialService(server);
    const characteristic = await enableReceive(service);

    characteristic.addEventListener('characteristicvaluechanged', this.onValueChanged);
    device.addEventListener('gattserverdisconnected', this.onGattDisconnected);

    this.device = device;
    this.characteristic = characteristic;
    this.lineBuffer.value = '';

    return device.name ?? 'Flipper Zero';
  }

  private async resolveSerialService(
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTService> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await server.getPrimaryService(FLIPPER_SERIAL_SERVICE);
      } catch {
        await sleep(300 * (attempt + 1));
      }
    }

    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        await service.getCharacteristic(FLIPPER_SERIAL_RX);
        return service;
      } catch {
        try {
          await service.getCharacteristic(FLIPPER_SERIAL_TX);
          return service;
        } catch {
          /* keep looking */
        }
      }
    }

    throw new Error(
      'No está el servicio Serial. En el Flipper: DolphinPulse → Test PWA (debe decir BLE: advertising) y Conectar de nuevo.',
    );
  }

  disconnect(): void {
    try {
      this.cleanupListeners();
      this.device?.gatt?.disconnect();
    } catch {
      // ignore
    } finally {
      this.device = null;
      this.characteristic = null;
      this.lineBuffer.value = '';
    }
  }

  private cleanupListeners(): void {
    try {
      if (this.characteristic) {
        this.characteristic.removeEventListener(
          'characteristicvaluechanged',
          this.onValueChanged,
        );
        void this.characteristic.stopNotifications().catch(() => undefined);
      }
    } catch {
      // ignore
    }
    try {
      this.device?.removeEventListener('gattserverdisconnected', this.onGattDisconnected);
    } catch {
      // ignore
    }
  }
}
