// Gefahren unter der Oberfläche. Tiefen in ft.
// Wo Quellen auseinandergehen, steht die Spanne in docs/original-werte.md.

export const hazards = {
  rock: {
    minDepth: 1500,           // Quellen: 1500 bis 1600 ft
    diggable: false,          // nur mit Dynamit, Plastiksprengstoff oder Multi-Drill
  },
  lava: {
    minDepth: 3100,           // Quellen: 3100 bis 4200 ft. Ab 2. Durchgang ab 3300 ft.
    damage: 30,               // ANNAHME: im Original nicht beziffert, wird um radiator% reduziert
    hits: 2,                  // Lava trifft beim Durchbohren zweimal
    reducedByRadiator: true,
  },
  gas: {
    minDepth: 4700,           // Quellen: 4500 bis 5274 ft
    damage: 50,               // dokumentiert: erste Explosion 50 Schaden
    triggerAfterFeet: 5,      // explodiert nach ca. 5 ft Bohren ins Gasfeld
    visible: false,           // sieht aus wie normale Erde
    reducedByRadiator: true,
  },
  // Fallschaden: im Original nicht beziffert. Beim Landen mit hoher Geschwindigkeit
  // nimmt die Hülle Schaden (Tipp aus Guides: ab 150-200 ft Fallhöhe abbremsen).
  fall: {
    safeSpeed: null,          // ANNAHME der Engine überlassen
  },
  // Erdbeben: nur nach Verlassen eines Shops, ab der 1000-ft-Warnung von Mr. Natas.
  // Verschütten Tunnel (füllen sie mit Erde), verursachen keinen Schaden.
  earthquake: {
    unlockedAtDepth: 1000,
    trigger: 'leave_shop',
    damage: 0,
  },
};

export default { hazards };
