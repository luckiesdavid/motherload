# Grafiken (Pixel-Art)

Eigene, originalnahe Pixel-Art für den Motherload-Nachbau. Es sind **keine Original-Assets** von Miniclip enthalten; alles wird von `tools/generate.py` (Python + Pillow) gezeichnet.

- Tilegröße: **32x32 px**. Zum Skalieren `ctx.imageSmoothingEnabled = false` setzen.
- Animationen liegen als horizontaler Strip in einer PNG (Frame `i` liegt bei `x = i * w`).
- Der Pod schaut nach **rechts**. Für links horizontal spiegeln (`drawSprite(..., flip=true)`).
- `preview.html` im Browser öffnen, um alle Sprites und eine Beispielszene zu sehen.

## Benutzung in der Engine

```html
<script src="assets/graphics/sprites.js"></script>
<script>
  MotherloadSprites.loadSprites("assets/graphics/").then(() => {
    // ctx, name, frame, x, y, flip, scale
    MotherloadSprites.drawSprite(ctx, "tile_ore_goldium", 0, 64, 96);
    MotherloadSprites.drawSprite(ctx, "pod_drill_side", frame, podX, podY, facingLeft);
  });
</script>
```

`sprites.json` enthält dasselbe Manifest (`file`, `w`, `h`, `frames`, optional `note`) für Tools oder `fetch`.

## Sprite-Namen

| Name | Größe | Frames | Inhalt |
|---|---|---|---|
| `tile_dirt_0..3` | 32x32 | 1 | Erde, obere Schicht (4 Varianten) |
| `tile_dirt_deep_0..3` | 32x32 | 1 | Erde, mittlere Tiefe |
| `tile_dirt_core_0..3` | 32x32 | 1 | Erde, sehr tief |
| `tile_grass` | 32x32 | 1 | Oberste Erdreihe mit Grasnarbe |
| `tile_tunnel` | 32x32 | 1 | Ausgegrabenes Feld (Hintergrund) |
| `tile_rock` | 32x32 | 1 | Felsblock, nicht bohrbar |
| `tile_lava` | 32x32 | 4 | Lava, animiert (~6 fps) |
| `tile_gas` | 32x32 | 1 | Gastasche, fast wie Erde (Falle) |
| `tile_ore_ironium` | 32x32 | 1 | Ironium |
| `tile_ore_bronzium` | 32x32 | 1 | Bronzium |
| `tile_ore_silverium` | 32x32 | 1 | Silverium |
| `tile_ore_goldium` | 32x32 | 1 | Goldium |
| `tile_ore_platinum` | 32x32 | 1 | Platinum |
| `tile_ore_einsteinium` | 32x32 | 1 | Einsteinium (leuchtet) |
| `tile_ore_emerald` | 32x32 | 1 | Smaragd |
| `tile_ore_ruby` | 32x32 | 1 | Rubin |
| `tile_ore_diamond` | 32x32 | 1 | Diamant |
| `tile_ore_amazonite` | 32x32 | 1 | Amazonit |
| `tile_artifact_dinosaur` | 32x32 | 1 | Dinosaurier-Fossil |
| `tile_artifact_treasure` | 32x32 | 1 | Schatztruhe |
| `tile_artifact_skeleton` | 32x32 | 1 | Marsianer-Skelett |
| `tile_artifact_relic` | 32x32 | 1 | Religiöses Relikt |
| `icon_ore_*`, `icon_artifact_*` | 16x16 | 1 | Icons für Laderaum/HUD (gleiche Namen wie die Tiles) |
| `pod_idle` | 32x32 | 1 | Pod steht |
| `pod_drive` | 32x32 | 3 | Pod fährt (Raupen laufen) |
| `pod_drill_side` | 32x32 | 3 | Pod bohrt seitwärts |
| `pod_drill_down` | 32x32 | 3 | Pod bohrt nach unten |
| `pod_fly` | 32x32 | 3 | Pod fliegt (Propeller + Düse) |
| `pod_wreck` | 32x32 | 1 | Zerstörter Pod |
| `fx_explosion` | 32x32 | 6 | Explosion (Gas, Dynamit, Pod-Zerstörung) |
| `fx_dust` | 32x32 | 4 | Bohrstaub |
| `fx_gas` | 32x32 | 4 | Gaswolke |
| `fx_fireball` | 16x16 | 4 | Feuerball der Bosse, fliegt nach links |
| `boss_natas` | 96x96 | 2 | Mr. Natas in seiner Kampfmaschine, schaut nach links |
| `boss_satan` | 96x96 | 2 | Teufelsgestalt (zweite Phase), schaut nach links |
| `building_fuel` | 128x96 | 1 | Tankstelle |
| `building_mineral` | 128x96 | 1 | Erzverkauf |
| `building_upgrade` | 128x96 | 1 | Upgrade-Shop |
| `building_repair` | 128x96 | 1 | Werkstatt |
| `building_save` | 128x96 | 1 | Speicherpunkt |
| `bg_sky` | 640x480 | 1 | Mars-Himmel mit Monden und Bergen |
| `bg_underground` | 32x32 | 1 | Kachelbarer Untergrund-Hintergrund |

Gebäude stehen mit der Unterkante (y = 95) auf der Grasreihe; die Einfahrt ist bei x = 44..83.

## Neu erzeugen

```bash
pip install pillow
python3 assets/graphics/tools/generate.py
```

Das Skript ist deterministisch und schreibt alle PNGs, `sprites.json` und `sprites.js` neu.
