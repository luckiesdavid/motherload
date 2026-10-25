// Spiellogik der Gebäude, ohne DOM. Alle Funktionen mutieren den übergebenen
// State und geben { ok, ... } zurück, damit UI und Engine sie gleichermaßen nutzen können.
// "data" ist der Sammel-Export aus src/data/index.js.

export const UPGRADE_SLOTS = ['drill', 'hull', 'engine', 'fuel', 'radiator', 'cargo'];

export function createState(data) {
  const state = {
    money: data.start?.money ?? 20,
    depth: 0,
    maxDepth: 0,
    fuel: 0,
    hull: 0,
    upgrades: Object.fromEntries(UPGRADE_SLOTS.map((slot) => [slot, 0])),
    cargo: {},
    items: {},
    seenStory: [],
  };
  const stats = getStats(state, data);
  state.fuel = data.start?.fuel ?? stats.fuelMax;
  state.hull = data.start?.hull ?? stats.hullMax;
  return state;
}

export function upgradeLevel(data, slot, index) {
  const levels = data.upgrades[slot];
  return levels[Math.min(index ?? 0, levels.length - 1)];
}

export function getStats(state, data) {
  const v = (slot) => upgradeLevel(data, slot, state.upgrades?.[slot]).value;
  return {
    drillSpeed: v('drill'),
    hullMax: v('hull'),
    enginePower: v('engine'),
    fuelMax: v('fuel'),
    heatResistance: v('radiator'),
    cargoMax: v('cargo'),
  };
}

export function mineralById(data, id) {
  return data.minerals.find((m) => m.id === id);
}

// Frachtraum zählt Erze (1 Erz = 1 cu ft), das Gewicht ist nur für die Physik.
export function cargoUsed(state) {
  return Object.values(state.cargo).reduce((sum, count) => sum + count, 0);
}

export function cargoWeight(state, data) {
  let sum = 0;
  for (const [id, count] of Object.entries(state.cargo)) {
    sum += (mineralById(data, id)?.weight ?? 0) * count;
  }
  return sum;
}

export function cargoValue(state, data) {
  let sum = 0;
  for (const [id, count] of Object.entries(state.cargo)) {
    sum += (mineralById(data, id)?.value ?? 0) * count;
  }
  return sum;
}

export function canLoad(state, data) {
  return cargoUsed(state) < getStats(state, data).cargoMax;
}

export function addMineral(state, data, mineralId) {
  if (!mineralById(data, mineralId)) return { ok: false, reason: 'unknown' };
  if (!canLoad(state, data)) return { ok: false, reason: 'cargoFull' };
  state.cargo[mineralId] = (state.cargo[mineralId] ?? 0) + 1;
  return { ok: true };
}

// --- Tankstelle ---------------------------------------------------------

export function fuelQuote(state, data, liters) {
  const missing = Math.max(0, getStats(state, data).fuelMax - state.fuel);
  const amount = Math.min(liters ?? missing, missing);
  return { liters: amount, cost: Math.ceil(amount * data.prices.fuelPerLiter) };
}

// Kauft bis zu "liters" (Standard: volltanken). Reicht das Geld nicht, wird so viel
// getankt wie bezahlbar ist, wie im Original.
export function buyFuel(state, data, liters) {
  let { liters: amount } = fuelQuote(state, data, liters);
  amount = Math.min(amount, state.money / data.prices.fuelPerLiter);
  if (amount <= 0) return { ok: false, reason: state.money <= 0 ? 'noMoney' : 'full' };
  const cost = Math.min(state.money, Math.ceil(amount * data.prices.fuelPerLiter));
  state.money -= cost;
  state.fuel += amount;
  return { ok: true, liters: amount, cost };
}

// --- Mineralverarbeitung --------------------------------------------------

export function sellAll(state, data) {
  const lines = [];
  let total = 0;
  for (const [id, count] of Object.entries(state.cargo)) {
    if (!count) continue;
    const m = mineralById(data, id);
    const sum = (m?.value ?? 0) * count;
    lines.push({ id, name: m?.name ?? id, count, value: m?.value ?? 0, sum });
    total += sum;
  }
  if (!lines.length) return { ok: false, reason: 'empty', lines, total: 0 };
  state.money += total;
  state.cargo = {};
  return { ok: true, lines, total };
}

