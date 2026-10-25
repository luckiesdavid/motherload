// Spiellogik: Pod-Physik, Bohren, Gefahren, Items, Story, Endkampf, Speichern.
// Der Zustand `state` ist das gemeinsame Objekt mit der UI (siehe src/ui).

import * as D from '../data/index.js';
import {
  T, FT, COLS, ROWS, BOTTOM, BOSS_TOP, BOSS_BOT, BUILDINGS, START_COL,
  E, DIRT, ROCK, LAVA, GAS, ORE, ART, World, generate, hardness, isOre, isArtifact,
  encodeMap, decodeMap, mulberry32,
} from './world.js';

export const SAVE_KEY = 'motherload.save.v1';
export const PW = 26, PH = 26, HW = PW / 2, HH = PH / 2;
const G = 760;
const FALL_SAFE = 520;          // px/s Aufprall ohne Schaden
const FUEL_IDLE = 0.015, FUEL_MOVE = 0.05, FUEL_FLY = 0.09, FUEL_DRILL = 0.08; // L/s

const UPGRADE_KEYS = ['drill', 'hull', 'engine', 'fuel', 'radiator', 'cargo'];

export function getStats(state) {
  const u = state.upgrades, U = D.upgrades;
  const lv = (k) => U[k][Math.min(u[k] | 0, U[k].length - 1)].value;
  return { drill: lv('drill'), hullMax: lv('hull'), hp: lv('engine'), fuelMax: lv('fuel'),
           radiator: lv('radiator'), cargoMax: lv('cargo') };
}

export function cargoCount(state) {
  let n = 0;
  for (const k in state.cargo) n += state.cargo[k];
  return n;
}
export function cargoWeight(state) {
  let kg = 0;
  for (const m of D.minerals) kg += (state.cargo[m.id] || 0) * m.weight;
  return kg;
}

function freshState(run) {
  const s = {
    money: D.start.money, depth: 0, fuel: D.start.fuel, hull: D.start.hull,
    upgrades: Object.fromEntries(UPGRADE_KEYS.map(k => [k, 0])),
    cargo: {},
    items: {}, seenStory: [],
    score: 0, run, priceDivisor: run, artifactsFound: {}, maxDepth: 0,
  };
  return s;
}

export class Game {
  constructor(hooks) {
    this.hooks = hooks;            // { message, building, gameOver, victory, toast, sound(name,opts) }
    this.fx = [];
    this.shake = 0;
    this.newGame();
  }

  // ---------- Spielstart / Speichern ----------
  // initial: frischer State aus der UI (transactions.createState), wird übernommen.
  newGame(run = 1, carry = null, initial = null) {
    this.seed = (Math.random() * 2 ** 31) | 0;
    this.run = run;
    this.world = new World(generate(this.seed, run));
    this.state = Object.assign(freshState(run), initial || {});
    if (carry) {
      Object.assign(this.state, { money: carry.money, upgrades: { ...carry.upgrades }, items: { ...carry.items }, score: carry.score });
      const st = getStats(this.state);
      this.state.fuel = st.fuelMax; this.state.hull = st.hullMax;
    }
    this.seen = {};
    this.guardian = false;
    this.time = 0;
    this.resetPod(START_COL * T + T / 2);
    this.boss = null;
    this.bossDone = false;
    this.lock = null;
    this.fx.length = 0;
    this.derive();
  }

  resetPod(x) {
    this.p = { x, y: -HH - 0.01, vx: 0, vy: 0, facing: 1, grounded: true, drill: null,
               dead: false, deadT: 0, thrusting: false, moving: false, touchL: false, touchR: false,
               anim: 0, hitCd: 0 };
  }

  toSave() {
    const p = this.p;
    return JSON.stringify({
      v: 1, seed: this.seed, run: this.run, map: encodeMap(this.world.map), state: this.state,
      pod: { x: p.x, y: p.y, facing: p.facing }, seen: this.seen, guardian: this.guardian,
      bossDone: this.bossDone, time: this.time,
    });
  }

