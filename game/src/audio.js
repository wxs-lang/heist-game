// Tiny synthesised sound: no audio files, no network, just an oscillator.
// Created lazily on the first user gesture; every call is guarded so a
// browser without audio never breaks the game.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  function blip(frequency, duration, type, gainValue, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const start = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Sound is garnish; silence never stops the heist.
    }
  }

  return {
    unlock() {
      ensure();
    },
    pickup() {
      blip(880, 0.16, 'sine', 0.12);
      blip(1320, 0.22, 'sine', 0.09, 0.07);
    },
    coin() {
      blip(2400, 0.07, 'square', 0.05);
      blip(1900, 0.09, 'square', 0.04, 0.06);
    },
    crack() {
      blip(520, 0.1, 'triangle', 0.1);
      blip(780, 0.14, 'triangle', 0.08, 0.09);
    },
    alarm() {
      blip(620, 0.18, 'sawtooth', 0.06);
      blip(620, 0.18, 'sawtooth', 0.06, 0.22);
    },
    caught() {
      blip(220, 0.4, 'sawtooth', 0.1);
      blip(147, 0.5, 'sawtooth', 0.1, 0.15);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'sine', 0.1, i * 0.11));
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
