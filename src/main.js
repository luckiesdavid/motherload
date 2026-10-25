// Einstieg: verbindet Engine, Renderer, UI, Audio und Daten.

import * as data from './data/index.js';
import { createUI } from './ui/index.js';
import { GameAudio } from './audio/index.js';
import { Game } from './engine/game.js';
import { Renderer } from './engine/render.js';
import { createInput } from './engine/input.js';
import { hardness } from './engine/world.js';

const root = document.getElementById('game');
const canvas = document.getElementById('view');
let mode = 'title';   // 'title' | 'play'

const hooks = {
  message: (m) => ui.showMessage(m),
  building: (id) => { input.reset(); ui.openBuilding(id); },
  gameOver: (reason) => {
    GameAudio.stopAllLoops();
    ui.showScreen('gameover', { reason, hasSave: Game.hasSave() });
  },
  victory: (info) => {
    const min = Math.round(info.time / 60);
    ui.showScreen('win', {
      text: `Satan ist besiegt und die Kolonie ist frei! Seine Einzelteile und die Hälfte von Mr. Natas’ Firma bringen dir $${info.total.toLocaleString('de-DE')} ein. Punkte: ${info.score.toLocaleString('de-DE')}, Spielzeit: ${min} Minuten.`,
    });
  },
  toast: (t) => ui.toast(t),
  sound: (name, opts) => GameAudio.play(name, opts),
  stopLoops: () => GameAudio.stopAllLoops(),
};

const game = new Game(hooks);
const renderer = new Renderer(canvas);
const input = createInput(root, (word) => { if (mode === 'play') game.cheat(word); });

const ui = createUI(document.getElementById('ui'), {
  data,
  hasSave: () => Game.hasSave(),
  saveInfo: () => Game.saveInfo(),
  onAction,
});

function onAction(type, payload = {}) {
  switch (type) {
    case 'newGame':
      game.newGame(1, null, payload.state);
      startPlay();
      break;
    case 'load':
      if (game.load()) startPlay();
      else { ui.showScreen('title', { hasSave: false }); ui.toast('Kein Spielstand gefunden'); }
      break;
    case 'save':
      return game.save();
    case 'quit':
      mode = 'title';
      GameAudio.stopAllLoops();
      break;
    case 'pause':
      input.reset();
      GameAudio.stopAllLoops();
      break;
    case 'useItem':
      if (payload.engineEffect) game.useItem(payload.id);
      else GameAudio.play('repair');
      break;
    case 'purchase':
      GameAudio.play({ sell: 'sell', fuel: 'repair', repair: 'repair' }[payload.kind] || 'buy',
        payload.kind === 'sell' ? { count: Math.min(12, (payload.lines?.length || 1) * 2) } : undefined);
      break;
    case 'story':
      if (payload.message?.triggers === 'boss') game.bossArmed = true;
      break;
    case 'closeMenu':
      game.afterShop();
      break;
  }
}

function startPlay() {
  mode = 'play';
  renderer.snap = true;
  input.reset();
  GameAudio.unlock();
  GameAudio.startMusic('surface');
}

// Ton-Schalter (Mute nur per Button, Taste M ist der Materie-Transmitter).
const mute = document.getElementById('mute');
const paintMute = () => { mute.textContent = GameAudio.isMuted() ? '🔇' : '🔊'; mute.setAttribute('aria-label', GameAudio.isMuted() ? 'Ton an' : 'Ton aus'); };
mute.addEventListener('click', () => { GameAudio.unlock(); GameAudio.toggleMute(); paintMute(); mute.blur(); });
paintMute();

ui.showScreen('title', { hasSave: Game.hasSave() });

// Für Konsole und Tests.
window.motherload = { game, ui, renderer };

// Beim Schließen oder Wegwechseln des Tabs automatisch sichern, wenn es gefahrlos geht.
function autosave() {
  if (mode === 'play') game.save();
}
window.addEventListener('pagehide', autosave);
document.addEventListener('visibilitychange', () => { if (document.hidden) autosave(); });

let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  const blocking = ui.isBlocking();
  const p = game.p;
  if (mode === 'play' && !blocking) {
    game.update(dt, input.state);
    const d = p.drill;
    GameAudio.setDrilling(!!d, d ? Math.min(1, (hardness(d.t, d.r) - 1) / 2) : 0);
    GameAudio.setThrust(p.thrusting);
    GameAudio.setFuelLow(!p.dead && game.state.fuel < game.state.fuelMax * 0.2);
    GameAudio.setDepth(game.state.depth);
  } else {
    GameAudio.setDrilling(false, 0);
    GameAudio.setThrust(false);
    GameAudio.setFuelLow(false);
  }
  if (mode === 'play') ui.update(game.state, now);
  renderer.draw(game, dt);
  requestAnimationFrame(frame);
}

const sprites = window.MotherloadSprites;
const ready = sprites ? sprites.loadSprites('assets/graphics/').catch((e) => console.warn(e.message)) : Promise.resolve();
ready.finally(() => requestAnimationFrame(frame));
