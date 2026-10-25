// Dauerklänge, die laufen, solange der Spieler eine Taste hält:
// Bohrer und Propeller/Triebwerk. Die Graphen werden einmal gebaut und
// nur noch in Lautstärke und Klangfarbe nachgeführt.

import { getContext, noise, osc, gain, filter, clamp } from './engine.js';

const SMOOTH = 0.04;

export function createDrillLoop(out) {
  const c = getContext();

  // Grundbrummen des Motors.
  const motor = osc('sawtooth', 62);
  const motor2 = osc('square', 93);
  const motorLp = filter('lowpass', 700, 2);
  const motorGain = gain(0.35);
  motor.connect(motorLp);
  motor2.connect(motorLp);
  motorLp.connect(motorGain);

  // Gesteinskreischen: Rauschen durch Bandpass.
  const grit = noise(true);
  const gritBp = filter('bandpass', 1400, 1.2);
  const gritGain = gain(0.5);
  grit.connect(gritBp).connect(gritGain);

  // Rattern: Amplitudenmodulation mit ~20 Hz.
  const am = gain(0.6);
  const lfo = osc('square', 19);
  const lfoDepth = gain(0.4);
  lfo.connect(lfoDepth).connect(am.gain);

  const level = gain(0);
  motorGain.connect(am);
  gritGain.connect(am);
  am.connect(level).connect(out);

  [motor, motor2, grit, lfo].forEach((s) => s.start());

  let on = false;
  return {
    set(active, hardness = 0.5) {
      const t = c.currentTime;
      const h = clamp(hardness, 0, 1);
      if (active) {
        motor.frequency.setTargetAtTime(55 + h * 30, t, 0.08);
        motor2.frequency.setTargetAtTime(82 + h * 45, t, 0.08);
        gritBp.frequency.setTargetAtTime(900 + h * 2200, t, 0.08);
        gritGain.gain.setTargetAtTime(0.35 + h * 0.4, t, 0.08);
        lfo.frequency.setTargetAtTime(15 + h * 12, t, 0.08);
      }
      if (active !== on) {
        level.gain.setTargetAtTime(active ? 0.24 : 0, t, active ? SMOOTH : 0.08);
        on = active;
      }
    },
  };
}

export function createThrustLoop(out) {
  const c = getContext();

  // Luftstrom des Propellers.
  const air = noise(true);
  const airLp = filter('lowpass', 900, 0.8);
  const airGain = gain(0.6);
  air.connect(airLp).connect(airGain);

  // Rotorflattern: AM mit ~24 Hz.
  const flutter = gain(0.6);
  const lfo = osc('sine', 24);
  const lfoDepth = gain(0.35);
  lfo.connect(lfoDepth).connect(flutter.gain);

  // Leises Triebwerksbrummen.
  const hum = osc('triangle', 48);
  const humGain = gain(0.25);
  hum.connect(humGain);

  const level = gain(0);
  airGain.connect(flutter);
  humGain.connect(flutter);
  flutter.connect(level).connect(out);

  [air, lfo, hum].forEach((s) => s.start());

  let on = false;
  return {
    set(active) {
      if (active === on) return;
      const t = c.currentTime;
      on = active;
      level.gain.setTargetAtTime(active ? 0.4 : 0, t, active ? SMOOTH : 0.12);
      // Beim Anlaufen dreht der Rotor kurz hoch.
      lfo.frequency.cancelScheduledValues(t);
      lfo.frequency.setValueAtTime(active ? 12 : lfo.frequency.value, t);
      lfo.frequency.linearRampToValueAtTime(active ? 26 : 10, t + 0.3);
      airLp.frequency.setTargetAtTime(active ? 1100 : 500, t, 0.15);
    },
  };
}
