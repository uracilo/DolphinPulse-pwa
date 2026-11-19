/**
 * Flipper Zero BLE Serial profile UUIDs.
 * RX = Flipper → host (notifications we subscribe to)
 * TX = host → Flipper (writes; unused by DolphinPulse PWA for now)
 */
export const FLIPPER_SERIAL_SERVICE = '19ed82ae-ed21-4c9d-4145-228e60fe0000';
export const FLIPPER_SERIAL_RX = '19ed82ae-ed21-4c9d-4145-228e61fe0000';
export const FLIPPER_SERIAL_TX = '19ed82ae-ed21-4c9d-4145-228e62fe0000';

/** Name prefixes commonly advertised by Flipper Zero. */
export const FLIPPER_NAME_PREFIXES = ['Flipper', 'flipper'] as const;
