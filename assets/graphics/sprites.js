// AUTOMATISCH ERZEUGT von assets/graphics/tools/generate.py - nicht von Hand aendern.
// Funktioniert ohne Server (auch per file://), da das Manifest eingebettet ist.
(function (global) {
  var TILE = 32;
  var SPRITES = {
  "bg_sky": {
    "file": "backgrounds/bg_sky.png",
    "frames": 1,
    "h": 480,
    "note": "Oberflaechen-Himmel, 640x480",
    "w": 640
  },
  "bg_underground": {
    "file": "backgrounds/bg_underground.png",
    "frames": 1,
    "h": 32,
    "note": "kachelbar",
    "w": 32
  },
  "boss_natas": {
    "file": "bosses/boss_natas.png",
    "frames": 2,
    "h": 96,
    "note": "Mr. Natas in Kampfmaschine; schaut nach links, Schwebe-Animation",
    "w": 96
  },
  "boss_satan": {
    "file": "bosses/boss_satan.png",
    "frames": 2,
    "h": 96,
    "note": "Teufelsgestalt (zweite Phase); schaut nach links, Schwebe-Animation",
    "w": 96
  },
  "building_fuel": {
    "file": "buildings/building_fuel.png",
    "frames": 1,
    "h": 96,
    "note": "Tankstelle",
    "w": 128
  },
  "building_mineral": {
    "file": "buildings/building_mineral.png",
    "frames": 1,
    "h": 96,
    "note": "Erzverkauf",
    "w": 128
  },
  "building_repair": {
    "file": "buildings/building_repair.png",
    "frames": 1,
    "h": 96,
    "note": "Werkstatt",
    "w": 128
  },
  "building_save": {
    "file": "buildings/building_save.png",
    "frames": 1,
    "h": 96,
    "note": "Speicherpunkt",
    "w": 128
  },
  "building_upgrade": {
    "file": "buildings/building_upgrade.png",
    "frames": 1,
    "h": 96,
    "note": "Upgrade-Shop",
    "w": 128
  },
  "fx_dust": {
    "file": "fx/fx_dust.png",
    "frames": 4,
    "h": 32,
    "note": "Bohrstaub/Erdbrocken",
    "w": 32
  },
  "fx_explosion": {
    "file": "fx/fx_explosion.png",
    "frames": 6,
    "h": 32,
    "w": 32
  },
  "fx_fireball": {
    "file": "fx/fx_fireball.png",
    "frames": 4,
    "h": 16,
    "note": "16x16, fliegt nach links (fuer rechts spiegeln)",
    "w": 16
  },
  "fx_gas": {
    "file": "fx/fx_gas.png",
    "frames": 4,
    "h": 32,
    "w": 32
  },
  "icon_artifact_dinosaur": {
    "file": "icons/icon_artifact_dinosaur.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_artifact_relic": {
    "file": "icons/icon_artifact_relic.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_artifact_skeleton": {
    "file": "icons/icon_artifact_skeleton.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_artifact_treasure": {
    "file": "icons/icon_artifact_treasure.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_amazonite": {
    "file": "icons/icon_ore_amazonite.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_bronzium": {
    "file": "icons/icon_ore_bronzium.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_diamond": {
    "file": "icons/icon_ore_diamond.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_einsteinium": {
    "file": "icons/icon_ore_einsteinium.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_emerald": {
    "file": "icons/icon_ore_emerald.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_goldium": {
    "file": "icons/icon_ore_goldium.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_ironium": {
    "file": "icons/icon_ore_ironium.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_platinum": {
    "file": "icons/icon_ore_platinum.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_ruby": {
    "file": "icons/icon_ore_ruby.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "icon_ore_silverium": {
    "file": "icons/icon_ore_silverium.png",
    "frames": 1,
    "h": 16,
    "w": 16
  },
  "pod_drill_down": {
    "file": "pod/pod_drill_down.png",
    "frames": 3,
    "h": 32,
    "w": 32
  },
  "pod_drill_side": {
    "file": "pod/pod_drill_side.png",
    "frames": 3,
    "h": 32,
    "w": 32
  },
  "pod_drive": {
    "file": "pod/pod_drive.png",
    "frames": 3,
    "h": 32,
    "note": "Fahren, Raupen laufen",
    "w": 32
  },
  "pod_fly": {
    "file": "pod/pod_fly.png",
    "frames": 3,
    "h": 32,
    "note": "Propeller + Duesenflamme",
    "w": 32
  },
  "pod_idle": {
    "file": "pod/pod_idle.png",
    "frames": 1,
    "h": 32,
    "note": "schaut nach rechts; fuer links horizontal spiegeln",
    "w": 32
  },
  "pod_wreck": {
    "file": "pod/pod_wreck.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_artifact_dinosaur": {
    "file": "tiles/tile_artifact_dinosaur.png",
    "frames": 1,
    "h": 32,
    "note": "Dinosaurier-Fossil",
    "w": 32
  },
  "tile_artifact_relic": {
    "file": "tiles/tile_artifact_relic.png",
    "frames": 1,
    "h": 32,
    "note": "religioeses Artefakt",
    "w": 32
  },
  "tile_artifact_skeleton": {
    "file": "tiles/tile_artifact_skeleton.png",
    "frames": 1,
    "h": 32,
    "note": "Marsianer-Skelett",
    "w": 32
  },
  "tile_artifact_treasure": {
    "file": "tiles/tile_artifact_treasure.png",
    "frames": 1,
    "h": 32,
    "note": "vergrabener Schatz",
    "w": 32
  },
  "tile_dirt_0": {
    "file": "tiles/tile_dirt_0.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_1": {
    "file": "tiles/tile_dirt_1.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_2": {
    "file": "tiles/tile_dirt_2.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_3": {
    "file": "tiles/tile_dirt_3.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_core_0": {
    "file": "tiles/tile_dirt_core_0.png",
    "frames": 1,
    "h": 32,
    "note": "sehr tiefe Schichten (Kern-Naehe)",
    "w": 32
  },
  "tile_dirt_core_1": {
    "file": "tiles/tile_dirt_core_1.png",
    "frames": 1,
    "h": 32,
    "note": "sehr tiefe Schichten (Kern-Naehe)",
    "w": 32
  },
  "tile_dirt_core_2": {
    "file": "tiles/tile_dirt_core_2.png",
    "frames": 1,
    "h": 32,
    "note": "sehr tiefe Schichten (Kern-Naehe)",
    "w": 32
  },
  "tile_dirt_core_3": {
    "file": "tiles/tile_dirt_core_3.png",
    "frames": 1,
    "h": 32,
    "note": "sehr tiefe Schichten (Kern-Naehe)",
    "w": 32
  },
  "tile_dirt_deep_0": {
    "file": "tiles/tile_dirt_deep_0.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_deep_1": {
    "file": "tiles/tile_dirt_deep_1.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_deep_2": {
    "file": "tiles/tile_dirt_deep_2.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_dirt_deep_3": {
    "file": "tiles/tile_dirt_deep_3.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_gas": {
    "file": "tiles/tile_gas.png",
    "frames": 1,
    "h": 32,
    "note": "Gastasche; bewusst unauffaellig (im Original unsichtbar - Engine kann auch tile_dirt_deep_* nutzen)",
    "w": 32
  },
  "tile_grass": {
    "file": "tiles/tile_grass.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_lava": {
    "file": "tiles/tile_lava.png",
    "frames": 4,
    "h": 32,
    "note": "animiert, ~6 fps",
    "w": 32
  },
  "tile_ore_amazonite": {
    "file": "tiles/tile_ore_amazonite.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_bronzium": {
    "file": "tiles/tile_ore_bronzium.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_diamond": {
    "file": "tiles/tile_ore_diamond.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_einsteinium": {
    "file": "tiles/tile_ore_einsteinium.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_emerald": {
    "file": "tiles/tile_ore_emerald.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_goldium": {
    "file": "tiles/tile_ore_goldium.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_ironium": {
    "file": "tiles/tile_ore_ironium.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_platinum": {
    "file": "tiles/tile_ore_platinum.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_ruby": {
    "file": "tiles/tile_ore_ruby.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_ore_silverium": {
    "file": "tiles/tile_ore_silverium.png",
    "frames": 1,
    "h": 32,
    "w": 32
  },
  "tile_rock": {
    "file": "tiles/tile_rock.png",
    "frames": 1,
    "h": 32,
    "note": "unzerstoerbarer Felsblock (nur mit Dynamit/C4)",
    "w": 32
  },
  "tile_tunnel": {
    "file": "tiles/tile_tunnel.png",
    "frames": 1,
    "h": 32,
    "w": 32
  }
};
  var images = {};

  // Laedt alle PNGs. basePath = Pfad zu assets/graphics/ relativ zur HTML-Seite.
  function loadSprites(basePath) {
    if (basePath == null) basePath = "assets/graphics/";
    var names = Object.keys(SPRITES);
    return Promise.all(names.map(function (name) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { images[name] = img; resolve(); };
        img.onerror = function () { reject(new Error("Sprite fehlt: " + name)); };
        img.src = basePath + SPRITES[name].file;
      });
    })).then(function () { return images; });
  }

  // Zeichnet Frame `frame` von Sprite `name` an (x, y). flip = horizontal spiegeln
  // (Pod nach links). scale skaliert pixelgenau.
  function drawSprite(ctx, name, frame, x, y, flip, scale) {
    var s = SPRITES[name], img = images[name];
    if (!s || !img) return;
    scale = scale || 1;
    var f = (frame || 0) % s.frames, w = s.w * scale, h = s.h * scale;
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, f * s.w, 0, s.w, s.h, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, f * s.w, 0, s.w, s.h, x, y, w, h);
    }
  }

  global.MotherloadSprites = { TILE: TILE, SPRITES: SPRITES, images: images,
                               loadSprites: loadSprites, drawSprite: drawSprite };
  if (typeof module !== "undefined") module.exports = global.MotherloadSprites;
})(typeof window !== "undefined" ? window : globalThis);
