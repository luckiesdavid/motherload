// Erze und Fundstücke aus dem Original-Motherload (XGen Studios, 2004).
// Quellen und Abweichungen: docs/original-werte.md
// Tiefen in ft, positiv nach unten. Ein Feld (Tile) = 12.5 ft.

// minDepth: ab hier kann das Erz vorkommen, commonDepth: ab hier ist es häufig.
export const minerals = [
  { id: 'ironium',     name: 'Ironium',     value: 30,     weight: 10,  points: 1500,    minDepth: 25,   commonDepth: 25 },
  { id: 'bronzium',    name: 'Bronzium',    value: 60,     weight: 10,  points: 3000,    minDepth: 25,   commonDepth: 25 },
  { id: 'silverium',   name: 'Silverium',   value: 100,    weight: 10,  points: 5000,    minDepth: 25,   commonDepth: 25 },
  { id: 'goldium',     name: 'Goldium',     value: 250,    weight: 20,  points: 12500,   minDepth: 25,   commonDepth: 250 },
  { id: 'platinum',    name: 'Platinum',    value: 750,    weight: 30,  points: 37500,   minDepth: 800,  commonDepth: 1700 },
  { id: 'einsteinium', name: 'Einsteinium', value: 2000,   weight: 40,  points: 100000,  minDepth: 1600, commonDepth: 2600 },
  { id: 'emerald',     name: 'Emerald',     value: 5000,   weight: 60,  points: 250000,  minDepth: 2400, commonDepth: 4000 },
  { id: 'ruby',        name: 'Ruby',        value: 20000,  weight: 80,  points: 1000000, minDepth: 4000, commonDepth: 4800 },
  { id: 'diamond',     name: 'Diamond',     value: 100000, weight: 100, points: 5000000, minDepth: 4400, commonDepth: 5700 },
  { id: 'amazonite',   name: 'Amazonite',   value: 500000, weight: 120, points: 5000000, minDepth: 5500, commonDepth: 6200 },
];

// Seltene Fundstücke: werden beim Ausgraben sofort ausgezahlt und belegen keinen Frachtraum.
// depths: Tiefen, an denen Spieler sie gefunden haben (Richtwerte, Vorkommen ab ca. 1000 ft).
export const artifacts = [
  { id: 'dinosaur_bones',     name: 'Dinosaur Bones',     value: 1000,  points: 5000000, depths: [1949] },
  { id: 'treasure',           name: 'Treasure',           value: 5000,  points: 5000000, depths: [2280] },
  { id: 'martian_skeleton',   name: 'Martian Skeleton',   value: 10000, points: 5000000, depths: [2174, 2487] },
  { id: 'religious_artifact', name: 'Religious Artifact', value: 50000, points: 5000000, depths: [1600, 2425, 3575] },
];

// Nach jedem Sieg über Satan: Erzpreise / (Durchgang), Punkte * Durchgang, Boss-HP * Durchgang.
// Fundstücke behalten ihren Wert.
export const newGamePlus = {
  mineralValueDivisor: (run) => run,   // run = 1 (erster Durchgang), 2, 3, ...
  pointsMultiplier: (run) => run,
  bossHpMultiplier: (run) => run,
};

export default { minerals, artifacts, newGamePlus };