  fromSave(json) {
    const d = typeof json === 'string' ? JSON.parse(json) : json;
    if (!d || d.v !== 1) throw new Error('Unbekannter Spielstand');
    this.seed = d.seed; this.run = d.run || 1;
    this.world = new World(decodeMap(d.map));
    this.state = Object.assign(freshState(this.run), d.state);
    this.seen = d.seen || {};
    this.guardian = !!d.guardian;
    this.bossDone = !!d.bossDone;
    this.time = d.time || 0;
    this.resetPod(d.pod.x);
    this.p.y = d.pod.y; this.p.facing = d.pod.facing || 1;
    this.boss = null; this.lock = null; this.fx.length = 0;
    this.derive();
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, this.toSave()); return true; } catch { return false; }
  }
  static hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  }
  load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch { /* blockiert */ }
    if (!raw) return false;
    try { this.fromSave(raw); return true; } catch { return false; }
  }

  // ---------- Abgeleitete Werte für HUD ----------
  derive() {
    const s = this.state, p = this.p, st = getStats(s);
    const depthFt = (p.y + HH) / T * FT;
    s.depth = Math.max(0, Math.round(depthFt));
    s.altitude = Math.max(0, Math.round(-depthFt));
    s.maxDepth = Math.max(s.maxDepth || 0, s.depth);
    s.fuelMax = st.fuelMax; s.hullMax = st.hullMax; s.cargoMax = st.cargoMax;
    s.cargoCount = cargoCount(s); s.cargoWeight = cargoWeight(s);
    s.temperature = Math.round(20 + s.depth * 0.11);
    const inBoss = p.y > BOSS_TOP * T;
    s.depthGlitch = s.depth >= D.world.altimeterGlitchDepth && !inBoss;
    const n = (v) => v.toLocaleString('de-DE');
    s.depthDisplay = inBoss ? '-' + n(D.world.bossDisplayedDepth) : s.depthGlitch ? '-' + glitch(s.depth, this.time) : (s.depth ? '-' + n(s.depth) : n(s.altitude));
    s.boss = this.boss && !this.boss.dead ? { name: D.boss.phases[this.boss.phase].name, hp: this.boss.hp, hpMax: this.boss.hpMax } : null;
  }

  // ---------- Hauptschleife ----------
  update(dt, inp) {
    const p = this.p, s = this.state, st = getStats(s);
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 2.5);
    if (p.dead) {
      p.deadT += dt;
      if (p.deadT > 1.6 && !p.reported) { p.reported = true; this.hooks.gameOver(p.deadReason); }
      this.updateFx(dt);
      return;
    }
    p.thrusting = false; p.moving = false;
    p.hitCd = Math.max(0, p.hitCd - dt);
    let fuelRate = FUEL_IDLE;
    if (p.drill) {
      this.advanceDrill(dt, st);
      fuelRate += FUEL_DRILL;
    } else {
      this.physics(dt, inp, st);
      if (p.thrusting) fuelRate += FUEL_FLY; else if (p.moving) fuelRate += FUEL_MOVE;
      if (!p.dead) this.tryDrill(inp, st);
    }
    p.anim += dt;
    if (!p.dead) {
      s.fuel = Math.max(0, Math.min(st.fuelMax, s.fuel - fuelRate * dt));
      if (s.fuel <= 0) this.die('Dir ist der Treibstoff ausgegangen.');
    }
    this.derive();
    this.checkStory();
    this.updateBoss(dt);
    this.checkBuildings();
    this.updateFx(dt);
  }

  physics(dt, inp, st) {
    const p = this.p, w = this.world;
    const mf = 1 + cargoWeight(this.state) / (st.hp * 6);
    const acc = 900 / mf, vmax = 170 + (st.hp - 150) * 1.3;
    if (inp.left && !inp.right) { p.vx -= acc * dt; p.facing = -1; p.moving = true; }
    else if (inp.right && !inp.left) { p.vx += acc * dt; p.facing = 1; p.moving = true; }
    else {
      const fr = (p.grounded ? 1300 : 260) * dt;
      p.vx = Math.abs(p.vx) <= fr ? 0 : p.vx - Math.sign(p.vx) * fr;
    }
    p.vx = Math.max(-vmax, Math.min(vmax, p.vx));
    let ay = G;
    if (inp.up) {
      const thrust = G + 330 + (st.hp - 150) * 11;
      ay = -(thrust - G) / mf;
      p.thrusting = true;
    }
    p.vy += ay * dt;
    const vup = 270 + (st.hp - 150) * 2.2;
    p.vy = Math.max(-vup, Math.min(780, p.vy));

    p.grounded = false; p.touchL = false; p.touchR = false;
    let impact = 0;
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      p.x += p.vx * dt / steps;
      // Seitenkollision
      const top = Math.floor((p.y - HH + 0.01) / T), bot = Math.floor((p.y + HH - 0.01) / T);
      if (p.vx > 0) {
        const c = Math.floor((p.x + HW) / T);
        for (let r = top; r <= bot; r++) if (w.solid(c, r)) { p.x = c * T - HW - 0.01; p.vx = 0; p.touchR = true; break; }
      } else if (p.vx < 0) {
        const c = Math.floor((p.x - HW) / T);
        for (let r = top; r <= bot; r++) if (w.solid(c, r)) { p.x = (c + 1) * T + HW + 0.01; p.vx = 0; p.touchL = true; break; }
      }
      p.y += p.vy * dt / steps;
      const l = Math.floor((p.x - HW + 0.01) / T), rr = Math.floor((p.x + HW - 0.01) / T);
      if (p.vy > 0) {
        const r = Math.floor((p.y + HH) / T);
        for (let c = l; c <= rr; c++) if (w.solid(c, r)) { p.y = r * T - HH - 0.01; impact = Math.max(impact, p.vy); p.vy = 0; p.grounded = true; break; }
      } else if (p.vy < 0) {
        const r = Math.floor((p.y - HH) / T);
        for (let c = l; c <= rr; c++) if (w.solid(c, r)) { p.y = (r + 1) * T + HH + 0.01; p.vy = 0; break; }
      }
    }
    // Wenn gegen eine Wand gedrückt wird, ohne Geschwindigkeit: Kontakt prüfen.
    if (!p.touchR && inp.right) p.touchR = this.wallAt(1);
    if (!p.touchL && inp.left) p.touchL = this.wallAt(-1);
    if (!p.grounded && p.vy >= 0) {
      const r = Math.floor((p.y + HH + 1) / T);
      const l = Math.floor((p.x - HW + 0.01) / T), rr = Math.floor((p.x + HW - 0.01) / T);
      for (let c = l; c <= rr; c++) if (w.solid(c, r) && (p.y + HH) > r * T - 0.5) p.grounded = true;
    }
    if (impact > FALL_SAFE) {
      const dmg = (impact - FALL_SAFE) / 50;
      this.hooks.sound('impact', { intensity: Math.min(1, dmg / 10) });
      this.damage(dmg, 'fall');
    }
  }

  wallAt(dir) {
    const p = this.p;
    const c = Math.floor((p.x + dir * (HW + 1)) / T), r = Math.floor(p.y / T);
    return this.world.solid(c, r);
  }

  tryDrill(inp, st) {
    const p = this.p, w = this.world;
    if (!p.grounded || inp.up) return;
    if (inp.down) {
      const c = Math.floor(p.x / T), r = Math.floor((p.y + HH + 2) / T);
      if (w.drillable(c, r)) return this.startDrill(c, r, 'down', st);
    }
    const r = Math.floor(p.y / T);
    if (inp.right && !inp.left && p.touchR) {
      const c = Math.floor((p.x + HW + 2) / T);
      if (w.drillable(c, r)) return this.startDrill(c, r, 'side', st, 1);
    }
    if (inp.left && !inp.right && p.touchL) {
      const c = Math.floor((p.x - HW - 2) / T);
      if (w.drillable(c, r)) return this.startDrill(c, r, 'side', st, -1);
    }
  }

  startDrill(c, r, dir, st, facing) {
    const p = this.p, t = this.world.get(c, r);
    const dur = (FT / st.drill) * hardness(t, r);
    p.drill = { c, r, t, dir, k: 0, dur, x0: p.x, y0: p.y, x1: c * T + T / 2, y1: (r + 1) * T - HH - 0.01, hits: 0, gas: false };
    if (facing) p.facing = facing;
    p.vx = 0; p.vy = 0;
  }

  advanceDrill(dt, st) {
    const p = this.p, d = p.drill;
    d.k = Math.min(1, d.k + dt / d.dur);
    const e = d.k;
    p.x = d.x0 + (d.x1 - d.x0) * e;
    p.y = d.y0 + (d.y1 - d.y0) * e;
    if (Math.random() < dt * 22) {
      const tipX = d.dir === 'down' ? p.x : p.x + p.facing * HW;
      const tipY = d.dir === 'down' ? p.y + HH : p.y + 4;
      this.fx.push({ type: 'dust', x: tipX, y: tipY, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, t: 0, life: 0.45 });
    }
    const cur = this.world.get(d.c, d.r);
    if (cur === LAVA) {
      if ((d.k >= 0.15 && d.hits === 0) || (d.k >= 0.6 && d.hits === 1)) {
        d.hits++;
        this.damage(D.hazards.lava.damage, 'lava');
        this.fx.push({ type: 'text', x: p.x, y: p.y - 20, text: 'LAVA!', color: '#ff7a2a', t: 0, life: 1 });
        for (let i = 0; i < 8; i++) this.fx.push({ type: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 220, t: 0, life: 0.7, color: '#ff8a1e' });
      }
    } else if (cur === GAS && d.k >= 0.4 && !d.gas) {
      d.gas = true;
      this.world.set(d.c, d.r, E);
      this.fx.push({ type: 'gas', x: d.c * T + T / 2, y: d.r * T + T / 2, t: 0, life: 0.8 });
      this.explosionFx(d.c * T + T / 2, d.r * T + T / 2, 1.6);
      this.hooks.sound('explosion', { size: 1 });
      this.damage(D.hazards.gas.damage, 'gas');
    }
    if (p.dead) return;
    if (d.k >= 1) this.finishDrill();
  }

  finishDrill() {
    const p = this.p, d = p.drill, s = this.state;
    const t = this.world.get(d.c, d.r);
    this.world.set(d.c, d.r, E);
    p.drill = null;
    p.vy = 0;
    if (isOre(t)) {
      const m = D.minerals[t - ORE];
      if (cargoCount(s) < getStats(s).cargoMax) {
        s.cargo[m.id] = (s.cargo[m.id] || 0) + 1;
        s.score += m.points * this.run;
        this.hooks.sound('ore', { value: Math.min(1, Math.log10(m.value) / 5.7) });
        this.floater('+1 ' + m.name, '#ffe08a');
      } else {
        this.hooks.sound('denied');
        this.floater('Frachtraum voll!', '#ff6a5a');
      }
    } else if (isArtifact(t)) {
      const a = D.artifacts[t - ART];
      s.money += a.value;
      s.score += a.points;
      s.artifactsFound[a.id] = (s.artifactsFound[a.id] || 0) + 1;
      this.hooks.sound('sell', { count: 6 });
      this.floater(a.name + ' +$' + a.value.toLocaleString('de-DE'), '#9be36b');
      this.hooks.toast?.('Fundstück: ' + a.name + ', $' + a.value.toLocaleString('de-DE') + ' gutgeschrieben');
    }
  }

  floater(text, color) {
    this.fx.push({ type: 'text', x: this.p.x, y: this.p.y - 22, text, color, t: 0, life: 1.3 });
  }

  explosionFx(x, y, scale) {
    this.fx.push({ type: 'explosion', x, y, t: 0, life: 0.6, scale });
    this.shake = Math.min(1.2, this.shake + 0.5 * scale);
  }

  damage(n, kind) {
    const s = this.state, p = this.p;
    if (p.dead) return;
    if (kind === 'lava' || kind === 'gas') n *= 1 - getStats(s).radiator / 100;
    if (this.guardian) n *= 0.5;
    n = Math.round(n * 10) / 10;
    if (n <= 0) return;
    s.hull = Math.max(0, s.hull - n);
    this.shake = Math.min(1.2, this.shake + 0.25 + n / 40);
    this.fx.push({ type: 'text', x: p.x, y: p.y - 34, text: '-' + n.toLocaleString('de-DE') + ' HP', color: '#ff5a48', t: 0, life: 1.1 });
    if (kind !== 'fall') this.hooks.sound('impact', { intensity: Math.min(1, n / 30) });
    if (s.hull <= 0) {
      const why = { fall: 'Der Aufprall war zu hart.', lava: 'Die Lava hat deine Hülle geschmolzen.', gas: 'Eine Gastasche ist explodiert.', boss: 'Satan hat dich erwischt.' }[kind] || 'Deine Hülle wurde zerstört.';
      this.die(why);
    }
  }

  die(reason) {
    const p = this.p;
    if (p.dead) return;
    p.dead = true; p.deadT = 0; p.deadReason = reason; p.drill = null;
    this.explosionFx(p.x, p.y, 2.2);
    this.hooks.sound('explosion', { size: 1.6 });
    this.hooks.sound('gameOver');
    this.hooks.stopLoops?.();
  }

  // ---------- Gebäude ----------
  checkBuildings() {
    const p = this.p;
    const onSurface = p.grounded && !p.drill && Math.abs(p.y + HH) < 1;
    let inside = null;
    if (onSurface) {
      for (const b of BUILDINGS) {
        const x0 = b.c0 * T + T * 0.6, x1 = (b.c0 + 4) * T - T * 0.6;
        if (p.x > x0 && p.x < x1) inside = b;
      }
    }
    if (!inside) { this.lock = null; return; }
    if (this.lock === inside.id) return;
    this.lock = inside.id;
    p.vx = 0;
    this.hooks.stopLoops?.();
    this.hooks.building(inside.id);
  }

  // Wird nach dem Schließen eines Shops aufgerufen: Autosave und ggf. Erdbeben.
  afterShop() {
    const warned = D.story.findIndex(m => m.depth === D.hazards.earthquake.unlockedAtDepth);
    if ((this.state.seenStory || []).includes(warned) && Math.random() < 0.3) this.earthquake();
    this.save();
  }

  earthquake() {
    const w = this.world, maxRow = Math.min(BOTTOM, Math.floor(this.state.maxDepth / FT));
    let n = 0;
    for (let r = 2; r <= maxRow; r++) for (let c = 0; c < COLS; c++) {
      if (w.get(c, r) === E && Math.random() < 0.35) { w.set(c, r, DIRT); n++; }
    }
    this.shake = 1.4;
    this.hooks.sound('explosion', { size: 0.6 });
    this.hooks.toast?.('Erdbeben! Einige Tunnel sind wieder verschüttet.');
    return n;
  }

  // ---------- Story ----------
  // Tiefen-Funksprüche löst die UI aus (state.seenStory), hier nur die Höhen-Easter-Eggs.
  checkStory() {
    const s = this.state;
    for (const m of D.altitudeMessages) {
      const id = 'alt' + m.altitude;
      if (m.edition || this.seen[id] || s.altitude < m.altitude) continue;
      this.seen[id] = 1;
      if (m.reward) s.money += m.reward;
      if (m.effect === 'guardian_angel') this.guardian = true;
      this.hooks.message({ ...m });
    }
  }

  // ---------- Endkampf ----------
  updateBoss(dt) {
    const p = this.p;
    if (!this.boss && !this.bossDone && p.y > (BOSS_TOP + 0.5) * T) {
      const ph = D.boss.phases[0];
      this.boss = { phase: 0, hp: ph.hp * this.run, hpMax: ph.hp * this.run, x: COLS * T / 2, y: (BOSS_TOP + 3) * T, t: 0, fireT: 2.5, flash: 0, dead: false, deadT: 0, shots: [], swoop: 0 };
    }
    const b = this.boss;
    if (!b) return;
    b.t += dt;
    b.flash = Math.max(0, b.flash - dt * 3);
    if (b.dead) {
      b.deadT += dt;
      if (Math.random() < dt * 10) this.explosionFx(b.x + (Math.random() - 0.5) * 80, b.y + (Math.random() - 0.5) * 80, 1.2);
      if (b.deadT > 2.4 && !b.reported) {
        b.reported = true;
        this.bossDone = true;
        const total = D.victoryRewards.reduce((a, r) => a + r.value, 0);
        this.state.money += total;
        this.hooks.victory({ rewards: D.victoryRewards, total, score: this.state.score, time: this.time, run: this.run });
        this.boss = null;
      }
      return;
    }
    const fast = b.phase === 1;
    // Schweben, dem Pod folgen, ab und zu herabstoßen.
    b.swoop -= dt;
    if (b.swoop < -4) b.swoop = 2.2;
    const tx = p.x + Math.sin(b.t * 0.7) * T * 5;
    const ty = b.swoop > 0 ? p.y - T * 0.5 : (BOSS_TOP + 4.5) * T + Math.sin(b.t * 1.7) * T * 0.6;
    const k = Math.min(1, dt * (fast ? 1.3 : 0.9));
    b.x += (tx - b.x) * k; b.y += (ty - b.y) * k;
    b.x = Math.max(2 * T, Math.min((COLS - 2) * T, b.x));
    b.y = Math.max((BOSS_TOP + 1.5) * T, Math.min((BOSS_BOT - 0.5) * T, b.y));
    // Feuerbälle
    b.fireT -= dt;
    if (b.fireT <= 0 && !p.dead) {
      b.fireT = fast ? 0.95 : 1.6;
      const n = fast ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(p.y - b.y, p.x - b.x) + (i - (n - 1) / 2) * 0.28;
        const sp = fast ? 250 : 200;
        b.shots.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0 });
      }
    }
    for (const f of b.shots) {
      f.x += f.vx * dt; f.y += f.vy * dt; f.t += dt;
      if (this.world.solid(Math.floor(f.x / T), Math.floor(f.y / T)) || f.t > 5) { f.gone = true; this.fx.push({ type: 'explosion', x: f.x, y: f.y, t: 0, life: 0.4, scale: 0.6 }); continue; }
      if (!p.dead && Math.hypot(f.x - p.x, f.y - p.y) < 18) { f.gone = true; this.explosionFx(f.x, f.y, 0.8); this.damage(fast ? 12 : 8, 'boss'); }
    }
    b.shots = b.shots.filter(f => !f.gone);
    if (!p.dead && p.hitCd <= 0 && Math.hypot(b.x - p.x, b.y - p.y) < 44) {
      p.hitCd = 1;
      this.damage(fast ? 20 : 14, 'boss');
      p.vx = Math.sign(p.x - b.x || 1) * 260; p.vy = -200;
    }
  }

  hitBoss(amount) {
    const b = this.boss;
    if (!b || b.dead) return;
    b.hp -= amount; b.flash = 1;
    this.fx.push({ type: 'text', x: b.x, y: b.y - 50, text: '-' + amount, color: '#ffd23a', t: 0, life: 1.2 });
    if (b.hp > 0) return;
    if (b.phase === 0) {
      const ph = D.boss.phases[1];
      b.phase = 1; b.hp = b.hpMax = ph.hp * this.run; b.shots = [];
      this.explosionFx(b.x, b.y, 2.5);
      this.hooks.message({ sender: 'Mr. Natas', title: 'Seine wahre Gestalt', text: 'Du glaubst, das war schon alles? Lies meinen Namen doch einmal rückwärts. Jetzt lernst du mich richtig kennen!', reward: 0 });
    } else {
      b.dead = true; b.shots = [];
      this.hooks.sound('explosion', { size: 2 });
    }
  }

  // ---------- Items ----------
  // Die UI zieht das Item ab und verrechnet Reservetank/Nanobots selbst;
  // hier laufen nur die Effekte in der Welt (Sprengstoff, Teleporter).
  useItem(id) {
    const p = this.p;
    const def = D.items.find(i => i.id === id);
    if (!def || p.dead) return false;
    if (def.fuel || def.repair) { this.hooks.sound('repair'); return true; }
    if (def.radius) {
      if (p.drill) { p.drill = null; }
      this.blast(Math.floor(p.x / T), Math.floor(p.y / T), def.radius);
      this.hooks.sound('explosion', { size: def.radius === 2 ? 1.6 : 1 });
      const dmg = D.boss.damage[id] || 0;
      const b = this.boss;
      if (b && !b.dead && Math.hypot(b.x - p.x, b.y - p.y) < T * (def.radius + 2.5)) this.hitBoss(dmg);
    } else if (def.teleport) {
      p.drill = null; p.vx = 0; p.vy = 0;
      if (def.teleport === 'fuel_station') { p.x = (BUILDINGS[0].c0 + 4) * T + T / 2; p.y = -HH - 0.01; }
      else { p.x = (1 + Math.floor(Math.random() * (COLS - 2))) * T + T / 2; p.y = -(4 + Math.random() * 18) * T; }
      this.lock = 'teleport';
      this.hooks.sound('teleport');
      this.fx.push({ type: 'text', x: p.x, y: p.y - 22, text: 'Teleport!', color: '#7fd3ff', t: 0, life: 1 });
    }
    return true;
  }

  blast(cc, cr, rad) {
    const w = this.world;
    for (let r = cr - rad; r <= cr + rad; r++) for (let c = cc - rad; c <= cc + rad; c++) {
      if (!w.blastable(c, r)) continue;
      w.set(c, r, E);
      if (Math.random() < 0.6) this.fx.push({ type: 'explosion', x: c * T + T / 2, y: r * T + T / 2, t: -Math.random() * 0.15, life: 0.6, scale: 1 });
    }
    this.explosionFx(cc * T + T / 2, cr * T + T / 2, rad === 2 ? 2.4 : 1.6);
  }

  // ---------- Effekte ----------
  updateFx(dt) {
    for (const f of this.fx) {
      f.t += dt;
      if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 500 * dt; }
      if (f.type === 'text') f.y -= 26 * dt;
    }
    this.fx = this.fx.filter(f => f.t < f.life);
  }

  // Cheats aus dem Original (getippt während des Spiels).
  cheat(word) {
    const s = this.state, U = D.upgrades;
    const up = (k) => { s.upgrades[k] = Math.min(U[k].length - 1, s.upgrades[k] + 1); };
    const map = {
      blingbling: () => { s.money += 100000; },
      penetrable: () => up('hull'), digdug: () => up('drill'), warp9: () => up('engine'),
      guzzle: () => up('fuel'), toocool: () => up('radiator'), supersize: () => up('cargo'),
      fillerup: () => { s.fuel = getStats(s).fuelMax; },
    };
    if (!map[word]) return false;
    map[word]();
    this.hooks.sound('buy');
    this.hooks.toast?.('Cheat aktiviert: ' + word);
    return true;
  }
}

function glitch(depth, t) {
  const r = mulberry32((t * 12) | 0);
  return String(depth).split('').map(ch => (r() < 0.55 ? '?' : ch)).join('');
}

export { ROWS };
