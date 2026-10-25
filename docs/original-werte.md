# Motherload: Originalwerte

Recherchierte Spieldaten des Original-Motherload (XGen Studios, 2004, bekannt über Miniclip).
Die maschinenlesbaren Werte liegen in `src/data/` (Sammel-Export: `src/data/index.js`).
Tiefen sind in ft angegeben, positiv nach unten. Ein Feld (Tile) entspricht 12,5 ft.

Markierungen: **ANNAHME** heißt, dass das Original den Wert nicht dokumentiert und er für den Nachbau gesetzt wurde. In den Daten steht dann `estimated: true` oder ein Kommentar.

## Erze

| Erz | Wert ($) | Gewicht (kg) | Punkte | ab Tiefe | häufig ab |
|---|---|---|---|---|---|
| Ironium | 30 | 10 | 1.500 | 25 | 25 |
| Bronzium | 60 | 10 | 3.000 | 25 | 25 |
| Silverium | 100 | 10 | 5.000 | 25 | 25 |
| Goldium | 250 | 20 | 12.500 | 25 | 250 |
| Platinum | 750 | 30 | 37.500 | 800 | 1.700 |
| Einsteinium | 2.000 | 40 | 100.000 | 1.600 | 2.600 |
| Emerald | 5.000 | 60 | 250.000 | 2.400 | 4.000 |
| Ruby | 20.000 | 80 | 1.000.000 | 4.000 | 4.800 |
| Diamond | 100.000 | 100 | 5.000.000 | 4.400 | 5.700 |
| Amazonite | 500.000 | 120 | 5.000.000 | 5.500 | 6.200 |

Jedes Erz belegt 1 cu ft Frachtraum. Das Gewicht macht die Kapsel beim Steigen träger.

## Fundstücke (sofortige Auszahlung)

| Fund | Wert ($) | Fundtiefen (Beispiele) |
|---|---|---|
| Dinosaur Bones | 1.000 | 1.949 |
| Treasure | 5.000 | 2.280 |
| Martian Skeleton | 10.000 | 2.174, 2.487 |
| Religious Artifact | 50.000 | 1.600, 2.425, 3.575 |

## Upgrades (Junk Shop)

Alle Kategorien nutzen dieselben Preisstufen: 750, 2.000, 5.000, 20.000, 100.000, 500.000 $. Der Radiator hat keine 750-$-Stufe, der Frachtraum keine 500.000-$-Stufe.

| Preis | Bohrer (ft/s) | Hülle (HP) | Motor (PS) | Tank (L) | Kühler (%) | Fracht (cu ft) |
|---|---|---|---|---|---|---|
| Serie | Stock, ~20 (ANNAHME, "< 28") | 10 | Stock, ~150 (ANNAHME, "< 160") | Micro, 10 | Stock Fan, 0 | Micro, 7 |
| 750 | Silvide, 28 | Ironium, 17 | V4 1600 cc, 160 | Medium, 15 | – | Medium, 15 |
| 2.000 | Goldium, 40 | Bronzium, 30 | V4 2.0 Ltr Turbo, 170 | Huge, 25 | Dual Fans, 10 | Huge, 25 |
| 5.000 | Emerald, 50 | Steel, 50 | V6 3.8 Ltr, 180 | Gigantic, 40 | Single Turbine, 25 | Gigantic, 40 |
| 20.000 | Ruby, 70 | Platinum, 80 | V8 Supercharged 5.0 Ltr, 190 | Titanic, 60 | Dual Turbines, 40 | Titanic, 70 |
| 100.000 | Diamond, 95 | Einsteinium, 120 | V12 6.0 Ltr, 200 | Leviathan, 100 | Puron Cooling, 60 | Leviathan, 120 |
| 500.000 | Amazonite, 120 | Energy-Shielded, 180 | V16 Jag, 210 | Liquid Compression, 150 | Tri-Turbine Freon Array, 80 | – |

Nur in der späteren Goldium Edition gibt es geheime Baupläne (Fuel Integrator, Hyper-Drive, Magma Converter, Portable Wormhole, Regenerative Hull, Multi-Drill). Sie stehen getrennt in `goldiumBlueprints` und gehören nicht zum Original von 2004.

## Items

| Item | Preis ($) | Taste | Wirkung |
|---|---|---|---|
| Reserve Fuel Tank | 2.000 | F | +25 L Treibstoff |
| Hull Repair Nanobots | 7.500 | R | +30 HP |
| Dynamite | 2.000 | X | sprengt 3x3 Felder (auch Felsen) |
| Plastic Explosives | 5.000 | C | sprengt 5x5 Felder |
| Quantum Teleporter | 2.000 | Q | zufällig über die Oberfläche, Landung kann schaden |
| Matter Transmitter | 10.000 | M | sicher neben die Tankstelle |

## Preise und Start

- Treibstoff: **1 $ pro Liter**, Schnellwahl 5 / 10 / 25 / 50 $ / Volltanken.
- Reparatur: **15 $ pro HP**, Schnellwahl 50 / 100 / 200 / 500 $ / Komplett.
- Startgeld 20 $ (Goldium Edition 0 $), Tank 10 L, Hülle 10 HP.
- Gebäude an der Oberfläche: Fuel Station, Mineral Processing, Junk Shop, Repair Shop.

