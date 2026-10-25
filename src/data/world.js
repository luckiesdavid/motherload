// Weltmaße und Tiefengrenzen. Tiefen in ft, positiv nach unten.

export const world = {
  tileFeet: 12.5,             // 8 Felder = 100 ft
  widthTiles: 38,             // ANNAHME: im Original nicht dokumentiert, Richtwert für den Nachbau
  surfaceRows: 4,             // ANNAHME: Luft/Gebäude über dem Boden
  bottomDepth: 7300,          // tiefste grabbare Ebene, darunter der Boss-Raum
  bottomRow: 584,             // 7300 / 12.5
  bossDisplayedDepth: 66666,  // Altimeter zeigt im Bossraum -66666 ft
  altimeterGlitchDepth: 5812, // ab hier zeigt der Höhenmesser flackernde Fragezeichen
};

// Felsen (unzerstörbar ohne Sprengstoff), Lava und Gas: siehe hazards.js
export default { world };
