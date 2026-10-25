// Prozedurale Hintergrundmusik: eigene Komposition, kein Original-Track.
// Ein kleiner Sequencer mit Lookahead plant Pad, Bass, Arpeggio und
// Percussion. Die Tiefe (0..1) macht die Musik dunkler, langsamer und karger.

import { getContext, noise, osc, gain, filter, envelope, midiToFreq, clamp } from './engine.js';

const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.12;
const TICK_MS = 25;

// Akkorde als MIDI-Noten. Oberfläche: Am F C G, Tiefe: Am Dm Bb E.
const SURFACE = [
  [57, 60, 64],
  [53, 57, 60],
  [55, 60, 64],
  [55, 59, 62],
];
const DEEP = [
  [57, 60, 64],
  [50, 53, 57],
  [46, 50, 53],
  [52, 56, 59],
];

export function createMusic(out) {
  const c = getContext();

  // Echo für Weite: Delay mit gefiltertem Feedback.
  const delay = c.createDelay(2);
  const fb = gain(0.38);
  const fbLp = filter('lowpass', 2200);
  delay.connect(fbLp).connect(fb).connect(delay);
  const wet = gain(0.5);
  delay.connect(wet).connect(out);

  const padLp = filter('lowpass', 1600, 0.7);
  const padOut = gain(0.5);
  padLp.connect(padOut).connect(out);

  let depth = 0;
  let playing = false;
  let timer = null;
  let step = 0;
  let bar = 0;
  let nextTime = 0;

  function bpm() {
    return 88 - depth * 18;
  }

  function stepDur() {
    return 60 / bpm() / 4;
  }

  function progression() {
    return depth > 0.12 ? DEEP : SURFACE;
  }

  function pad(chord, t, dur) {
    for (const m of chord) {
      for (const detune of [-7, 7]) {
        const o = osc('sawtooth', midiToFreq(m));
        o.detune.value = detune;
        const g = gain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.05, t + dur * 0.3);
        g.gain.setValueAtTime(0.05, t + dur * 0.75);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);
        o.connect(g).connect(padLp);
        o.start(t);
        o.stop(t + dur + 0.5);
      }
    }
  }

  function bass(m, t, dur) {
    const o = osc('triangle', midiToFreq(m - 12));
    const lp = filter('lowpass', 500);
    const g = gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.32, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function pluck(m, t, vol) {
    const o = osc('triangle', midiToFreq(m));
    const g = gain();
    envelope(g.gain, t, 0.004, 0.35, vol);
    o.connect(g);
    g.connect(out);
    g.connect(delay);
    o.start(t);
    o.stop(t + 0.45);
  }

  function kick(t, vol) {
    const o = osc('sine', 120);
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    const g = gain();
    envelope(g.gain, t, 0.002, 0.22, vol);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.3);
  }

  function hat(t, vol) {
    const n = noise();
    const hp = filter('highpass', 7000);
    const g = gain();
    envelope(g.gain, t, 0.001, 0.05, vol);
    n.connect(hp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.08);
  }

  // Wassertropfen in der Höhle, nur in der Tiefe.
  function drip(t) {
    const f = 1200 + Math.random() * 1400;
    const o = osc('sine', f);
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.8, t + 0.06);
    const g = gain();
    envelope(g.gain, t, 0.002, 0.1, 0.06);
    o.connect(g);
    g.connect(out);
    g.connect(delay);
    o.start(t);
    o.stop(t + 0.15);
  }

  function scheduleStep(t) {
    const sd = stepDur();
    const prog = progression();
    const chord = prog[bar % prog.length];
    const root = chord[0];

    if (step === 0) pad(chord, t, sd * STEPS_PER_BAR);

    // Bass: an der Oberfläche synkopiert, in der Tiefe nur Halbe.
    const bassSteps = depth > 0.5 ? [0, 8] : [0, 6, 10];
    if (bassSteps.includes(step)) bass(root, t, sd * 5);

    // Arpeggio über die Akkordtöne, wird mit der Tiefe lichter.
    if (step % 2 === 0) {
      const density = 0.9 - depth * 0.55;
      if (Math.random() < density) {
        const pattern = [0, 1, 2, 1, 2, 0, 2, 1];
        const idx = pattern[(step / 2) % pattern.length];
        const octave = step % 8 === 4 ? 24 : 12;
        pluck(chord[idx] + octave, t, 0.1);
      }
    }

    // Percussion blendet in der Tiefe aus.
    const perc = 1 - depth;
    if (perc > 0.1) {
      if (step === 0 || step === 8) kick(t, 0.35 * perc);
      if (step % 4 === 2) hat(t, 0.05 * perc);
    }
    if (depth > 0.2 && Math.random() < 0.025 + depth * 0.04) drip(t + Math.random() * sd);

    step++;
    if (step >= STEPS_PER_BAR) {
      step = 0;
      bar++;
    }
  }

  function tick() {
    const now = c.currentTime;
    // Nach einem gedrosselten Hintergrund-Tab nicht hinterherhetzen.
    if (nextTime < now - 0.3) nextTime = now + 0.05;
    while (nextTime < now + LOOKAHEAD) {
      scheduleStep(nextTime);
      nextTime += stepDur();
    }
  }

  function applyDepth() {
    const t = c.currentTime;
    padLp.frequency.setTargetAtTime(1800 - depth * 1350, t, 0.8);
    delay.delayTime.setTargetAtTime(stepDur() * 3, t, 0.3);
    fb.gain.setTargetAtTime(0.32 + depth * 0.25, t, 0.5);
  }

  return {
    start() {
      if (playing) return;
      playing = true;
      step = 0;
      bar = 0;
      nextTime = c.currentTime + 0.1;
      applyDepth();
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setTargetAtTime(1, c.currentTime, 0.5);
      timer = setInterval(tick, TICK_MS);
    },
    stop() {
      if (!playing) return;
      playing = false;
      clearInterval(timer);
      timer = null;
      out.gain.setTargetAtTime(0, c.currentTime, 0.3);
    },
    setDepth(d) {
      const nd = clamp(d, 0, 1);
      if (Math.abs(nd - depth) < 0.01) return;
      depth = nd;
      applyDepth();
    },
    get playing() {
      return playing;
    },
  };
}
