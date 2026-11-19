import {
  FLIPPER_NAME_PREFIXES,
  FLIPPER_SERIAL_RX,
  FLIPPER_SERIAL_SERVICE,
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
      optionalServices: [FLIPPER_SERIAL_SERVICE],
    });

    if (!device.gatt) {
      throw new Error('El dispositivo no expone GATT.');
    }

    const server = await device.gatt.connect();
    const characteristic = await this.resolveRxCharacteristic(server);

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', this.onValueChanged);
    device.addEventListener('gattserverdisconnected', this.onGattDisconnected);

    this.device = device;
    this.characteristic = characteristic;
    this.lineBuffer.value = '';

    return device.name ?? 'Flipper Zero';
  }

  private async resolveRxCharacteristic(
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    try {
      const service = await server.getPrimaryService(FLIPPER_SERIAL_SERVICE);
      return await service.getCharacteristic(FLIPPER_SERIAL_RX);
    } catch {
      // Fallback: some firmwares/custom builds expose RX under another primary service.
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          return await service.getCharacteristic(FLIPPER_SERIAL_RX);
        } catch {
          // keep looking
        }
      }
      throw new Error(
        'No se encontró el servicio Serial del Flipper. Abre Apps → Sub-GHz → DolphinPulse en el Flipper (con Bluetooth ON) e inténtalo de nuevo.',
      );
    }
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
      this.characteristic?.removeEventListener(
        'characteristicvaluechanged',
        this.onValueChanged,
      );
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
