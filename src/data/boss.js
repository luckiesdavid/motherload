// Endkampf am Grund (Anzeige -66666 ft). Mr. Natas offenbart sich als Satan (Natas rückwärts).
// Er wird nur mit Sprengstoff (vor allem Plastiksprengstoff) aus nächster Nähe besiegt.

export const boss = {
  phases: [
    { id: 'natas', name: 'Mr. Natas', hp: 1000, description: 'Erste Form: Mr. Natas in seiner Kampfmaschine.' },
    { id: 'satan', name: 'Satan',     hp: 2000, description: 'Zweite Form: gehörnte Teufelsgestalt.' },
  ],
  // Richtwerte aus Guides: ein Plastiksprengstoff trifft mit ca. 240 Schaden (ca. 5 Treffer für Phase 1).
  damage: { plastic_explosives: 240, dynamite: 120 /* ANNAHME */ },
  // Nach jedem Sieg startet ein neuer Durchgang: Boss-HP * Durchgang (siehe minerals.js newGamePlus).
  hpMultiplierPerRun: true,
};

// Belohnungen nach dem Sieg: Satans Einzelteile werden verkauft, danach die Firmenanteile.
export const victoryRewards = [
  { name: 'Kevlar Suit',                       value: 50000 },
  { name: 'Staff of Hell',                     value: 100000 },
  { name: 'Laser Monocle',                     value: 200000 },
  { name: "Satan's Hooves",                    value: 300000 },
  { name: "Satan's Horns",                     value: 400000 },
  { name: "Satan's Evil Eye (rechts)",         value: 500000 },
  { name: "Satan's Evil Eye (links)",          value: 500000 },
  { name: "Satan's Boiler of Eternal Infernos", value: 600000 },
  { name: 'Belohnung der Marsbewohner',        value: 1000000 },
  { name: 'Hälfte der Anteile an Mr. Natas’ Firma', value: 25000000 },
];

export default { boss, victoryRewards };
