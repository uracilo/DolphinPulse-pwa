/**
 * Short chirp on each RF/fake pulse. Web Audio API — no asset file, works offline.
 * Browsers require a user gesture before audio; call unlockPulseSound() on Connect.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

function chirp(audio: AudioContext, when: number, volume = 0.22): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, when);
  osc.frequency.exponentialRampToValueAtTime(1320, when + 0.08);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(when);
  osc.stop(when + 0.2);
}

/** Call from a click handler (Connect / Simular) so later BLE pulses can beep. */
export async function unlockPulseSound(): Promise<void> {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') {
    try {
      await audio.resume();
    } catch {
      return;
    }
  }
  /* Tiny near-silent blip — required on some mobile browsers to fully unlock. */
  chirp(audio, audio.currentTime, 0.001);
}

export function playPulseSound(): void {
  const audio = getCtx();
  if (!audio) return;

  void (async () => {
    if (audio.state === 'suspended') {
      try {
        await audio.resume();
      } catch {
        return;
      }
    }
    chirp(audio, audio.currentTime, 0.22);
  })();
}
