import { $$, byId } from './dom';
import { FINE } from './env';
import { t } from './i18n';
import { on, state } from './state';

/**
 * Procedural WebAudio: an ambient pad plus short UI sounds (tick, whoosh,
 * chime). The AudioContext is created only inside a user click (`unlock`),
 * never on load; `set(false)` fades the master out but keeps the graph.
 */
function createAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let padStarted = false;
  let noise: AudioBuffer | null = null;
  let lastTick = 0;

  /** Must be called synchronously from a user click. */
  function unlock(): boolean {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  }

  function startPad(): void {
    if (padStarted || !ctx || !master) return;
    padStarted = true;
    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    filter.connect(gain).connect(master);
    const voices: [number, number][] = [
      [110, -7],
      [110, 6],
      [164.81, -3],
    ];
    voices.forEach(([hz, cents], index) => {
      const osc = ctx!.createOscillator();
      osc.type = index === 2 ? 'sine' : 'triangle';
      osc.frequency.value = hz;
      osc.detune.value = cents;
      const voiceGain = ctx!.createGain();
      voiceGain.gain.value = index === 2 ? 0.35 : 0.5;
      osc.connect(voiceGain).connect(filter);
      osc.start(now);
    });
    // Slow LFO breathing the filter cutoff.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start(now);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.11;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.015;
    lfo2.connect(lfo2Gain).connect(gain.gain);
    lfo2.start(now);
  }

  function set(enabled: boolean): void {
    if (enabled) {
      if (!unlock()) return;
      startPad();
      const now = ctx!.currentTime;
      master!.gain.cancelScheduledValues(now);
      master!.gain.setValueAtTime(master!.gain.value, now);
      master!.gain.linearRampToValueAtTime(1, now + 1.6);
    } else if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    state.audio = enabled && !!ctx;
    const button = byId('audioBtn');
    button.setAttribute('aria-pressed', String(state.audio));
    button.setAttribute('aria-label', state.audio ? t.sound.on : t.sound.off);
  }

  function tick(): void {
    if (!state.audio || !ctx || !master) return;
    const now = ctx.currentTime;
    if (now - lastTick < 0.05) return;
    lastTick = now;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.04);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  function whoosh(): void {
    if (!state.audio || !ctx || !master) return;
    if (!noise) {
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.value = 1.4;
    bandpass.frequency.setValueAtTime(280, now);
    bandpass.frequency.exponentialRampToValueAtTime(2400, now + 0.32);
    bandpass.frequency.exponentialRampToValueAtTime(380, now + 0.95);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
    source.connect(bandpass).connect(gain).connect(master);
    source.start(now);
    source.stop(now + 1.05);
  }

  /** Two quick bell notes for a found ticket. */
  function chime(): void {
    if (!state.audio || !ctx || !master) return;
    const now = ctx.currentTime;
    const notes: [number, number][] = [
      [1318.5, 0],
      [1760, 0.09],
    ];
    for (const [hz, delay] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.06, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.5);
      osc.connect(gain).connect(master);
      osc.start(now + delay);
      osc.stop(now + delay + 0.55);
    }
  }

  return {
    unlock,
    set,
    tick,
    whoosh,
    chime,
    /** True once an AudioContext exists, which only happens after a click. */
    get unlocked() {
      return ctx !== null;
    },
  };
}

export const audio = createAudio();

/** Binds the toggle and the UI sounds; the world and the ticket hunt call `audio.*` directly. */
export function initAudio(): void {
  byId('audioBtn').addEventListener('click', () => audio.set(!state.audio));
  on('app:navigate', () => audio.whoosh());
  for (const trigger of $$('[data-go]')) trigger.addEventListener('click', () => audio.tick());
  for (const hover of $$('.talk, .seg button, .audio-btn, .pill-btn, .ws-toggle, .tk, .hunt-tab, .surprise-terms, .surprise-back')) {
    hover.addEventListener('mouseenter', () => audio.tick());
  }
  // Project cards: the hover sound only; the background reacts instead of the card.
  if (FINE) for (const card of $$('.card')) card.addEventListener('pointerenter', () => audio.tick());
}
