// Steuerung: Pfeiltasten/WASD, Touch-Steuerkreuz und getippte Original-Cheats.
// Item-Tasten (F R X C Q M) und Pause gehören der UI.

const KEYMAP = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
};
const CHEATS = ['blingbling', 'penetrable', 'digdug', 'warp9', 'guzzle', 'toocool', 'supersize', 'fillerup'];

export function createInput(root, onCheat) {
  const state = { left: false, right: false, up: false, down: false };
  let typed = '';

  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.key];
    if (k) { state[k] = true; e.preventDefault(); }
    if (e.key === ' ') e.preventDefault();
    if (e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-12);
      const hit = CHEATS.find(c => typed.endsWith(c));
      if (hit) { typed = ''; onCheat(hit); }
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.key];
    if (k) state[k] = false;
  });
  window.addEventListener('blur', reset);

  // Touch-Steuerung: links fahren, rechts fliegen/bohren.
  const pad = document.createElement('div');
  pad.className = 'touchpad';
  pad.innerHTML = `
    <div class="tp-group">
      <button type="button" data-k="left" aria-label="Links">◀</button>
      <button type="button" data-k="right" aria-label="Rechts">▶</button>
    </div>
    <div class="tp-group">
      <button type="button" data-k="down" aria-label="Bohren">▼</button>
      <button type="button" data-k="up" aria-label="Fliegen">▲</button>
    </div>`;
  root.appendChild(pad);
  const coarse = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
  pad.hidden = !coarse;
  window.addEventListener('touchstart', () => { pad.hidden = false; }, { once: true, passive: true });
  for (const btn of pad.querySelectorAll('button')) {
    const k = btn.dataset.k;
    const on = (e) => { e.preventDefault(); btn.setPointerCapture?.(e.pointerId); state[k] = true; btn.classList.add('on'); };
    const off = () => { state[k] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('lostpointercapture', off);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function reset() { for (const k in state) state[k] = false; }
  return { state, reset };
}
