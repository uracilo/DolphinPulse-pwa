import type { DolphinPulseEvent, ParsedDolphinJson } from '../types/dolphin';

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Extract zero or more DolphinPulse JSON objects from a BLE text chunk.
 * Supports fragmented packets by using an external line buffer.
 */
export function consumeDolphinLines(
  chunk: string,
  lineBuffer: { value: string },
): DolphinPulseEvent[] {
  lineBuffer.value += chunk;
  const parts = lineBuffer.value.split(/\r?\n/);
  lineBuffer.value = parts.pop() ?? '';

  const events: DolphinPulseEvent[] = [];
  for (const line of parts) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed) as ParsedDolphinJson;
      if (!parsed.code || !parsed.protocol) continue;
      if (parsed.app && parsed.app !== 'DolphinPulse') continue;

      events.push({
        id: makeId(),
        app: parsed.app ?? 'DolphinPulse',
        protocol: parsed.protocol,
        code: normalizeCode(parsed.code),
        btn: parsed.btn,
        freq: typeof parsed.freq === 'number' ? parsed.freq : 433920000,
        receivedAt: new Date(),
        raw: trimmed,
      });
    } catch {
      // Ignore non-JSON noise on the serial characteristic.
    }
  }
  return events;
}

function normalizeCode(code: string): string {
  const cleaned = code.trim();
  if (/^0x/i.test(cleaned)) {
    return `0x${cleaned.slice(2).toUpperCase()}`;
  }
  if (/^[0-9a-f]+$/i.test(cleaned)) {
    return `0x${cleaned.toUpperCase()}`;
  }
  return cleaned;
}

/** Build a synthetic event for UI demos without a Flipper attached. */
export function simulateProtecoEvent(code = '0x1A2B3C', btn = 'A'): DolphinPulseEvent {
  return {
    id: makeId(),
    app: 'DolphinPulse',
    protocol: 'Proteco',
    code: normalizeCode(code),
    btn,
    freq: 433920000,
    receivedAt: new Date(),
    raw: JSON.stringify({
      app: 'DolphinPulse',
      protocol: 'Proteco',
      code: normalizeCode(code),
      btn,
      freq: 433920000,
    }),
  };
}
