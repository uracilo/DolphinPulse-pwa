/**
 * Flipper Zero BLE Serial GATT layout (official serial profile).
 *
 * Firmware naming (Flipper side):
 *   TX ...61 = INDICATE (Flipper → phone)  ← phone must subscribe here
 *   RX ...62 = WRITE    (phone → Flipper)
 *
 * Phone-facing names below: RX = receive from Flipper = firmware TX (...61).
 */
export const FLIPPER_SERIAL_SERVICE = '8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000';
/** Receive from Flipper (firmware TX, INDICATE). */
export const FLIPPER_SERIAL_RX = '19ed82ae-ed21-4c9d-4145-228e61fe0000';
/** Write to Flipper (firmware RX). */
export const FLIPPER_SERIAL_TX = '19ed82ae-ed21-4c9d-4145-228e62fe0000';
export const FLIPPER_SERIAL_OVERFLOW = '19ed82ae-ed21-4c9d-4145-228e63fe0000';
export const FLIPPER_SERIAL_RPC_STATE = '19ed82ae-ed21-4c9d-4145-228e64fe0000';

/** Name prefixes commonly advertised by Flipper Zero. */
export const FLIPPER_NAME_PREFIXES = ['Flipper', 'flipper'] as const;
