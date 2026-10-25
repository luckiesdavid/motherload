// Einstiegspunkt der UI: HUD, Gebäude-Menüs, Funksprüche und Bildschirme.
// Die Engine besitzt den State; die UI liest ihn in update() und verändert ihn
// ausschließlich über transactions.js. Schnittstelle: src/ui/README.md.

import * as tx from './transactions.js';
import * as fmt from './format.js';

const HUD_INTERVAL_MS = 100;

// 'item' ist ein Alias: im Original verkauft die Werkstatt auch die Items.
const BUILDINGS = ['fuel', 'mineral', 'upgrade', 'repair', 'item', 'save'];

const TEXT = {
  buildings: {
    fuel: 'Tankstelle',
    mineral: 'Mineralverarbeitung',
    upgrade: 'Junk Shop',
    repair: 'Werkstatt',
    save: 'Speicherstation',
  },
  slots: {
    drill: 'Bohrer',
    hull: 'Hülle',
    engine: 'Motor',
    fuel: 'Tank',
    radiator: 'Kühler',
    cargo: 'Laderaum',
  },
  reasons: {
    noMoney: 'Nicht genug Geld!',
    tooExpensive: 'Nicht genug Geld!',
    full: 'Schon voll.',
    empty: 'Dein Laderaum ist leer.',
    none: 'Davon hast du keins mehr.',
    owned: 'Bereits eingebaut.',
    lower: 'Schlechter als dein aktuelles Teil.',
    cargoFull: 'Laderaum voll!',
  },
};

// Farbtupfer für die Erzliste, bis die Grafiken eigene Icons liefern.
const MINERAL_COLORS = {
  ironium: '#8b6f5a',
  bronzium: '#c47a3a',
  silverium: '#c9ccd1',
  goldium: '#f2c230',
  platinum: '#e6e8ef',
  einsteinium: '#7de04f',
  emerald: '#1fbf6a',
  ruby: '#e0213a',
  diamond: '#bff4ff',
  amazonite: '#3fe0c8',
};

const DEFAULT_FUEL_BUTTONS = [5, 10, 25, 50, 'fill'];
const DEFAULT_REPAIR_BUTTONS = [50, 100, 200, 500, 'full'];

