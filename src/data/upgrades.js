// Upgrades des Junk Shops. Level 0 = Serienteil (bereits eingebaut, kostenlos).
// value ist je Kategorie in der Einheit aus `units` angegeben.
// estimated: true heißt, dass das Original nur "weniger als Stufe 1" angibt und der Wert geschätzt ist.

export const units = {
  drill: 'ft/s',      // Bohrgeschwindigkeit
  hull: 'HP',         // maximale Hülle
  engine: 'PS',       // Motorleistung (Flug-/Fahrgeschwindigkeit, Tragkraft)
  fuel: 'L',          // Tankinhalt
  radiator: '%',      // Schadensreduktion durch Lava/Hitze
  cargo: 'cu ft',     // Frachtraum (1 Erz = 1 cu ft)
};

export const upgrades = {
  drill: [
    { name: 'Stock Drill',     price: 0,      value: 20, estimated: true },
    { name: 'Silvide Drill',   price: 750,    value: 28 },
    { name: 'Goldium Drill',   price: 2000,   value: 40 },
    { name: 'Emerald Drill',   price: 5000,   value: 50 },
    { name: 'Ruby Drill',      price: 20000,  value: 70 },
    { name: 'Diamond Drill',   price: 100000, value: 95 },
    { name: 'Amazonite Drill', price: 500000, value: 120 },
  ],
  hull: [
    { name: 'Stock Hull',           price: 0,      value: 10 },
    { name: 'Ironium Hull',         price: 750,    value: 17 },
    { name: 'Bronzium Hull',        price: 2000,   value: 30 },
    { name: 'Steel Hull',           price: 5000,   value: 50 },
    { name: 'Platinum Hull',        price: 20000,  value: 80 },
    { name: 'Einsteinium Hull',     price: 100000, value: 120 },
    { name: 'Energy-Shielded Hull', price: 500000, value: 180 },
  ],
  engine: [
    { name: 'Stock Engine',            price: 0,      value: 150, estimated: true },
    { name: 'V4 1600 cc',              price: 750,    value: 160 },
    { name: 'V4 2.0 Ltr Turbo',        price: 2000,   value: 170 },
    { name: 'V6 3.8 Ltr',              price: 5000,   value: 180 },
    { name: 'V8 Supercharged 5.0 Ltr', price: 20000,  value: 190 },
    { name: 'V12 6.0 Ltr',             price: 100000, value: 200 },
    { name: 'V16 Jag Engine',          price: 500000, value: 210 },
  ],
  fuel: [
    { name: 'Micro Tank',              price: 0,      value: 10 },
    { name: 'Medium Tank',             price: 750,    value: 15 },
    { name: 'Huge Tank',               price: 2000,   value: 25 },
    { name: 'Gigantic Tank',           price: 5000,   value: 40 },
    { name: 'Titanic Tank',            price: 20000,  value: 60 },
    { name: 'Leviathan Tank',          price: 100000, value: 100 },
    { name: 'Liquid Compression Tank', price: 500000, value: 150 },
  ],
  // Der Radiator hat keine 750-$-Stufe, deshalb nur 6 Einträge.
  radiator: [
    { name: 'Stock Fan',               price: 0,      value: 0 },
    { name: 'Dual Fans',               price: 2000,   value: 10 },
    { name: 'Single Turbine',          price: 5000,   value: 25 },
    { name: 'Dual Turbines',           price: 20000,  value: 40 },
    { name: 'Puron Cooling',           price: 100000, value: 60 },
    { name: 'Tri-Turbine Freon Array', price: 500000, value: 80 },
  ],
  // Der Frachtraum hat keine 500.000-$-Stufe, deshalb nur 6 Einträge.
  cargo: [
    { name: 'Micro Bay',     price: 0,      value: 7 },
    { name: 'Medium Bay',    price: 750,    value: 15 },
    { name: 'Huge Bay',      price: 2000,   value: 25 },
    { name: 'Gigantic Bay',  price: 5000,   value: 40 },
    { name: 'Titanic Bay',   price: 20000,  value: 70 },
    { name: 'Leviathan Bay', price: 100000, value: 120 },
  ],
};



// Nur in der "Goldium Edition": geheime Baupläne (Ancient Blueprints), nicht im Shop kaufbar.
// Für einen 1:1-Nachbau des Original-Motherload (2004) optional.
export const goldiumBlueprints = [
  { slot: 'fuel',     name: 'Fuel Integrator Tank',   value: 150, foundBelow: 4000, effect: 'Sammelt Treibstoff aus Gastaschen (Schaden bleibt).' },
  { slot: 'engine',   name: 'Hyper-Drive Engine',     value: 220, foundBelow: 3700, effect: 'Schneller als V16, unbegrenzt zur Oberfläche teleportieren.', estimated: true },
  { slot: 'radiator', name: 'Magma Converter',        value: 80,  foundBelow: 4000, effect: 'Bringt Geld aus Lavataschen (Schaden bleibt).' },
  { slot: 'cargo',    name: 'Portable Wormhole Bay',  value: Infinity, foundBelow: 3700, effect: 'Unbegrenzter Frachtraum, Gewicht zählt weiter.' },
  { slot: 'hull',     name: 'Regenerative Hull',      value: 180, foundBelow: 3700, effect: 'Regeneriert langsam Hülle.' },
  { slot: 'drill',    name: 'Multi-Drill',            value: 140, reward: 'Alle 12 Challenges', effect: 'Bohrt auch durch Felsen.', estimated: true },
];
export default { units, upgrades, goldiumBlueprints };
