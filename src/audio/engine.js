// Gemeinsame Web-Audio-Grundlage: AudioContext, Busse und kleine Synth-Helfer.
// Alle Klänge werden zur Laufzeit erzeugt, es gibt keine Audiodateien.

let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuffer = null;

export function getContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();

  // Sanfter Limiter, damit Explosion + Musik + Bohrer nicht übersteuern.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  comp.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.8;
  sfxBus.connect(master);

  musicBus = ctx.createGain();
  musicBus.gain.value = 0.45;
  musicBus.connect(master);

  noiseBuffer = makeNoiseBuffer(ctx, 2);
  return ctx;
}

export const buses = {
  get master() { return master; },
  get sfx() { return sfxBus; },
  get music() { return musicBus; },
};

function makeNoiseBuffer(c, seconds) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Weißes Rauschen als (optional geloopte) Quelle.
export function noise(loop = false) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = loop;
  return src;
}

export function osc(type, freq) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

export function gain(value = 0) {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

export function filter(type, freq, q = 1) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

// Hüllkurve: schneller Anstieg auf peak, exponentielles Abklingen.
export function envelope(param, t, attack, decay, peak = 1) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

// Startet Quellen und räumt sie nach `duration` wieder ab.
export function run(sources, t, duration) {
  for (const s of sources) {
    s.start(t);
    s.stop(t + duration + 0.05);
  }
}

export function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
