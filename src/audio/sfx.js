// Einmal-Soundeffekte. Jede Funktion plant ihren Klang ab ctx.currentTime
// und hängt ihn an den übergebenen Ausgang (den SFX-Bus).

import { getContext, noise, osc, gain, filter, envelope, run, midiToFreq, clamp } from './engine.js';

// Erz aufgesammelt: zwei helle Glöckchen-Töne. value 0..1 hebt die Tonhöhe,
// so klingt Gold/Diamant "wertvoller" als Kohle.
function ore(out, { value = 0.3 } = {}) {
  const c = getContext();
  const t = c.currentTime;
  const base = 76 + Math.round(clamp(value, 0, 1) * 10);
  [0, 7, 12].forEach((step, i) => {
    const o = osc('triangle', midiToFreq(base + step));
    const g = gain();
    envelope(g.gain, t + i * 0.06, 0.005, 0.25, 0.35);
    o.connect(g).connect(out);
    run([o], t + i * 0.06, 0.3);
  });
  // Kurzes Schaben, wie das Einsaugen in den Laderaum.
  const n = noise();
  const f = filter('bandpass', 3000, 2);
  const g = gain();
  envelope(g.gain, t, 0.005, 0.08, 0.15);
  n.connect(f).connect(g).connect(out);
  run([n], t, 0.1);
}

// Dynamit / C4: Rauschknall mit fallendem Tiefpass und tiefem Sub-Wumms.
function explosion(out, { size = 1 } = {}) {
  const c = getContext();
  const t = c.currentTime;
  const s = clamp(size, 0.3, 2);
  const len = 1.2 + 0.6 * s;

  const n = noise();
  const lp = filter('lowpass', 3500, 0.7);
  lp.frequency.setValueAtTime(3500, t);
  lp.frequency.exponentialRampToValueAtTime(80, t + len);
  const g = gain();
  envelope(g.gain, t, 0.004, len, 1.0 * s);
  n.connect(lp).connect(g).connect(out);

  const sub = osc('sine', 110);
  sub.frequency.setValueAtTime(110, t);
  sub.frequency.exponentialRampToValueAtTime(28, t + 0.6);
  const sg = gain();
  envelope(sg.gain, t, 0.005, 0.7, 0.9 * s);
  sub.connect(sg).connect(out);

  // Nachrieseln von Geröll.
  const debris = noise();
  const hp = filter('highpass', 1800, 0.5);
  const dg = gain();
  dg.gain.setValueAtTime(0.0001, t);
  dg.gain.linearRampToValueAtTime(0.08 * s, t + 0.3);
  dg.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.4);
  debris.connect(hp).connect(dg).connect(out);

  run([n, sub, debris], t, len + 0.5);
}

// Harter Aufprall auf den Boden / Schaden nehmen. intensity 0..1.
function impact(out, { intensity = 0.6 } = {}) {
  const c = getContext();
  const t = c.currentTime;
  const k = clamp(intensity, 0.1, 1);

  const thud = osc('sine', 160);
  thud.frequency.setValueAtTime(160, t);
  thud.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  const tg = gain();
  envelope(tg.gain, t, 0.003, 0.3, 0.9 * k);
  thud.connect(tg).connect(out);

  const n = noise();
  const lp = filter('lowpass', 500 + 1500 * k, 0.8);
  const ng = gain();
  envelope(ng.gain, t, 0.002, 0.15, 0.6 * k);
  n.connect(lp).connect(ng).connect(out);

  // Metallisches Scheppern der Hülle bei stärkeren Treffern.
  const clang = osc('square', 230);
  const bp = filter('bandpass', 900, 8);
  const cg = gain();
  envelope(cg.gain, t, 0.002, 0.2 + 0.2 * k, 0.12 * k);
  clang.connect(bp).connect(cg).connect(out);

  run([thud, n, clang], t, 0.5);
}

// Treibstoff fast leer: zwei kurze Warnpieptöne.
function fuelWarning(out) {
  const c = getContext();
  const t = c.currentTime;
  [0, 0.18].forEach((dt) => {
    const o = osc('square', 980);
    const lp = filter('lowpass', 3000);
    const g = gain();
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.linearRampToValueAtTime(0.18, t + dt + 0.01);
    g.gain.setValueAtTime(0.18, t + dt + 0.1);
    g.gain.linearRampToValueAtTime(0.0001, t + dt + 0.12);
    o.connect(lp).connect(g).connect(out);
    run([o], t + dt, 0.13);
  });
}

// Kauf im Shop: aufsteigendes Dur-Arpeggio plus "Kasse klingelt".
function buy(out) {
  const c = getContext();
  const t = c.currentTime;
  [72, 76, 79, 84].forEach((m, i) => {
    const o = osc('triangle', midiToFreq(m));
    const g = gain();
    envelope(g.gain, t + i * 0.07, 0.005, 0.3, 0.3);
    o.connect(g).connect(out);
    run([o], t + i * 0.07, 0.35);
  });
  const ching = noise();
  const hp = filter('highpass', 6000, 1);
  const g = gain();
  envelope(g.gain, t + 0.28, 0.002, 0.25, 0.2);
  ching.connect(hp).connect(g).connect(out);
  run([ching], t + 0.28, 0.3);
}

