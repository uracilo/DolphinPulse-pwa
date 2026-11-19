export type BleConnectionState =
  | 'unsupported'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface DolphinPulseEvent {
  id: string;
  app: string;
  protocol: string;
  code: string;
  btn?: string;
  freq: number;
  receivedAt: Date;
  raw: string;
}

export interface ParsedDolphinJson {
  app?: string;
  protocol?: string;
  code?: string;
  btn?: string;
  freq?: number;
}
