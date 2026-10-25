import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../../src/data/index.js';
import * as tx from '../../src/ui/transactions.js';
import * as fmt from '../../src/ui/format.js';

test('neuer Spielstand startet mit Startwerten und Serienteilen', () => {
  const s = tx.createState(data);
  assert.equal(s.money, data.start.money);
  assert.equal(s.fuel, data.start.fuel);
  assert.equal(s.hull, data.start.hull);
  assert.deepEqual(Object.values(s.upgrades), [0, 0, 0, 0, 0, 0]);
});

test('Laderaum zählt Erze, nicht Gewicht', () => {
  const s = tx.createState(data);
  const max = tx.getStats(s, data).cargoMax;
  for (let i = 0; i < max; i++) assert.ok(tx.addMineral(s, data, 'amazonite').ok);
  assert.equal(tx.cargoUsed(s), max);
  assert.equal(tx.cargoWeight(s, data), max * 120);
  assert.equal(tx.addMineral(s, data, 'ironium').reason, 'cargoFull');
});

test('Tanken: volltanken und Teilbeträge, begrenzt durch Geld', () => {
  const s = tx.createState(data);
  const price = data.prices.fuelPerLiter;
  s.fuel = 2;
  s.money = 100;
  assert.ok(tx.buyFuel(s, data).ok);
  assert.equal(s.fuel, 10);
  assert.equal(s.money, 100 - 8 * price);

  s.fuel = 0;
  s.money = 3 * price;
  tx.buyFuel(s, data);
  assert.equal(s.fuel, 3);
  assert.equal(s.money, 0);
  assert.equal(tx.buyFuel(s, data).reason, 'noMoney');
});

test('Erzverkauf zahlt Summe aus und leert den Laderaum', () => {
  const s = tx.createState(data);
  s.cargo = { ironium: 2, goldium: 1 };
  const r = tx.sellAll(s, data);
  assert.equal(r.total, 2 * 30 + 250);
  assert.equal(s.money, data.start.money + 310);
  assert.deepEqual(s.cargo, {});
  assert.equal(tx.sellAll(s, data).reason, 'empty');
});

test('Upgrades: nur höhere Stufen, Tank wird mit aufgefüllt', () => {
  const s = tx.createState(data);
  s.money = 3000;
  assert.equal(tx.buyUpgrade(s, data, 'fuel', 2).ok, true);
  assert.equal(s.money, 1000);
  assert.equal(s.fuel, 25);
  assert.equal(tx.buyUpgrade(s, data, 'fuel', 1).reason, 'lower');
  assert.equal(tx.buyUpgrade(s, data, 'fuel', 2).reason, 'owned');
  assert.equal(tx.buyUpgrade(s, data, 'drill', 3).reason, 'tooExpensive');
  assert.equal(tx.buyUpgrade(s, data, 'cargo', 6).reason, 'unknown');
});

test('Reparatur kostet pro Punkt', () => {
  const s = tx.createState(data);
  s.hull = 4;
  s.money = 1000;
  tx.repair(s, data);
  assert.equal(s.hull, 10);
  assert.equal(s.money, 1000 - 6 * data.prices.repairPerPoint);
});

test('Items kaufen und einsetzen', () => {
  const s = tx.createState(data);
  s.money = 10000;
  assert.ok(tx.buyItem(s, data, 'reserve_fuel').ok);
  assert.equal(tx.useItem(s, data, 'reserve_fuel').reason, 'full');
  s.fuel = 1;
  const r1 = tx.useItem(s, data, 'reserve_fuel');
  assert.equal(r1.engineEffect, false);
  assert.equal(s.fuel, 10);
  assert.equal(s.items.reserve_fuel, undefined);

  tx.buyItem(s, data, 'dynamite');
  assert.equal(tx.useItem(s, data, 'dynamite').engineEffect, true);
  assert.equal(tx.useItem(s, data, 'dynamite').reason, 'none');
});

test('Funksprüche kommen einmal pro Tiefe und zahlen den Bonus', () => {
  const s = tx.createState(data);
  assert.equal(tx.nextStoryMessage(s, data).depth, 0);
  assert.equal(tx.nextStoryMessage(s, data), null);
  s.depth = 600;
  const money = s.money;
  const msg = tx.nextStoryMessage(s, data);
  assert.equal(msg.depth, 500);
  assert.equal(s.money, money + msg.reward);
  assert.equal(tx.nextStoryMessage(s, data), null);
});

test('Formatierung', () => {
  assert.equal(fmt.depth(0), '0 ft');
  assert.equal(fmt.depth(1250), '-1.250 ft');
  assert.equal(fmt.money(12345.9), '$12.345');
  assert.equal(fmt.esc('<b>'), '&lt;b&gt;');
});
