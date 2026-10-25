# Motherload

Browser-Nachbau des Miniclip-Klassikers Motherload (XGen Studios, 2004) mit eigenen Grafiken und Sounds.
Reines HTML5 Canvas + ES-Module, kein Build-Schritt.

## Starten

Wegen der ES-Module braucht der Browser einen kleinen Webserver:

```sh
python3 -m http.server 8000
# dann http://localhost:8000/ öffnen
```

## Steuerung

| Taste | Aktion |
| --- | --- |
| Pfeiltasten / WASD | Fahren, Fliegen (hoch), Bohren (runter oder seitlich gegen die Wand) |
| F / R | Reservetank / Reparatur-Nanobots |
| X / C | Dynamit / Plastiksprengstoff |
| Q / M | Quanten-Teleporter / Materie-Transmitter |
| Esc / P | Pause |

Auf Touch-Geräten erscheint ein Steuerkreuz. Fahr auf ein Gebäude, um es zu betreten. Die Original-Cheats (z.B. `blingbling`) lassen sich während des Spiels eintippen.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/engine/` | Welt-Erzeugung, Physik, Bohren, Gefahren, Items, Endkampf, Speichern, Renderer, Eingabe |
| `src/data/` | Originalwerte: Erze, Upgrades, Items, Preise, Story, Boss (siehe `docs/original-werte.md`) |
| `src/ui/` | HUD, Gebäude-Menüs, Funksprüche, Bildschirme |
| `src/audio/` | Prozedurale Sounds und Musik (Web Audio) |
| `assets/graphics/` | Pixel-Art-Sprites (32x32 pro Feld) |

Der Spielstand liegt im `localStorage` des Browsers (Autosave beim Verlassen eines Gebäudes und an der Speicherstation).
