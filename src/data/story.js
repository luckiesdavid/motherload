// Funksprüche (Transmissions), ausgelöst beim ersten Erreichen der Tiefe (ft, positiv nach unten).
// Die Texte sind eigene deutsche Nacherzählungen des Inhalts, keine wörtlichen Zitate des Originals.
// reward: Bonus in $, der beim Auslösen gutgeschrieben wird.

export const story = [
  {
    depth: 0, sender: 'Mr. Natas', title: 'Willkommen auf dem Mars', reward: 0,
    text: 'Willkommen bei der Mars-Bergbaugesellschaft! Leider haben wir auf dem Weg hierher vergessen, deine Kapsel zu betanken. Fahr zuerst zur Tankstelle. Alle Läden hier sind vollautomatisch. Viel Glück, und bring uns reiche Erze!',
  },
  {
    depth: 500, sender: 'Mr. Natas', title: 'Erster Meilenstein', reward: 1000,
    text: 'Gute Arbeit, du hast 500 Fuß erreicht! Als kleine Anerkennung erhältst du einen Bonus von $1.000. Grab weiter!',
  },
  {
    depth: 1000, sender: 'Mr. Natas', title: 'Warnung vor Erdbeben', reward: 3000,
    text: 'Beeindruckend, 1.000 Fuß! Hier ist ein Bonus von $3.000. Achtung: Unsere Sensoren melden seltsame Schwingungen im Planeten. Es kann zu Erdbeben kommen, die deine Tunnel wieder verschütten.',
  },
  {
    depth: 1750, sender: 'Unbekannte Quelle', title: 'Gestörtes Signal', reward: 0,
    text: '...kzzt... hört mich jemand... ...tief unten... es ist nicht, was er... kzzzt...',
  },
  {
    depth: 2100, sender: 'Bergbaukapsel #3422-2', title: 'Ein Kollege meldet sich', reward: 0,
    text: 'Hallo, Kollege! Noch ein paar Ladungen, dann habe ich genug für die Rente zusammen. Mr. Natas zahlt gut, solange man nicht zu viele Fragen stellt.',
  },
  {
    depth: 2500, sender: 'Unbekannte Quelle', title: 'Notruf', reward: 0,
    text: '...kzzt... Hilfe... es ist so heiß hier unten... bitte... kzzzt...',
  },
  {
    depth: 3100, sender: 'Bergbaukapsel #3422-2', title: 'Tipp: Kühler', reward: 0,
    text: 'Pass auf, ab hier gibt es Lavataschen! Ohne guten Kühler brennen sie dir die Hülle weg. Rüste deinen Radiator auf, bevor du tiefer gehst.',
  },
  {
    depth: 3500, sender: 'Mr. Natas', title: 'Warnung vor Gas', reward: 20000,
    text: 'Hervorragend! Hier ist ein Bonus für deine Mühe. Eine Warnung: Weiter unten gibt es Gastaschen, die unsere Scanner nicht erkennen. Außerdem ist dein Höhenmesser nur bis etwa 6.000 Fuß zuverlässig.',
  },
  {
    depth: 4100, sender: 'Bergbaukapsel #3422-2', title: 'Letzte Nachricht', reward: 0,
    text: 'Ich stecke fest... der Tunnel ist eingestürzt, der Treibstoff ist fast leer. Falls du das hörst: Trau Mr. Natas nicht. Er wusste, was hier unten ist...',
  },
  {
    depth: 4500, sender: 'Bergbaukapsel #10043', title: 'Der große Fund', reward: 0,
    text: 'Unglaublich! Ich habe es gefunden, das Motherload! Es ist riesig, es leuchtet, es ist... was ist das? Nein... NEIN... kzzzt...',
  },
  {
    depth: 6200, sender: 'Mr. Natas', title: 'Kehr um!', reward: 0,
    text: 'Du verstößt gegen deinen Arbeitsvertrag! Kehr sofort um!',
  },
  {
    depth: 7000, sender: 'Mr. Natas', title: 'Letzte Warnung', reward: 0,
    text: 'Das ist deine letzte Warnung. Komm sofort an die Oberfläche zurück, oder du bist gefeuert!',
  },
  {
    depth: 7300, sender: 'Mr. Natas', title: 'Die Wahrheit', reward: 0,
    text: 'Du hast also den Weg nach unten gefunden. Dann muss ich mich wohl selbst um dich kümmern...',
    triggers: 'boss',
  },
];

// Versteckte Funksprüche beim Hochfliegen über die Oberfläche (Höhe in ft über 0, Goldium Edition / Easter Eggs).
export const altitudeMessages = [
  { altitude: 5000,   sender: 'Mr. Dog', title: 'Hallo von oben', reward: 5000, edition: 'goldium',
    text: 'Wuff! Was machst du denn so weit hier oben? Hier, nimm ein Leckerli.' },
  { altitude: 10000,  sender: 'Gott', title: 'Schutzengel', reward: 0, effect: 'guardian_angel', // halbiert erlittenen Schaden
    text: 'Du bist weit gekommen, mein Kind. Ein Schutzengel soll dich auf deinem Weg begleiten.' },
  { altitude: 100000, sender: 'Gott', title: 'Noch höher?', reward: 0,
    text: 'Jetzt übertreibst du aber. Flieg zurück und kümmere dich um deine Arbeit.' },
];

export default { story, altitudeMessages };
