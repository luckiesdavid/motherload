// Zeichnet Welt, Gebäude, Pod, Boss und Effekte mit den Pixel-Art-Sprites
// aus assets/graphics (globales MotherloadSprites aus sprites.js).

import {
  T, FT, COLS, ROWS, BOSS_TOP, BUILDINGS, E, DIRT, ROCK, LAVA, GAS, GRASS, BED, PAD, ORE, ART, hash,
} from './world.js';
import { HW, HH } from './game.js';
import { minerals, artifacts } from '../data/index.js';

const ORE_SPRITES = minerals.map(m => 'tile_ore_' + m.id);
const ART_SPRITES = { dinosaur_bones: 'tile_artifact_dinosaur', treasure: 'tile_artifact_treasure', martian_skeleton: 'tile_artifact_skeleton', religious_artifact: 'tile_artifact_relic' };
const ARTS = artifacts.map(a => ART_SPRITES[a.id] || 'tile_artifact_treasure');
const FALLBACK = { [DIRT]: '#7a4a2a', [ROCK]: '#555', [LAVA]: '#d24a12', [GAS]: '#7a4a2a', [GRASS]: '#6a8a3a', [BED]: '#222', [PAD]: '#6a8a3a' };

export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.camX = 0; this.camY = -200; this.snap = true;
    this.skyTop = '#1a0d1e';
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  get S() { return window.MotherloadSprites; }

  resize() {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(this.cv.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.cv.clientHeight * dpr));
    this.cv.width = w; this.cv.height = h;
    // Ganzzahlige Skalierung hält die Pixel-Art scharf und vermeidet Fugen.
    let ds = Math.max(1, Math.round(h / (T * 12.5)));
    while (ds > 1 && w / ds < T * 9.5) ds--;
    this.ds = ds;
    this.viewW = w / ds; this.viewH = h / ds;
  }

  sampleSkyTop() {
    const img = this.S?.images?.bg_sky;
    if (!img || this.skySampled) return;
    this.skySampled = true;
    try {
      const c = document.createElement('canvas'); c.width = c.height = 1;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data;
      this.skyTop = `rgb(${d[0]},${d[1]},${d[2]})`;
    } catch { /* file:// ohne Canvas-Zugriff: Standardfarbe */ }
  }

  updateCamera(game, dt) {
    const p = game.p;
    const worldW = COLS * T;
    let tx = p.x - this.viewW / 2;
    let ty = p.y - this.viewH / 2 + T * 0.5;
    if (this.viewW < worldW) tx = Math.max(0, Math.min(worldW - this.viewW, tx));
    else tx = (worldW - this.viewW) / 2;
    ty = Math.min(ROWS * T - this.viewH, ty);
    if (this.snap || Math.abs(ty - this.camY) > this.viewH * 1.5 || Math.abs(tx - this.camX) > this.viewW) {
      this.camX = tx; this.camY = ty; this.snap = false;
    } else {
      const k = Math.min(1, dt * 9);
      this.camX += (tx - this.camX) * k; this.camY += (ty - this.camY) * k;
    }
  }

  draw(game, dt) {
    const { ctx, cv, ds } = this;
    this.sampleSkyTop();
    this.updateCamera(game, dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0b0708';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const sh = game.shake > 0 ? game.shake * 4 * ds : 0;
    const ox = -Math.round(this.camX * ds) + Math.round((Math.random() - 0.5) * sh);
    const oy = -Math.round(this.camY * ds) + Math.round((Math.random() - 0.5) * sh);
    this.drawSky(oy);
    ctx.setTransform(ds, 0, 0, ds, ox, oy);
    ctx.imageSmoothingEnabled = false;
    this.drawTiles(game);
    this.drawBuildings(game);
    this.drawPod(game);
    this.drawBoss(game);
    this.drawFx(game);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawDarkness(game, ox, oy);
    this.drawBossBar(game);
  }

  drawSky(oy) {
    const { ctx, cv, ds } = this;
    const gy = oy; // Bildschirm-y der Bodenlinie (Welt-y 0)
    if (gy <= 0) return;
    ctx.fillStyle = this.skyTop;
    ctx.fillRect(0, 0, cv.width, Math.min(gy, cv.height));
    const img = this.S?.images?.bg_sky;
    if (!img) return;
    const w = img.width * ds, h = img.height * ds;
    const par = -this.camX * ds * 0.35;
    let x = ((par % w) + w) % w - w;
    for (; x < cv.width; x += w) ctx.drawImage(img, Math.round(x), Math.round(gy - h), w, h);
  }

  tileSprite(t, c, r) {
    const h = hash(c, r);
    if (t === DIRT || t === GAS) {
      if (t === GAS) return 'tile_gas';
      const ft = (r + 1) * FT + ((h >>> 4) % 9 - 4) * FT;
      const v = h % 4;
      return (ft < 2000 ? 'tile_dirt_' : ft < 4800 ? 'tile_dirt_deep_' : 'tile_dirt_core_') + v;
    }
    if (t >= ART) return ARTS[t - ART];
    if (t >= ORE) return ORE_SPRITES[t - ORE];
    if (t === ROCK || t === BED) return 'tile_rock';
    if (t === GRASS || t === PAD) return 'tile_grass';
    if (t === LAVA) return 'tile_lava';
    return null;
  }

  drawTiles(game) {
    const { ctx } = this, w = game.world, S = this.S;
    const c0 = Math.floor(this.camX / T) - 1, c1 = Math.ceil((this.camX + this.viewW) / T) + 1;
    const r0 = Math.max(0, Math.floor(this.camY / T) - 1), r1 = Math.min(ROWS - 1, Math.ceil((this.camY + this.viewH) / T) + 1);
    const lavaFrame = Math.floor(performance.now() / 160) % 4;
    const d = game.p.drill;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = w.get(c, r), x = c * T, y = r * T;
        if (t === E) {
          if (S?.images?.tile_tunnel) S.drawSprite(ctx, 'tile_tunnel', 0, x, y);
          else { ctx.fillStyle = '#2a1a14'; ctx.fillRect(x, y, T, T); }
          if (r >= BOSS_TOP) { ctx.fillStyle = 'rgba(150,20,10,0.25)'; ctx.fillRect(x, y, T, T); }
          continue;
        }
        const name = this.tileSprite(t, c, r);
        if (S?.images?.[name]) S.drawSprite(ctx, name, t === LAVA ? lavaFrame : 0, x, y);
        else { ctx.fillStyle = FALLBACK[t] || '#a07a3a'; ctx.fillRect(x, y, T, T); }
        if (t === BED || c < 0 || c >= COLS) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, T, T); }
        if (d && d.c === c && d.r === r) { ctx.fillStyle = `rgba(0,0,0,${d.k * 0.45})`; ctx.fillRect(x, y, T, T); }
      }
    }
    // Schatten an Tunnelkanten
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let r = Math.max(1, r0); r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (w.get(c, r) !== E) continue;
        const x = c * T, y = r * T;
        if (w.get(c, r - 1) !== E) ctx.fillRect(x, y, T, 3);
        if (w.get(c - 1, r) !== E) ctx.fillRect(x, y, 2, T);
        if (w.get(c + 1, r) !== E) ctx.fillRect(x + T - 2, y, 2, T);
      }
    }
  }

  drawBuildings(game) {
    const { ctx } = this, S = this.S, p = game.p;
    for (const b of BUILDINGS) {
      const x = b.c0 * T, y = -96;
      if (S?.images?.[b.sprite]) S.drawSprite(ctx, b.sprite, 0, x, y);
      else { ctx.fillStyle = '#5a5a66'; ctx.fillRect(x + 4, y + 20, 120, 76); }
      const near = Math.abs(p.y + HH) < 2 && p.x > x && p.x < x + 4 * T;
      if (near) { ctx.fillStyle = 'rgba(255,200,60,0.35)'; ctx.fillRect(x + 8, -3, 4 * T - 16, 3); }
    }
  }

  podSprite(game) {
    const p = game.p;
    if (p.dead) return ['pod_wreck', 0];
    const f = Math.floor(p.anim * 12) % 3;
    if (p.drill) return [p.drill.dir === 'down' ? 'pod_drill_down' : 'pod_drill_side', f];
    if (p.thrusting || !p.grounded) return ['pod_fly', p.thrusting ? f : 0];
    if (Math.abs(p.vx) > 5) return ['pod_drive', f];
    return ['pod_idle', 0];
  }

  drawPod(game) {
    const { ctx, ds } = this, p = game.p, S = this.S;
    if (p.dead && p.deadT < 0.12) return;
    const [name, frame] = this.podSprite(game);
    const x = Math.round((p.x - 16) * ds) / ds, y = Math.round((p.y + HH - 32) * ds) / ds;
    if (S?.images?.[name]) S.drawSprite(ctx, name, frame, x, y, p.facing < 0);
    else { ctx.fillStyle = '#e8a417'; ctx.fillRect(p.x - HW, p.y - HH, HW * 2, HH * 2); }
  }

  drawBoss(game) {
    const b = game.boss;
    if (!b) return;
    const { ctx } = this, S = this.S;
    const name = b.phase === 0 ? 'boss_natas' : 'boss_satan';
    const frame = Math.floor(b.t * 4) % 2;
    const flip = game.p.x > b.x;
    if (!(b.dead && b.deadT > 1.2)) {
      ctx.save();
      if (b.flash > 0 && Math.floor(b.flash * 20) % 2) ctx.globalAlpha = 0.35;
      if (b.dead) ctx.globalAlpha = Math.max(0, 1 - b.deadT / 1.2);
      if (S?.images?.[name]) S.drawSprite(ctx, name, frame, Math.round(b.x - 48), Math.round(b.y - 48), flip);
      else this.drawBossFallback(b);
      ctx.restore();
    }
    for (const f of b.shots) {
      if (S?.images?.fx_fireball) S.drawSprite(ctx, 'fx_fireball', Math.floor(f.t * 12) % 4, Math.round(f.x - 8), Math.round(f.y - 8), f.vx > 0);
      else { ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  drawBossFallback(b) {
    const { ctx } = this;
    ctx.fillStyle = b.phase === 0 ? '#4a4a58' : '#a01818';
    ctx.beginPath(); ctx.arc(b.x, b.y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23a';
    ctx.fillRect(b.x - 14, b.y - 10, 8, 5); ctx.fillRect(b.x + 6, b.y - 10, 8, 5);
  }

  drawFx(game) {
    const { ctx } = this, S = this.S;
    for (const f of game.fx) {
      if (f.t < 0) continue;
      const k = f.t / f.life;
      if (f.type === 'dust') {
        S?.drawSprite(ctx, 'fx_dust', Math.min(3, Math.floor(k * 4)), Math.round(f.x - 8), Math.round(f.y - 8), false, 0.5);
      } else if (f.type === 'explosion') {
        const sc = f.scale || 1, sz = 32 * sc;
        if (S?.images?.fx_explosion) S.drawSprite(ctx, 'fx_explosion', Math.min(5, Math.floor(k * 6)), Math.round(f.x - sz / 2), Math.round(f.y - sz / 2), false, sc);
        else { ctx.fillStyle = `rgba(255,160,40,${1 - k})`; ctx.beginPath(); ctx.arc(f.x, f.y, sz / 2, 0, Math.PI * 2); ctx.fill(); }
      } else if (f.type === 'gas') {
        S?.drawSprite(ctx, 'fx_gas', Math.min(3, Math.floor(k * 4)), Math.round(f.x - 24), Math.round(f.y - 24), false, 1.5);
      } else if (f.type === 'spark') {
        ctx.fillStyle = f.color; ctx.globalAlpha = 1 - k;
        ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
        ctx.globalAlpha = 1;
      } else if (f.type === 'text') {
        ctx.globalAlpha = Math.min(1, (1 - k) * 2);
        ctx.font = 'bold 9px "Trebuchet MS", Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      }
    }
  }

  drawDarkness(game, ox, oy) {
    const { ctx, cv, ds } = this, p = game.p;
    const rows = p.y / T;
    let a = Math.max(0, Math.min(1, (rows - 2) / 70)) * 0.8;
    if (p.y > BOSS_TOP * T) a = 0.35;
    if (a < 0.01) return;
    const px = p.x * ds + ox, py = p.y * ds + oy, R = T * ds;
    const g = ctx.createRadialGradient(px, py, R * 2.6, px, py, R * 7.5);
    g.addColorStop(0, 'rgba(6,2,3,0)');
    g.addColorStop(1, `rgba(6,2,3,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cv.width, cv.height);
  }

  drawBossBar(game) {
    const b = game.boss;
    if (!b || b.dead) return;
    const { ctx, cv } = this;
    const dpr = cv.width / Math.max(1, cv.clientWidth);
    const w = Math.min(cv.width * 0.6, 420 * dpr), h = 10 * dpr;
    const x = (cv.width - w) / 2, y = cv.height - 70 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 3 * dpr, y - 18 * dpr, w + 6 * dpr, h + 22 * dpr);
    ctx.fillStyle = '#3a0a0a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = b.phase === 0 ? '#ff9a2a' : '#ff2a2a'; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.hpMax), h);
    ctx.font = `bold ${12 * dpr}px "Trebuchet MS", Verdana, sans-serif`;
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffe6c0';
    const names = ['Mr. Natas', 'Satan'];
    ctx.fillText(`${names[b.phase]}  ${Math.max(0, Math.ceil(b.hp))} HP`, cv.width / 2, y - 5 * dpr);
  }
}
