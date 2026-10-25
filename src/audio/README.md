# Audio-Modul

Alle Sounds und die Musik werden zur Laufzeit mit der Web Audio API erzeugt. Es gibt keine Audiodateien und keine Original-Sounds aus dem Miniclip-Spiel. Das Modul ist reines ES-Modul ohne Abhängigkeiten.

Zum Anhören: `src/audio/demo.html` über einen lokalen Webserver öffnen (z.B. `npx serve .` oder `python3 -m http.server` im Repo-Root, dann `/src/audio/demo.html`).

## Einbinden

```js
import { GameAudio } from './audio/index.js';
```

Der Name ist bewusst `GameAudio` und nicht `Audio`, weil `Audio` der eingebaute Browser-Konstruktor ist.

Browser erlauben Ton erst nach einer Nutzeraktion. Das Modul hängt sich selbst an den ersten `keydown`/`pointerdown`. Wer sicher gehen will, ruft im Startbildschirm-Handler `GameAudio.unlock()` auf. Vorher sind alle Aufrufe stille No-ops, das Spiel muss nichts abfragen.

## Einmal-Sounds

```js
GameAudio.play(name, optionen?)
```

| Name          | Wann                                   | Optionen                          |
|---------------|----------------------------------------|-----------------------------------|
| `ore`         | Erz eingesammelt                       | `value` 0..1 (wertvoller = höher) |
| `explosion`   | Dynamit / C4                           | `size` 0.3..2                     |
| `impact`      | Harter Aufprall, Schaden               | `intensity` 0..1                  |
| `fuelWarning` | Einzelner Warnpieps (siehe auch unten) |                                   |
| `buy`         | Upgrade/Item gekauft                   |                                   |
| `sell`        | Erze verkauft                          | `count` 1..12 Münzen              |
| `denied`      | Zu wenig Geld, Laderaum voll           |                                   |
| `repair`      | Reparieren / Tanken                    |                                   |
| `teleport`    | Quanten-Teleporter                     |                                   |
| `gameOver`    | Fahrzeug zerstört                      |                                   |
| `click`       | Menü-/Shop-Button                      |                                   |

`GameAudio.sounds` liefert die Liste aller Namen.

## Dauerklänge

Diese dürfen jeden Frame aufgerufen werden, es wird nur bei Änderungen nachgeregelt.

```js
GameAudio.setDrilling(isDrilling, hardness); // hardness 0..1, z.B. nach Gesteinsart/Tiefe
GameAudio.setThrust(isFlyingUp);              // Propeller/Triebwerk
GameAudio.setFuelLow(fuel < tank * 0.2);      // piept alle 1,4 s, solange true
GameAudio.stopAllLoops();                     // bei Pause, Shop oder Game Over
```

## Musik

```js
GameAudio.startMusic('surface');  // oder 'underground'
GameAudio.setDepth(depthFt);        // Tiefe in Fuß; optional 2. Parameter maxFt (Standard 6000), ab da am düstersten
GameAudio.stopMusic();
```

Die Musik ist eine eigene, prozedural sequenzierte Komposition in a-Moll. An der Oberfläche läuft sie mit Beat und Arpeggio, mit zunehmender Tiefe wird sie langsamer, dunkler, die Percussion verschwindet und es tropft in der Höhle.

## Lautstärke und Mute

```js
GameAudio.toggleMute();   // gibt neuen Zustand zurück, z.B. für einen Mute-Button im UI
GameAudio.setMuted(true);
GameAudio.isMuted();
GameAudio.setSfxVolume(0.8);   // 0..1
GameAudio.setMusicVolume(0.45);
```

Das Modul belegt selbst keine Tasten (M ist im Spiel der Materie-Transmitter). Mute und Lautstärken werden in `localStorage` unter `motherload.audio` gespeichert. Ist der Tab im Hintergrund, wird der AudioContext pausiert.

## Beispiel im Game-Loop

```js
function update(dt) {
  GameAudio.setDrilling(player.isDrilling, tileHardness(player.drillTarget));
  GameAudio.setThrust(input.up && player.fuel > 0);
  GameAudio.setFuelLow(player.fuel / player.fuelMax < 0.2);
  GameAudio.setDepth(player.depthFt);
}

events.on('ore', (ore) => GameAudio.play('ore', { value: ore.price / 100000 }));
events.on('landing', (speed) => speed > SAFE_SPEED && GameAudio.play('impact', { intensity: speed / MAX_SPEED }));
```

## Dateien

- `index.js` öffentliche API, Einstellungen, Entsperren
- `engine.js` AudioContext, Busse (Master, SFX, Musik), Synth-Helfer
- `sfx.js` Einmal-Sounds
- `loops.js` Bohrer und Triebwerk
- `music.js` Sequencer für die Hintergrundmusik
- `demo.html` Testseite für alle Klänge
