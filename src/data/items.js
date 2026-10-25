// Verbrauchsgegenstände (im Original im "Repair & Upgrades"/Item-Shop, Tasten wie im Original).

export const items = [
  { id: 'reserve_fuel',       name: 'Reserve Fuel Tank',    price: 2000,  key: 'F', description: 'Füllt sofort 25 L Treibstoff nach.', fuel: 25 },
  { id: 'nanobots',           name: 'Hull Repair Nanobots', price: 7500,  key: 'R', description: 'Repariert sofort 30 HP der Hülle.', repair: 30 },
  { id: 'dynamite',           name: 'Dynamite',             price: 2000,  key: 'X', description: 'Sprengt 3x3 Felder um die Kapsel (Radius 1), auch Felsen.', radius: 1 },
  { id: 'plastic_explosives', name: 'Plastic Explosives',   price: 5000,  key: 'C', description: 'Sprengt 5x5 Felder um die Kapsel (Radius 2), auch Felsen.', radius: 2 },
  { id: 'quantum_teleporter', name: 'Quantum Teleporter',   price: 2000,  key: 'Q', description: 'Teleportiert irgendwo über die Oberfläche, Landung kann die Hülle beschädigen.', teleport: 'random_surface' },
  { id: 'matter_transmitter', name: 'Matter Transmitter',   price: 10000, key: 'M', description: 'Teleportiert sicher neben die Tankstelle.', teleport: 'fuel_station' },
];

export default { items };