// --- Werkstatt ------------------------------------------------------------

export function repairQuote(state, data, points) {
  const missing = Math.max(0, getStats(state, data).hullMax - state.hull);
  const amount = Math.min(points ?? missing, missing);
  return { points: amount, cost: Math.ceil(amount * data.prices.repairPerPoint) };
}

export function repair(state, data, points) {
  let { points: amount } = repairQuote(state, data, points);
  amount = Math.min(amount, state.money / data.prices.repairPerPoint);
  if (amount <= 0) return { ok: false, reason: state.money <= 0 ? 'noMoney' : 'full' };
  const cost = Math.min(state.money, Math.ceil(amount * data.prices.repairPerPoint));
  state.money -= cost;
  state.hull += amount;
  return { ok: true, points: amount, cost };
}

// --- Upgrades -------------------------------------------------------------

export function upgradeStatus(state, data, slot, index) {
  const current = state.upgrades[slot] ?? 0;
  if (index === current) return 'owned';
  if (index < current) return 'lower';
  if (data.upgrades[slot][index].price > state.money) return 'tooExpensive';
  return 'buyable';
}

// Im Original kann man jede höhere Stufe direkt kaufen; niedrigere nicht.
export function buyUpgrade(state, data, slot, index) {
  const level = data.upgrades[slot]?.[index];
  if (!level) return { ok: false, reason: 'unknown' };
  const status = upgradeStatus(state, data, slot, index);
  if (status !== 'buyable') return { ok: false, reason: status };
  const before = getStats(state, data);
  state.money -= level.price;
  state.upgrades[slot] = index;
  const after = getStats(state, data);
  // Neuer Tank / neue Hülle: der zusätzliche Platz wird mitgeliefert.
  if (slot === 'fuel') state.fuel += after.fuelMax - before.fuelMax;
  if (slot === 'hull') state.hull += after.hullMax - before.hullMax;
  return { ok: true, level };
}

// --- Items ----------------------------------------------------------------

export function itemById(data, id) {
  return data.items.find((i) => i.id === id);
}

// Reservetank und Nanobots wirken direkt auf den State, alles andere (Sprengstoff,
// Teleporter) muss die Engine in der Welt ausführen.
export function isEngineItem(item) {
  return !item.fuel && !item.repair;
}

export function buyItem(state, data, id) {
  const item = itemById(data, id);
  if (!item) return { ok: false, reason: 'unknown' };
  if (item.price > state.money) return { ok: false, reason: 'tooExpensive' };
  state.money -= item.price;
  state.items[id] = (state.items[id] ?? 0) + 1;
  return { ok: true, item };
}

export function useItem(state, data, id) {
  const item = itemById(data, id);
  if (!item) return { ok: false, reason: 'unknown' };
  if (!state.items[id]) return { ok: false, reason: 'none' };
  const stats = getStats(state, data);
  if (item.fuel && state.fuel >= stats.fuelMax) return { ok: false, reason: 'full' };
  if (item.repair && state.hull >= stats.hullMax) return { ok: false, reason: 'full' };
  state.items[id] -= 1;
  if (!state.items[id]) delete state.items[id];
  if (item.fuel) state.fuel = Math.min(stats.fuelMax, state.fuel + item.fuel);
  if (item.repair) state.hull = Math.min(stats.hullMax, state.hull + item.repair);
  return { ok: true, item, engineEffect: isEngineItem(item) };
}

// --- Story ----------------------------------------------------------------

// Liefert den nächsten noch nicht gezeigten Funkspruch für die aktuelle Tiefe,
// merkt ihn als gesehen und schreibt den Bonus gut.
export function nextStoryMessage(state, data) {
  state.seenStory ??= [];
  const index = (data.story ?? []).findIndex(
    (msg, i) => !state.seenStory.includes(i) && state.depth >= msg.depth,
  );
  if (index === -1) return null;
  state.seenStory.push(index);
  const msg = data.story[index];
  if (msg.reward) state.money += msg.reward;
  return msg;
}
