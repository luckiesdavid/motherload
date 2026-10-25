// Welt: Kachelkarte, Erzeugung und Abfragen.
// Eine Zeile r liegt zwischen y = r*T und (r+1)*T. Zeile 0 ist die Grasnarbe.

import { minerals, artifacts, hazards, world as W } from '../data/index.js';

export const T = 32;                       // Weltpixel pro Feld (= Sprite-Größe)
export const FT = W.tileFeet;              // 12.5 ft pro Feld
export const COLS = W.widthTiles;          // 38
export const BOTTOM = W.bottomRow;         // 584: letzte grabbare Zeile
export const BOSS_TOP = BOTTOM + 1;        // Bossraum (leer)
export const BOSS_BOT = BOTTOM + 12;
export const ROWS = BOSS_BOT + 4;          // darunter Grundgestein

export const E = 0, DIRT = 1, ROCK = 2, LAVA = 3, GAS = 4, GRASS = 5, BED = 6, PAD = 7;
export const ORE = 16;                     // ORE + Index in minerals
export const ART = 40;                     // ART + Index in artifacts

// Gebäude: Spalten c0..c0+3, Sprites 128x96.
export const BUILDINGS = [
  { id: 'fuel',    sprite: 'building_fuel',    c0: 1 },
  { id: 'mineral', sprite: 'building_mineral', c0: 7 },
  { id: 'upgrade', sprite: 'building_upgrade', c0: 21 },
  { id: 'repair',  sprite: 'building_repair',  c0: 27 },
  { id: 'save',    sprite: 'building_save',    c0: 33 },
];
export const START_COL = 15;

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(c, r) {
  let h = (c * 374761393 + r * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const RARITY = [10, 8, 6.5, 5, 4, 3.2, 2.6, 2, 1.6, 1.3];

function oreAt(ft, rnd) {
  let sum = 0;
  const w = minerals.map((m, i) => {
    if (ft < m.minDepth) return 0;
    let v = RARITY[i] ?? 1;
    if (ft < m.commonDepth) v *= 0.25;
    // Billige Erze werden tief unten seltener.
    const over = ft - Math.max(m.commonDepth, 600);
    if (i < 5 && over > 2500) v *= Math.max(0.15, 1 - (over - 2500) / 3000);
    sum += v;
    return v;
  });
  if (sum <= 0) return DIRT;
  let x = rnd() * sum;
  for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return ORE + i; }
  return DIRT;
}

export function padAt(c) {
  return BUILDINGS.some(b => c >= b.c0 && c < b.c0 + 4);
}

export function generate(seed, run = 1) {
  const rnd = mulberry32(seed);
  const m = new Uint8Array(COLS * ROWS);
  const lavaMin = hazards.lava.minDepth + (run > 1 ? 200 : 0);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ft = (r + 1) * FT;
      let t = DIRT;
      if (r > BOSS_BOT) t = BED;
      else if (r >= BOSS_TOP) t = E;
      else if (r === 0) t = padAt(c) ? PAD : GRASS;
      else {
        const f = Math.min(1, ft / 7300);
        const x = rnd();
        let acc = r > 3 ? 0.006 : 0;                                   // Hohlräume
        const rockP = ft >= hazards.rock.minDepth ? 0.03 + 0.11 * f : 0;
        const lavaP = ft >= lavaMin ? 0.012 + 0.025 * f : 0;
        const gasP = ft >= hazards.gas.minDepth ? 0.012 + 0.02 * f : 0;
        const oreP = r < 2 ? 0.05 : 0.09 + 0.05 * f;
        if (x < acc) t = E;
        else if (x < (acc += rockP)) t = ROCK;
        else if (x < (acc += lavaP)) t = LAVA;
        else if (x < (acc += gasP)) t = GAS;
        else if (x < (acc += oreP)) t = oreAt(ft, rnd);
      }
      m[r * COLS + c] = t;
    }
  }
  // Fundstücke an den dokumentierten Tiefen, leicht gestreut.
  artifacts.forEach((a, i) => {
    const depths = [...a.depths, a.depths[0] + 600 + rnd() * 900];
    for (const d of depths) {
      const r = Math.min(BOTTOM, Math.max(2, Math.round(d / FT) + Math.floor(rnd() * 13) - 6));
      const c = Math.floor(rnd() * COLS);
      m[r * COLS + c] = ART + i;
    }
  });
  return m;
}

export class World {
  constructor(map) { this.map = map; }
  get(c, r) {
    if (c < 0 || c >= COLS || r >= ROWS) return BED;
    if (r < 0) return E;
    return this.map[r * COLS + c];
  }
  set(c, r, t) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
    this.map[r * COLS + c] = t;
  }
  solid(c, r) { return this.get(c, r) !== E; }
  drillable(c, r) {
    const t = this.get(c, r);
    return t !== E && t !== ROCK && t !== BED && t !== PAD;
  }
  blastable(c, r) {
    const t = this.get(c, r);
    return t !== E && t !== BED && t !== PAD && r > 0;
  }
}

export function isOre(t) { return t >= ORE && t < ORE + minerals.length; }
export function isArtifact(t) { return t >= ART && t < ART + artifacts.length; }

// Härte: tiefer = zäher, Erze etwas härter.
export function hardness(t, r) {
  const ft = (r + 1) * FT;
  let h = 1 + ft / 5000;
  if (isOre(t)) h += 0.15 + (t - ORE) * 0.06;
  if (t === LAVA) h += 0.4;
  return h;
}

export function encodeMap(map) {
  let s = '';
  for (let i = 0; i < map.length; i += 0x8000) s += String.fromCharCode.apply(null, map.subarray(i, i + 0x8000));
  return btoa(s);
}
export function decodeMap(b64) {
  const s = atob(b64), m = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) m[i] = s.charCodeAt(i);
  return m;
}