## Gefahren

| Gefahr | ab Tiefe | Details |
|---|---|---|
| Felsen | 1.500 bis 1.600 ft | nicht bohrbar, nur sprengen |
| Lava | 3.100 bis 4.200 ft (Quellen uneinig; im 2. Durchgang ab 3.300 ft) | trifft beim Durchbohren zweimal, reduziert um Kühler-%. Schadenshöhe nicht dokumentiert, ANNAHME 30 pro Treffer |
| Gas | 4.500 bis 5.274 ft (in den Daten 4.700) | unsichtbar, explodiert nach ca. 5 ft Bohren, erste dokumentierte Explosion 50 Schaden |
| Erdbeben | nach der 1.000-ft-Nachricht | nur beim Verlassen eines Shops, verschüttet Tunnel, kein Schaden |
| Höhenmesser | ab 5.812 ft | zeigt flackernde Fragezeichen |
| Fallschaden | – | nicht beziffert, Engine-Entscheidung |

## Welt

- Ein Feld = 12,5 ft (8 Felder = 100 ft).
- Grund bei 7.300 ft (Zeile 584), darunter der Bossraum mit Anzeige -66.666 ft.
- Breite ist nirgends dokumentiert. ANNAHME: 38 Felder.

## Story (Funksprüche)

| Tiefe | Absender | Inhalt | Bonus ($) |
|---|---|---|---|
| 0 | Mr. Natas | Begrüßung, Kapsel wurde nicht betankt, zur Tankstelle | – |
| 500 | Mr. Natas | Lob | 1.000 |
| 1.000 | Mr. Natas | Lob, Warnung vor Erdbeben | 3.000 |
| 1.750 | Unbekannt | gestörtes Signal | – |
| 2.100 | Kapsel #3422-2 | Kollege will bald in Rente | – |
| 2.500 | Unbekannt | Notruf | – |
| 3.100 | Kapsel #3422-2 | Tipp: Kühler gegen Lava aufrüsten | – |
| 3.500 | Mr. Natas | Bonus, Warnung vor Gas, Höhenmesser nur bis ~6.000 ft | 20.000 (eine Quelle: 25.000) |
| 4.100 | Kapsel #3422-2 | letzte Nachricht, eingeschlossen | – |
| 4.500 | Kapsel #10043 | findet "das Motherload", dann Stille | – |
| 6.200 | Mr. Natas | Verstoß gegen den Arbeitsvertrag, umkehren | – |
| 7.000 | Mr. Natas | letzte Warnung, sonst gefeuert | – |
| 7.300 | Mr. Natas | offenbart seine Absicht, Bosskampf | – |

Die Texte in `story.js` sind eigene deutsche Nacherzählungen, keine wörtlichen Zitate.

Easter Eggs beim Hochfliegen: 5.000 ft Mr. Dog (+5.000 $, Goldium Edition), 10.000 ft Gott (Schutzengel, halbiert Schaden), 100.000 ft Gott.

## Endboss

- Phase 1: Mr. Natas, 1.000 HP. Phase 2: Satan, 2.000 HP.
- Nur mit Sprengstoff aus nächster Nähe; Plastiksprengstoff macht laut Guides ca. 240 Schaden.
- Belohnungen nach dem Sieg: Kevlar Suit 50.000, Staff of Hell 100.000, Laser Monocle 200.000, Satan's Hooves 300.000, Satan's Horns 400.000, beide Evil Eyes je 500.000, Boiler of Eternal Infernos 600.000, Belohnung der Marsbewohner 1.000.000, Hälfte der Firmenanteile 25.000.000 $.
- Neuer Durchgang danach: Erzpreise geteilt durch die Durchgangsnummer (1/2, 1/3), Punkte und Boss-HP mal Durchgangsnummer. Fundstücke behalten ihren Wert.

## Cheats (Original)

`blingbling` +100.000 $, `penetrable` Hülle +1, `digdug` Bohrer +1, `warp9` Motor +1, `guzzle` Tank +1, `toocool` Kühler +1, `supersize` Fracht +1, `fillerup` volltanken, `ntouchable` Taste 0 = alles maximal und Kern-Teleporter.

## Quellen

- [Motherload Wiki: Minerals](https://motherload.fandom.com/wiki/Minerals) (Erze, Gewichte, Tiefen)
- [xight.org Memo zu Motherload](https://memo.xight.org/2004-10-19-8) (Treibstoff 1 $/L, Reparatur 15 $/HP, Tile = 12,5 ft, Fundstücke)
- [XGen Studios Wiki: Motherload](https://xgenstudios.fandom.com/wiki/Motherload) (Tasten, Boss-HP, 3.500-ft-Bonus)
- [Cyberly Walkthrough](https://www.cyberly.org/game-cheats/pc-walkthroughs/motherload.html) (Upgrades, Items, Story, Belohnungen)
- [Cheatbook: MotherLoad](https://www.cheatbook.de/files/motherload.htm) (Cheats, Easter Eggs)
- [Motherload Wiki: Ancient Blueprints](https://motherload1.fandom.com/wiki/Ancient_Blueprints) (Goldium Edition)
- [Wikipedia-Archiv 2007: MotherLoad](https://wikipedia2007.classicistranieri.com/m/o/t/MotherLoad_1aac.html) (Durchgänge, Story)