// Erze verkauft: Münzregen, Anzahl der Münzen nach count.
function sell(out, { count = 5 } = {}) {
  const c = getContext();
  const t = c.currentTime;
  const n = clamp(Math.round(count), 1, 12);
  for (let i = 0; i < n; i++) {
    const dt = i * 0.055 + Math.random() * 0.02;
    const f = 1800 + Math.random() * 900;
    const o1 = osc('sine', f);
    const o2 = osc('sine', f * 1.5);
    const g = gain();
    envelope(g.gain, t + dt, 0.002, 0.12, 0.16);
    o1.connect(g);
    o2.connect(g);
    g.connect(out);
    run([o1, o2], t + dt, 0.15);
  }
}

// Aktion nicht möglich (zu wenig Geld, Laderaum voll).
function denied(out) {
  const c = getContext();
  const t = c.currentTime;
  [0, 0.14].forEach((dt, i) => {
    const o = osc('square', i ? 140 : 180);
    const lp = filter('lowpass', 1200);
    const g = gain();
    envelope(g.gain, t + dt, 0.005, 0.12, 0.2);
    o.connect(lp).connect(g).connect(out);
    run([o], t + dt, 0.14);
  });
}

// Reparatur / Auftanken: kurze Ratschen-Klicks.
function repair(out) {
  const c = getContext();
  const t = c.currentTime;
  for (let i = 0; i < 6; i++) {
    const n = noise();
    const bp = filter('bandpass', 2500 + i * 150, 6);
    const g = gain();
    envelope(g.gain, t + i * 0.06, 0.001, 0.04, 0.35);
    n.connect(bp).connect(g).connect(out);
    run([n], t + i * 0.06, 0.05);
  }
}

// Teleporter: aufsteigender Sweep mit Vibrato und Funkeln.
function teleport(out) {
  const c = getContext();
  const t = c.currentTime;
  const len = 1.3;

  const o = osc('sawtooth', 120);
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(1800, t + len);
  const lfo = osc('sine', 9);
  const lfoAmt = gain(40);
  lfo.connect(lfoAmt).connect(o.frequency);
  const lp = filter('lowpass', 600, 6);
  lp.frequency.setValueAtTime(600, t);
  lp.frequency.exponentialRampToValueAtTime(6000, t + len);
  const g = gain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.25, t + 0.2);
  g.gain.setValueAtTime(0.25, t + len - 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(lp).connect(g).connect(out);

  for (let i = 0; i < 10; i++) {
    const dt = 0.3 + i * 0.09;
    const s = osc('sine', midiToFreq(84 + ((i * 5) % 12)));
    const sg = gain();
    envelope(sg.gain, t + dt, 0.003, 0.12, 0.1);
    s.connect(sg).connect(out);
    s.start(t + dt);
    s.stop(t + dt + 0.2);
  }
  run([o, lfo], t, len);
}

// Game Over: langsam absteigende, verstimmte Töne und ein letzter Wumms.
function gameOver(out) {
  const c = getContext();
  const t = c.currentTime;
  const notes = [67, 66, 65, 64, 60];
  notes.forEach((m, i) => {
    const dt = i * 0.38;
    const dur = i === notes.length - 1 ? 1.6 : 0.4;
    const a = osc('sawtooth', midiToFreq(m));
    const b = osc('sawtooth', midiToFreq(m) * 1.007);
    if (i === notes.length - 1) {
      a.frequency.setValueAtTime(midiToFreq(m), t + dt);
      a.frequency.linearRampToValueAtTime(midiToFreq(m - 2), t + dt + dur);
      b.frequency.setValueAtTime(midiToFreq(m) * 1.007, t + dt);
      b.frequency.linearRampToValueAtTime(midiToFreq(m - 2), t + dt + dur);
    }
    const lp = filter('lowpass', 1400, 1);
    const g = gain();
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.linearRampToValueAtTime(0.18, t + dt + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + dur);
    a.connect(lp);
    b.connect(lp);
    lp.connect(g).connect(out);
    run([a, b], t + dt, dur);
  });
  const boom = osc('sine', 80);
  boom.frequency.setValueAtTime(80, t + 1.52);
  boom.frequency.exponentialRampToValueAtTime(30, t + 2.6);
  const bg = gain();
  envelope(bg.gain, t + 1.52, 0.01, 1.2, 0.6);
  boom.connect(bg).connect(out);
  run([boom], t + 1.52, 1.3);
}

// UI-Klick für Menüs und Shop-Buttons.
function click(out) {
  const c = getContext();
  const t = c.currentTime;
  const o = osc('square', 1400);
  const g = gain();
  envelope(g.gain, t, 0.001, 0.03, 0.12);
  o.connect(g).connect(out);
  run([o], t, 0.04);
}

export const SFX = {
  ore,
  explosion,
  impact,
  fuelWarning,
  buy,
  sell,
  denied,
  repair,
  teleport,
  gameOver,
  click,
};
