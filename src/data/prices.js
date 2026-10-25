// Dienstleistungen an der Oberfläche und Startwerte.

export const prices = {
  fuelPerLiter: 1,        // Tankstelle: Liter * 1 $
  repairPerPoint: 15,     // Reparatur: HP * 15 $
};

// Schnellwahl-Buttons wie im Original.
export const fuelButtons = [5, 10, 25, 50, 'fill'];
export const repairButtons = [50, 100, 200, 500, 'full'];

export const start = {
  money: 20,              // Goldium Edition: 0
  fuel: 10,               // Micro Tank voll
  hull: 10,               // Stock Hull
  // Laut Story wurde vergessen, die Kapsel vor dem Abflug zu betanken.
  // Die Kapsel startet trotzdem mit vollem Micro Tank, die Nachricht ist der Hinweis zur Tankstelle.
};

// Oberflächengebäude des Originals (von links nach rechts).
export const buildings = [
  { id: 'fuel',       name: 'Fuel Station' },
  { id: 'processing', name: 'Mineral Processing' },
  { id: 'junk',       name: 'Junk Shop' },        // Upgrades
  { id: 'repair',     name: 'Repair Shop' },      // Reparatur und Items
];

export default { prices, fuelButtons, repairButtons, start, buildings };
