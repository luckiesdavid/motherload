// Öffentliche Audio-API für Motherload. Siehe README.md in diesem Ordner.
//
//   import { GameAudio } from './audio/index.js';
//   GameAudio.play('ore', { value: 0.8 });
//   GameAudio.setDrilling(true, 0.4);

import { getContext, buses, gain, clamp } from './engine.js';
import { SFX } from './sfx.js';
import { createDrillLoop, createThrustLoop } from './loops.js';
import { createMusic } from './music.js';

const STORAGE_KEY = 'motherload.audio';
const FUEL_BEEP_INTERVAL = 1.4;
const DEFAULT_MAX_DEPTH_FT = 6000;

const settings = loadSettings();
let ready = false;
let drill = null;
let thrust = null;
let music = null;
let musicOut = null;
let wantMusic = false;
let fuelLow = false;
let fuelTimer = null;
let depthTarget = 0;

function loadSettings() {
  const defaults = { muted: false, sfxVolume: 0.8, musicVolume: 0.45 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function saveSettings() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Privater Modus o.ä.: Einstellungen gelten dann nur für diese Sitzung.
  }
}

// Baut den Audio-Graphen beim ersten Bedarf. Liefert false, wenn der Browser
// kein Web Audio kann; dann bleiben alle Aufrufe stille No-ops.
function ensure() {
  if (ready) return true;
  const c = getContext();
  if (!c) return false;
  ready = true;
  applyVolumes(true);
  drill = createDrillLoop(buses.sfx);
  thrust = createThrustLoop(buses.sfx);
  musicOut = gain(0);
  musicOut.connect(buses.music);
  music = createMusic(musicOut);
  music.setDepth(depthTarget);
  if (wantMusic && c.state === 'running') music.start();
  return true;
}

function applyVolumes(immediate = false) {
  const c = getContext();
  const t = c.currentTime;
  const target = settings.muted ? 0 : 0.9;
  if (immediate) buses.master.gain.value = target;
  else buses.master.gain.setTargetAtTime(target, t, 0.03);
  buses.sfx.gain.setTargetAtTime(settings.sfxVolume, t, 0.03);
  buses.music.gain.setTargetAtTime(settings.musicVolume, t, 0.03);
}

function resume() {
  if (!ensure()) return;
  const c = getContext();
  if (c.state === 'suspended') {
    c.resume().then(() => {
      if (wantMusic && !music.playing) music.start();
    });
  } else if (wantMusic && !music.playing) {
    music.start();
  }
}

function startFuelBeeps() {
  if (fuelTimer) return;
  GameAudio.play('fuelWarning');
  fuelTimer = setInterval(() => GameAudio.play('fuelWarning'), FUEL_BEEP_INTERVAL * 1000);
}

function stopFuelBeeps() {
  clearInterval(fuelTimer);
  fuelTimer = null;
}

export const GameAudio = {
  // Muss einmal aus einer Nutzeraktion heraus laufen (Klick/Taste), weil
  // Browser Audio sonst blockieren. Wird zusätzlich automatisch beim ersten
  // keydown/pointerdown aufgerufen.
  unlock() {
    resume();
  },

  // Einmal-Sound abspielen. Namen: siehe GameAudio.sounds.
  play(name, opts) {
    const fn = SFX[name];
    if (!fn) {
      console.warn(`[audio] Unbekannter Sound: ${name}`);
      return;
    }
    if (!ensure() || settings.muted) return;
    if (getContext().state !== 'running') return;
    fn(buses.sfx, opts);
  },

  get sounds() {
    return Object.keys(SFX);
  },

  // Bohrer-Dauerklang. Jeden Frame aufrufen ist ok, es wird nur bei
  // Änderungen nachgeregelt. hardness 0..1 (Erde weich, Fels/tiefe Schichten hart).
  setDrilling(active, hardness = 0.5) {
    if (!ensure()) return;
    drill.set(!!active, hardness);
  },

  // Propeller/Triebwerk beim Fliegen nach oben.
  setThrust(active) {
    if (!ensure()) return;
    thrust.set(!!active);
  },

  // Wiederholter Warnton, solange true.
  setFuelLow(active) {
    active = !!active;
    if (active === fuelLow) return;
    fuelLow = active;
    if (active) startFuelBeeps();
    else stopFuelBeeps();
  },

  // mode: 'surface' | 'underground'. Setzt nur die Startstimmung,
  // danach steuert setDepth die Musik.
  startMusic(mode = 'surface') {
    wantMusic = true;
    if (mode === 'underground' && depthTarget < 0.3) this.setDepth(0.3, 1);
    if (mode === 'surface') this.setDepth(0, 1);
    resume();
  },

  stopMusic() {
    wantMusic = false;
    if (music) music.stop();
  },

  // Aktuelle Tiefe in Fuß, wie im Spiel angezeigt. maxFt ist die Tiefe,
  // ab der die Musik am düstersten ist.
  setDepth(depthFt, maxFt = DEFAULT_MAX_DEPTH_FT) {
    depthTarget = clamp(depthFt / maxFt, 0, 1);
    if (music) music.setDepth(depthTarget);
  },

  // Alles stoppen, was dauerhaft läuft (z.B. bei Game Over oder Pause).
  stopAllLoops() {
    if (drill) drill.set(false);
    if (thrust) thrust.set(false);
    this.setFuelLow(false);
  },

  setMuted(muted) {
    settings.muted = !!muted;
    saveSettings();
    if (ready) applyVolumes();
  },

  toggleMute() {
    this.setMuted(!settings.muted);
    return settings.muted;
  },

  isMuted() {
    return settings.muted;
  },

  setSfxVolume(v) {
    settings.sfxVolume = clamp(v, 0, 1);
    saveSettings();
    if (ready) applyVolumes();
  },

  setMusicVolume(v) {
    settings.musicVolume = clamp(v, 0, 1);
    saveSettings();
    if (ready) applyVolumes();
  },
};

// Automatisches Entsperren und Pausieren bei verstecktem Tab.
if (typeof window !== 'undefined') {
  const unlockOnce = () => GameAudio.unlock();
  window.addEventListener('pointerdown', unlockOnce, { passive: true });
  window.addEventListener('keydown', unlockOnce);

  document.addEventListener('visibilitychange', () => {
    if (!ready) return;
    const c = getContext();
    if (document.hidden) c.suspend();
    else c.resume();
  });
}

export default GameAudio;