export function createUI(root, { data, onAction = () => {}, state: initialState = null, hasSave = () => false } = {}) {
  if (!data?.upgrades || !data?.minerals) throw new Error('createUI: data aus src/data/index.js fehlt');
  let state = initialState;
  let menu = null; // { kind }
  let screen = null; // { kind, info }
  let upgradeTab = tx.UPGRADE_SLOTS[0];
  let lastHud = 0;
  let toastTimer = 0;
  const messageQueue = [];

  root.classList.add('ml-ui');
  root.innerHTML = `
    <div class="ml-hud" hidden>
      <div class="ml-hud-left">
        <div class="ml-gauge ml-gauge-fuel"><span class="ml-gauge-label">Treibstoff</span><div class="ml-bar"><i></i></div><span class="ml-gauge-value"></span></div>
        <div class="ml-gauge ml-gauge-hull"><span class="ml-gauge-label">Hülle</span><div class="ml-bar"><i></i></div><span class="ml-gauge-value"></span></div>
      </div>
      <div class="ml-hud-center">
        <div class="ml-depth"></div>
      </div>
      <div class="ml-hud-right">
        <div class="ml-money"></div>
        <div class="ml-gauge ml-gauge-cargo"><span class="ml-gauge-label">Fracht</span><div class="ml-bar"><i></i></div><span class="ml-gauge-value"></span></div>
      </div>
    </div>
    <div class="ml-warning" hidden></div>
    <div class="ml-quickbar" hidden></div>
    <div class="ml-toast" hidden></div>
    <div class="ml-layer ml-menu-layer" hidden></div>
    <div class="ml-layer ml-message-layer" hidden></div>
    <div class="ml-layer ml-screen-layer" hidden></div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const el = {
    hud: $('.ml-hud'),
    fuel: $('.ml-gauge-fuel'),
    hull: $('.ml-gauge-hull'),
    cargo: $('.ml-gauge-cargo'),
    depth: $('.ml-depth'),
    money: $('.ml-money'),
    warning: $('.ml-warning'),
    quickbar: $('.ml-quickbar'),
    toast: $('.ml-toast'),
    menu: $('.ml-menu-layer'),
    message: $('.ml-message-layer'),
    screen: $('.ml-screen-layer'),
  };

  const unit = (slot) => data.units?.[slot] ?? '';
  const saveAvailable = () => !!(screen?.info?.hasSave ?? hasSave());

  // --- HUD ----------------------------------------------------------------

  function setGauge(node, value, max, text) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    node.querySelector('i').style.width = `${ratio * 100}%`;
    node.querySelector('.ml-gauge-value').textContent = text;
    return ratio;
  }

  function renderHud() {
    if (!state) return;
    const stats = tx.getStats(state, data);
    const used = tx.cargoUsed(state);
    const fuelRatio = setGauge(el.fuel, state.fuel, stats.fuelMax, `${fmt.num(state.fuel, 1)} / ${stats.fuelMax} L`);
    const hullRatio = setGauge(el.hull, state.hull, stats.hullMax, `${Math.ceil(state.hull)} / ${stats.hullMax}`);
    setGauge(el.cargo, used, stats.cargoMax, `${used} / ${stats.cargoMax}`);
    el.fuel.classList.toggle('ml-low', fuelRatio <= 0.25);
    el.hull.classList.toggle('ml-low', hullRatio <= 0.25);
    el.cargo.classList.toggle('ml-full', used >= stats.cargoMax);
    // depthDisplay setzt die Engine für den Höhenmesser-Effekt des Originals (z.B. "-5?1?").
    el.depth.textContent = `Tiefe: ${state.depthDisplay != null ? `${state.depthDisplay} ft` : fmt.depth(state.depth)}`;
    el.money.textContent = fmt.money(state.money);

    const warnings = [];
    if (fuelRatio <= 0.15) warnings.push('TREIBSTOFF NIEDRIG');
    if (hullRatio <= 0.2) warnings.push('HÜLLE KRITISCH');
    el.warning.hidden = !warnings.length || isBlocking();
    el.warning.textContent = warnings.join('  ·  ');

    const quick = data.items
      .map((item) => {
        const count = state.items[item.id] ?? 0;
        return `<button class="ml-quick${count ? '' : ' ml-empty'}" data-action="useItem" data-id="${item.id}" title="${fmt.esc(item.name)} (${fmt.esc(item.key)})">
          <kbd>${fmt.esc(item.key)}</kbd><span>${fmt.esc(item.name)}</span><b>${count}</b></button>`;
      })
      .join('');
    if (el.quickbar.dataset.html !== quick) {
      el.quickbar.innerHTML = quick;
      el.quickbar.dataset.html = quick;
    }
  }

  function toast(text) {
    el.toast.textContent = text;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.toast.hidden = true), 1800);
  }

  function fail(result) {
    toast(TEXT.reasons[result.reason] ?? 'Geht nicht.');
  }

  // --- Fenster-Rahmen -------------------------------------------------------

  function frame(title, body, cls = '') {
    return `<div class="ml-window ${cls}" role="dialog" aria-label="${fmt.esc(title)}">
      <header><h2>${fmt.esc(title)}</h2><button class="ml-close" data-action="close" aria-label="Schließen">×</button></header>
      <div class="ml-body">${body}</div>
      <footer>${state ? `<span class="ml-cash">Geld: ${fmt.money(state.money)}</span>` : ''}<button class="ml-btn" data-action="close">Verlassen</button></footer>
    </div>`;
  }

  // Schnellwahl in Dollar plus "voll", wie fuelButtons/repairButtons in src/data/prices.js.
  function moneyButtons(buttons, action, param, pricePerUnit, fullQuote, fullLabel) {
    const disabled = fullQuote <= 0 || state.money <= 0 ? 'disabled' : '';
    return buttons
      .map((b) =>
        typeof b === 'number'
          ? `<button class="ml-btn" data-action="${action}" data-${param}="${b / pricePerUnit}" ${disabled}>${fmt.money(b)}</button>`
          : `<button class="ml-btn ml-primary" data-action="${action}" ${disabled}>${fullLabel}</button>`,
      )
      .join('');
  }

  // --- Gebäude --------------------------------------------------------------

  function renderFuel() {
    const stats = tx.getStats(state, data);
    const full = tx.fuelQuote(state, data);
    const price = data.prices.fuelPerLiter;
    const buttons = moneyButtons(data.fuelButtons ?? DEFAULT_FUEL_BUTTONS, 'buyFuel', 'liters', price, full.liters, `Volltanken (${fmt.money(full.cost)})`);
    const body = `
      <div class="ml-tank">
        <div class="ml-bar ml-bar-big"><i style="width:${(state.fuel / stats.fuelMax) * 100}%"></i></div>
        <p>${fmt.num(state.fuel, 1)} von ${stats.fuelMax} Litern · ${fmt.money(price)} pro Liter</p>
      </div>
      <div class="ml-row">${buttons}</div>`;
    return frame(TEXT.buildings.fuel, body, 'ml-fuel');
  }

  function renderMineral() {
    const rows = data.minerals
      .filter((m) => state.cargo[m.id])
      .map((m) => {
        const count = state.cargo[m.id];
        return `<tr><td><span class="ml-swatch" style="background:${m.color ?? MINERAL_COLORS[m.id] ?? '#999'}"></span>${fmt.esc(m.name)}</td>
          <td class="ml-num">${count}</td><td class="ml-num">× ${fmt.money(m.value)}</td><td class="ml-num">${fmt.money(count * m.value)}</td></tr>`;
      })
      .join('');
    const total = tx.cargoValue(state, data);
    const body = rows
      ? `<table class="ml-table"><thead><tr><th>Erz</th><th class="ml-num">Menge</th><th class="ml-num">Preis</th><th class="ml-num">Summe</th></tr></thead>
         <tbody>${rows}</tbody><tfoot><tr><td colspan="3">Gesamt</td><td class="ml-num">${fmt.money(total)}</td></tr></tfoot></table>
         <div class="ml-row"><button class="ml-btn ml-primary" data-action="sellAll">Alles verkaufen</button></div>`
      : `<p class="ml-empty-note">Dein Laderaum ist leer. Komm mit Erz wieder!</p>`;
    return frame(TEXT.buildings.mineral, body, 'ml-mineral');
  }

  function renderUpgrade() {
    const tabs = tx.UPGRADE_SLOTS.map(
      (slot) => `<button class="ml-tab${slot === upgradeTab ? ' ml-active' : ''}" data-action="tab" data-slot="${slot}">${TEXT.slots[slot]}</button>`,
    ).join('');
    const levels = data.upgrades[upgradeTab]
      .map((lvl, i) => {
        const status = tx.upgradeStatus(state, data, upgradeTab, i);
        const label = { owned: 'Eingebaut', lower: '—', tooExpensive: fmt.money(lvl.price), buyable: fmt.money(lvl.price) }[status];
        return `<button class="ml-upgrade ml-${status}" data-action="buyUpgrade" data-slot="${upgradeTab}" data-index="${i}" ${status === 'buyable' ? '' : 'disabled'}>
          <span class="ml-tier">Stufe ${i}</span><strong>${fmt.esc(lvl.name)}</strong><span>${fmt.num(lvl.value)} ${fmt.esc(unit(upgradeTab))}</span><em>${label}</em></button>`;
      })
      .join('');
    const body = `<nav class="ml-tabs">${tabs}</nav><div class="ml-upgrades">${levels}</div>`;
    return frame(TEXT.buildings.upgrade, body, 'ml-upgrade-shop');
  }

  // Werkstatt: Reparatur oben, Items darunter, wie im Original.
  function renderRepair() {
    const stats = tx.getStats(state, data);
    const full = tx.repairQuote(state, data);
    const price = data.prices.repairPerPoint;
    const buttons = moneyButtons(data.repairButtons ?? DEFAULT_REPAIR_BUTTONS, 'repair', 'points', price, full.points, `Komplett (${fmt.money(full.cost)})`);
    const items = data.items
      .map(
        (item) => `<div class="ml-item">
          <kbd>${fmt.esc(item.key)}</kbd>
          <div><strong>${fmt.esc(item.name)}</strong><p>${fmt.esc(item.description)}</p></div>
          <span class="ml-count">Besitz: ${state.items[item.id] ?? 0}</span>
          <button class="ml-btn" data-action="buyItem" data-id="${item.id}" ${item.price > state.money ? 'disabled' : ''}>${fmt.money(item.price)}</button>
        </div>`,
      )
      .join('');
    const body = `
      <h3 class="ml-section">Reparatur</h3>
      <div class="ml-tank">
        <div class="ml-bar ml-bar-big ml-bar-hull"><i style="width:${(state.hull / stats.hullMax) * 100}%"></i></div>
        <p>Hülle ${Math.ceil(state.hull)} von ${stats.hullMax} · ${fmt.money(price)} pro Punkt</p>
      </div>
      <div class="ml-row">${buttons}</div>
      <h3 class="ml-section">Zubehör</h3>
      <div class="ml-items">${items}</div>`;
    return frame(TEXT.buildings.repair, body, 'ml-repair');
  }

  function renderSave() {
    const body = `<p>Hier kannst du deinen Fortschritt sichern. Ein vorhandener Spielstand wird überschrieben.</p>
      <div class="ml-row"><button class="ml-btn ml-primary" data-action="save">Spiel speichern</button></div>`;
    return frame(TEXT.buildings.save, body, 'ml-save');
  }

  function renderMenu() {
    if (!menu || !state) {
      el.menu.hidden = true;
      el.menu.innerHTML = '';
      return;
    }
    const render = { fuel: renderFuel, mineral: renderMineral, upgrade: renderUpgrade, repair: renderRepair, item: renderRepair, save: renderSave }[menu.kind];
    el.menu.innerHTML = render();
    el.menu.hidden = false;
  }

  // --- Funksprüche ----------------------------------------------------------

  function renderMessage() {
    const msg = messageQueue[0];
    if (!msg) {
      el.message.hidden = true;
      el.message.innerHTML = '';
      return;
    }
    const heading = msg.sender ? `${msg.sender}: ${msg.title ?? ''}` : (msg.title ?? 'Eingehende Nachricht');
    el.message.innerHTML = `<div class="ml-window ml-radio" role="dialog">
      <header><h2>${fmt.esc(heading)}</h2></header>
      <div class="ml-body"><div class="ml-portrait" aria-hidden="true"></div>
        <div><p class="ml-radio-text">${fmt.esc(msg.text).replace(/\n/g, '<br>')}</p>
        ${msg.reward ? `<p class="ml-reward">Bonus: ${fmt.money(msg.reward)}</p>` : ''}</div></div>
      <footer><button class="ml-btn ml-primary" data-action="dismissMessage">OK</button></footer>
    </div>`;
    el.message.hidden = false;
  }

  // --- Bildschirme ----------------------------------------------------------

  function renderScreen() {
    if (!screen) {
      el.screen.hidden = true;
      el.screen.innerHTML = '';
      el.hud.hidden = !state;
      el.quickbar.hidden = !state;
      return;
    }
    const load = `<button class="ml-btn" data-action="load" ${saveAvailable() ? '' : 'disabled'}>Spiel laden</button>`;
    let html = '';
    if (screen.kind === 'title') {
      html = `<div class="ml-screen ml-title">
        <h1>MOTHERLOAD</h1><p class="ml-sub">Mars Mining Corporation</p>
        <div class="ml-col">
          <button class="ml-btn ml-primary" data-action="newGame">Neues Spiel</button>
          ${load}
          <button class="ml-btn" data-action="howto">Anleitung</button>
        </div>
        ${screen.howto ? howtoHtml() : ''}
      </div>`;
    } else if (screen.kind === 'pause') {
      html = `<div class="ml-screen ml-pause">
        <h1>PAUSE</h1>
        <div class="ml-col">
          <button class="ml-btn ml-primary" data-action="resume">Weiter</button>
          ${load}
          <button class="ml-btn" data-action="quit">Hauptmenü</button>
        </div>
        <p class="ml-hint">Speichern geht an der Speicherstation an der Oberfläche.</p>
      </div>`;
    } else if (screen.kind === 'gameover') {
      const reason = screen.info?.reason ?? 'Dein Pod wurde zerstört.';
      html = `<div class="ml-screen ml-gameover">
        <h1>GAME OVER</h1><p class="ml-sub">${fmt.esc(reason)}</p>
        ${state ? `<p>Erreichte Tiefe: ${fmt.depth(state.maxDepth ?? state.depth)} · Geld: ${fmt.money(state.money)}</p>` : ''}
        <div class="ml-col">
          <button class="ml-btn ml-primary" data-action="newGame">Neues Spiel</button>
          ${load}
          <button class="ml-btn" data-action="quit">Hauptmenü</button>
        </div>
      </div>`;
    } else if (screen.kind === 'win') {
      html = `<div class="ml-screen ml-win">
        <h1>GESCHAFFT!</h1><p class="ml-sub">${fmt.esc(screen.info?.text ?? 'Du hast den Mars gerettet.')}</p>
        ${state ? `<p>Endstand: ${fmt.money(state.money)}</p>` : ''}
        <div class="ml-col"><button class="ml-btn ml-primary" data-action="quit">Hauptmenü</button></div>
      </div>`;
    }
    el.screen.innerHTML = html;
    el.screen.hidden = false;
    el.hud.hidden = screen.kind === 'title' || !state;
    el.quickbar.hidden = el.hud.hidden;
  }

  function howtoHtml() {
    const keys = data.items.map((i) => `<li><kbd>${fmt.esc(i.key)}</kbd> ${fmt.esc(i.name)}</li>`).join('');
    return `<div class="ml-howto">
      <h3>Steuerung</h3>
      <ul><li><kbd>←</kbd><kbd>→</kbd><kbd>↓</kbd> Fahren und bohren</li><li><kbd>↑</kbd> Rotor / fliegen</li>
      <li><kbd>Esc</kbd> / <kbd>P</kbd> Pause</li>${keys}</ul>
      <p>Grabe Erz, verkaufe es an der Oberfläche, rüste deinen Pod auf und behalte Treibstoff und Hülle im Blick.</p>
    </div>`;
  }

  // --- Aktionen -------------------------------------------------------------

  function refresh() {
    renderHud();
    renderMenu();
  }

  function closeMenu() {
    if (!menu) return;
    menu = null;
    renderMenu();
    onAction('closeMenu', {});
  }

  function useItem(id) {
    const result = tx.useItem(state, data, id);
    if (!result.ok) return fail(result);
    toast(`${result.item.name} eingesetzt`);
    onAction('useItem', { id, engineEffect: result.engineEffect, item: result.item });
    renderHud();
  }

  function leaveScreens() {
    screen = null;
    menu = null;
    messageQueue.length = 0;
    renderMessage();
    renderMenu();
    renderScreen();
  }

  const handlers = {
    close: closeMenu,
    buyFuel: (d) => {
      const r = tx.buyFuel(state, data, d.liters ? Number(d.liters) : undefined);
      r.ok ? onAction('purchase', { kind: 'fuel', ...r }) : fail(r);
    },
    sellAll: () => {
      const r = tx.sellAll(state, data);
      if (!r.ok) return fail(r);
      toast(`Verkauft für ${fmt.money(r.total)}`);
      onAction('purchase', { kind: 'sell', ...r });
    },
    tab: (d) => {
      upgradeTab = d.slot;
    },
    buyUpgrade: (d) => {
      const r = tx.buyUpgrade(state, data, d.slot, Number(d.index));
      if (!r.ok) return fail(r);
      toast(`${r.level.name} eingebaut`);
      onAction('purchase', { kind: 'upgrade', slot: d.slot, ...r });
    },
    repair: (d) => {
      const r = tx.repair(state, data, d.points ? Number(d.points) : undefined);
      r.ok ? onAction('purchase', { kind: 'repair', ...r }) : fail(r);
    },
    buyItem: (d) => {
      const r = tx.buyItem(state, data, d.id);
      r.ok ? onAction('purchase', { kind: 'item', ...r }) : fail(r);
    },
    useItem: (d) => {
      if (!isBlocking()) useItem(d.id);
    },
    dismissMessage: () => {
      const msg = messageQueue.shift();
      renderMessage();
      onAction('messageClosed', { message: msg });
    },
    save: () => {
      onAction('save', {});
      toast('Spiel gespeichert');
    },
    load: () => {
      leaveScreens();
      onAction('load', {});
    },
    newGame: () => {
      state = tx.createState(data);
      leaveScreens();
      onAction('newGame', { state });
      refresh();
    },
    resume: () => {
      screen = null;
      renderScreen();
      onAction('resume', {});
    },
    quit: () => {
      menu = null;
      renderMenu();
      screen = { kind: 'title' };
      renderScreen();
      onAction('quit', {});
    },
    howto: () => {
      screen = { ...screen, howto: !screen.howto };
      renderScreen();
    },
  };

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled || !root.contains(target)) return;
    const handler = handlers[target.dataset.action];
    if (!handler) return;
    handler(target.dataset);
    refresh();
  });

  function onKey(event) {
    if (event.repeat) return;
    const key = event.key;
    if (messageQueue.length && (key === 'Enter' || key === ' ' || key === 'Escape')) {
      event.preventDefault();
      handlers.dismissMessage();
      return;
    }
    if (menu && key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (screen?.kind === 'pause' && (key === 'Escape' || key.toLowerCase() === 'p')) {
      event.preventDefault();
      handlers.resume();
      return;
    }
    if (isBlocking() || !state) return;
    if (key === 'Escape' || key.toLowerCase() === 'p') {
      event.preventDefault();
      showScreen('pause');
      onAction('pause', {});
      return;
    }
    const item = data.items.find((i) => i.key.toLowerCase() === key.toLowerCase());
    if (item) {
      event.preventDefault();
      useItem(item.id);
    }
  }
  window.addEventListener('keydown', onKey);

  // --- Öffentliche Schnittstelle --------------------------------------------

  function isBlocking() {
    return !!(menu || screen || messageQueue.length);
  }

  function showScreen(kind, info) {
    screen = kind ? { kind, info } : null;
    if (kind) menu = null;
    renderMenu();
    renderScreen();
  }

  const api = {
    get state() {
      return state;
    },
    update(next = state, now = performance.now()) {
      state = next;
      if (!state) return;
      if (state.depth > (state.maxDepth ?? 0)) state.maxDepth = state.depth;
      // Funksprüche automatisch auslösen, sobald ihre Tiefe erreicht ist.
      if (!screen && !menu) {
        const msg = tx.nextStoryMessage(state, data);
        if (msg) {
          api.showMessage(msg);
          onAction('story', { message: msg });
        }
      }
      if (!screen && el.hud.hidden) {
        el.hud.hidden = false;
        el.quickbar.hidden = false;
      }
      if (now - lastHud >= HUD_INTERVAL_MS) {
        lastHud = now;
        renderHud();
      }
    },
    openBuilding(kind) {
      if (!BUILDINGS.includes(kind) || !state || screen) return false;
      menu = { kind };
      renderMenu();
      return true;
    },
    closeMenu,
    showMessage(msg) {
      messageQueue.push(msg);
      if (messageQueue.length === 1) renderMessage();
    },
    showScreen,
    toast,
    isBlocking,
    destroy() {
      window.removeEventListener('keydown', onKey);
      clearTimeout(toastTimer);
      root.innerHTML = '';
      root.classList.remove('ml-ui');
    },
  };

  if (state) refresh();
  else showScreen('title', { hasSave: hasSave() });
  return api;
}

export { tx as transactions };
