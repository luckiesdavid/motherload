# UI: HUD, Gebäude und Bildschirme

Plain ES-Module, kein Build-Schritt. Die UI liegt als DOM-Overlay über dem Spiel-Canvas.
`src/ui/demo.html` zeigt alles ohne Engine (lokalen Server im Repo-Root starten, z.B.
`python3 -m http.server`, dann `/src/ui/demo.html` öffnen).

## Einbinden

```html
<link rel="stylesheet" href="src/ui/ui.css">
<div id="game" style="position:relative">
  <canvas></canvas>
  <div id="ui"></div>
</div>
```

```js
import { createUI } from './ui/index.js';
import * as data from './data/index.js';

const ui = createUI(document.getElementById('ui'), {
  data,                       // Sammel-Export aus src/data/index.js
  hasSave: () => engine.hasSave(),
  onAction: (type, payload) => { /* siehe unten */ },
});

// Spielschleife
ui.update(state);             // jeden Frame, HUD wird intern auf 10 Hz gedrosselt
if (ui.isBlocking()) { /* Physik und Steuerung pausieren */ }
```

## Methoden

| Methode | Zweck |
| --- | --- |
| `update(state)` | State übernehmen, HUD zeichnen, fällige Funksprüche auslösen, `state.maxDepth` pflegen |
| `openBuilding(id)` | `'fuel'`, `'mineral'`, `'upgrade'`, `'repair'` (Reparatur und Items), `'save'`; `'item'` ist Alias für `'repair'` |
| `closeMenu()` | Gebäudefenster schließen |
| `showMessage({ sender, title, text, reward })` | Funkspruch anzeigen (Warteschlange) |
| `showScreen(kind, info)` | `'title'`, `'pause'`, `'gameover'` (`info.reason`), `'win'` (`info.text`), `null` schließt; `info.hasSave` überschreibt `hasSave()` |
| `toast(text)` | kurze Einblendung, z.B. „Laderaum voll!“ |
| `isBlocking()` | `true`, solange Menü, Funkspruch oder Bildschirm offen ist |
| `destroy()` | DOM und Tastatur-Listener entfernen |

## onAction(type, payload)

| type | payload | Wer reagiert |
| --- | --- | --- |
| `newGame` | `{ state }` frisch aus `createState(data)` | Engine baut Welt, übernimmt oder ersetzt den State |
| `load` | `{}` | Engine lädt Spielstand und reicht ihn per `update()` weiter |
| `save` | `{}` | Engine speichert Welt und State |
| `pause` / `resume` / `quit` | `{}` | Engine pausiert bzw. kehrt zum Titel zurück |
| `useItem` | `{ id, item, engineEffect }` | bei `engineEffect: true` (Sprengstoff, Teleporter) führt die Engine den Effekt aus; Reservetank und Nanobots sind schon verrechnet |
| `purchase` | `{ kind: 'fuel'|'sell'|'upgrade'|'repair'|'item', ... }` | optional, z.B. für Sounds |
| `story` | `{ message }` | optional, z.B. `message.triggers === 'boss'` |
| `messageClosed` | `{ message }` | optional |
| `closeMenu` | `{}` | Engine gibt Steuerung frei |

## State

Gehört der Engine. Die UI verändert ihn nur über `transactions.js`:

```js
{
  money, depth /* ft, positiv nach unten */, maxDepth, fuel, hull,
  upgrades: { drill, hull, engine, fuel, radiator, cargo }, // Index in data.upgrades[slot]
  cargo: { [mineralId]: anzahl },  // Fundstücke zahlen sofort aus und landen nicht hier
  items: { [itemId]: anzahl },
  seenStory: [/* Indizes in data.story */],
}
```

Maximalwerte liefert `transactions.getStats(state, data)` (`fuelMax`, `hullMax`, `cargoMax`, `drillSpeed`,
`enginePower`, `heatResistance`). Der Frachtraum zählt Erze (1 Erz = 1 cu ft), das Gewicht
(`cargoWeight`) ist nur für die Physik. Zum Aufsammeln: `transactions.addMineral(state, data, id)`.

## Tasten

`F` `R` `X` `C` `Q` `M` setzen Items ein (aus `data.items[].key`), `Esc`/`P` pausiert,
`Esc` schließt Menüs, `Enter`/`Leertaste` bestätigt Funksprüche. Die UI belegt keine weiteren Tasten.
