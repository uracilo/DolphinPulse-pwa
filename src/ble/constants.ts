/**
 * Flipper Zero BLE Serial GATT layout (official mobile-app / serial profile).
 *
 * SERVICE is the GATT service. The 19ed82ae-* values are characteristics,
 * not the service — using 19ed…60 as service UUID causes:
 * "No Services matching UUID … found in Device."
 */
export const FLIPPER_SERIAL_SERVICE = '8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000';
export const FLIPPER_SERIAL_RX = '19ed82ae-ed21-4c9d-4145-228e61fe0000';
export const FLIPPER_SERIAL_TX = '19ed82ae-ed21-4c9d-4145-228e62fe0000';
export const FLIPPER_SERIAL_OVERFLOW = '19ed82ae-ed21-4c9d-4145-228e63fe0000';
export const FLIPPER_SERIAL_RPC_STATE = '19ed82ae-ed21-4c9d-4145-228e64fe0000';

/** Name prefixes commonly advertised by Flipper Zero. */
export const FLIPPER_NAME_PREFIXES = ['Flipper', 'flipper'] as const;
