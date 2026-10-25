#!/usr/bin/env python3
"""Erzeugt alle Pixel-Art-Grafiken fuer den Motherload-Nachbau.

Alle Grafiken sind eigene Zeichnungen (keine Original-Assets). Das Skript ist
deterministisch: gleicher Seed -> identische PNGs.

    python3 assets/graphics/tools/generate.py

Ausgabe: assets/graphics/*/*.png und assets/graphics/sprites.json
"""
import json
import math
import os
import random

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = 32  # Tilegroesse in Pixeln

MANIFEST = {}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def shade(c, f):
    """f > 1 heller, f < 1 dunkler."""
    if f >= 1:
        return tuple(min(255, int(v + (255 - v) * (f - 1))) for v in c[:3]) + (c[3],)
    return tuple(int(v * f) for v in c[:3]) + (c[3],)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


def save(img, folder, name, frames=1, fw=None, fh=None, note=""):
    path = os.path.join(ROOT, folder, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)
    entry = {
        "file": f"{folder}/{name}.png",
        "w": fw or img.width // frames,
        "h": fh or img.height,
        "frames": frames,
    }
    if note:
        entry["note"] = note
    MANIFEST[name] = entry


def strip(frames):
    w, h = frames[0].size
    out = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        out.paste(f, (i * w, 0))
    return out


# ---------------------------------------------------------------- Erde

DIRT = rgb("#8a5a2e")
DIRT_DEEP = rgb("#5e3a24")
DIRT_CORE = rgb("#4a2a2a")


def dirt_tile(seed, base, grit=True):
    r = random.Random(seed)
    img = Image.new("RGBA", (T, T), base)
    px = img.load()
    # Grundrauschen
    for y in range(T):
        for x in range(T):
            n = r.random()
            if n < 0.18:
                px[x, y] = shade(base, 0.86)
            elif n < 0.26:
                px[x, y] = shade(base, 1.1)
    # dunkle Flecken
    for _ in range(5):
        cx, cy = r.randrange(T), r.randrange(T)
        for dx in range(-1, 2):
            for dy in range(-1, 1):
                if r.random() < 0.7:
                    px[(cx + dx) % T, (cy + dy) % T] = shade(base, 0.72)
    # Kieselsteine mit Lichtkante
    if grit:
        for _ in range(r.randint(2, 4)):
            cx, cy = r.randrange(1, T - 2), r.randrange(1, T - 2)
            stone = shade(mix(base, rgb("#9a8a78"), 0.5), 1.0)
            px[cx, cy] = stone
            px[cx + 1, cy] = stone
            px[cx, cy - 1] = shade(stone, 1.25)
            px[cx + 1, cy + 1] = shade(base, 0.6)
    # leichte Kanten-Schattierung fuer Blockoptik
    for i in range(T):
        px[i, 0] = shade(px[i, 0], 1.08)
        px[0, i] = shade(px[0, i], 1.05)
        px[i, T - 1] = shade(px[i, T - 1], 0.8)
        px[T - 1, i] = shade(px[T - 1, i], 0.85)
    return img


def make_dirt():
    for i in range(4):
        save(dirt_tile(100 + i, DIRT), "tiles", f"tile_dirt_{i}")
        save(dirt_tile(200 + i, DIRT_DEEP), "tiles", f"tile_dirt_deep_{i}")
        save(dirt_tile(300 + i, DIRT_CORE), "tiles", f"tile_dirt_core_{i}",
             note="sehr tiefe Schichten (Kern-Naehe)")

    # Grasnarbe / Oberflaeche
    img = dirt_tile(400, DIRT)
    px = img.load()
    r = random.Random(401)
    greens = [rgb("#3f8f2f"), rgb("#57a83a"), rgb("#2f6e25")]
    for x in range(T):
        depth = 5 + r.randint(0, 3)
        for y in range(depth):
            px[x, y] = greens[(x + y + r.randint(0, 1)) % 3] if y < depth - 1 else shade(greens[2], 0.8)
        if r.random() < 0.35:
            px[x, 0] = rgb("#7cc650")
    save(img, "tiles", "tile_grass")

    # ausgegrabener Tunnel (Hintergrund hinter dem Pod)
    r = random.Random(500)
    base = rgb("#2b1a10")
    img = Image.new("RGBA", (T, T), base)
    px = img.load()
    for y in range(T):
        for x in range(T):
            n = r.random()
            if n < 0.15:
                px[x, y] = shade(base, 1.18)
            elif n < 0.25:
                px[x, y] = shade(base, 0.8)
    save(img, "tiles", "tile_tunnel")
    save(img.copy(), "backgrounds", "bg_underground", note="kachelbar")


def make_rock():
    r = random.Random(600)
    img = dirt_tile(601, DIRT_DEEP, grit=False)
    d = ImageDraw.Draw(img)
    stone = rgb("#6f6a66")
    # Polygon-Felsbrocken
    pts = [(3, 12), (8, 4), (18, 2), (27, 6), (30, 15), (28, 26), (19, 30), (8, 29), (2, 22)]
    d.polygon(pts, fill=stone, outline=rgb("#2c2826"))
    px = img.load()
    for y in range(T):
        for x in range(T):
            if px[x, y][:3] == stone[:3]:
                n = r.random()
                light = (x + y) < 26
                c = shade(stone, 1.2 if light else 0.85)
                if n < 0.2:
                    c = shade(c, 0.85)
                px[x, y] = c
    # Risse
    d.line([(12, 8), (15, 14), (13, 19), (17, 24)], fill=rgb("#3a3532"))
    d.line([(22, 10), (20, 16)], fill=rgb("#3a3532"))
    # Glanzpunkte
    for p in [(9, 7), (10, 7), (8, 8), (19, 4)]:
        px[p] = rgb("#b8b2ac")
    save(img, "tiles", "tile_rock", note="unzerstoerbarer Felsblock (nur mit Dynamit/C4)")


# ---------------------------------------------------------------- Erze

ORES = {
    # name: (Grundfarbe, Highlight, Form, Basis-Erde)
    "ironium": ("#6b4e3c", "#a07a62", "chunk", DIRT),
    "bronzium": ("#b0662a", "#f0a050", "chunk", DIRT),
    "silverium": ("#a9b4bf", "#f2f6fa", "chunk", DIRT),
    "goldium": ("#d9a520", "#fff070", "chunk", DIRT),
    "platinum": ("#c6dcef", "#ffffff", "chunk", DIRT_DEEP),
    "einsteinium": ("#4fc22b", "#c8ff80", "glow", DIRT_DEEP),
    "emerald": ("#16a35a", "#8affc0", "gem", DIRT_DEEP),
    "ruby": ("#c4182e", "#ff8a95", "gem", DIRT_CORE),
    "diamond": ("#9fe8ff", "#ffffff", "gem", DIRT_CORE),
    "amazonite": ("#1fb5a8", "#a5fff4", "gem", DIRT_CORE),
}


def draw_chunk(px, cx, cy, size, col, hi, r):
    dark = shade(col, 0.6)
    for y in range(-size, size + 1):
        for x in range(-size, size + 1):
            if x * x + y * y * 1.3 <= size * size + r.random() * 2:
                c = col
                if x + y < -size // 2:
                    c = hi
                elif x + y > size // 2:
                    c = dark
                px[cx + x, cy + y] = c
    px[cx - size // 2, cy - size // 2] = (255, 255, 255, 255)


def draw_gem(px, cx, cy, size, col, hi):
    dark = shade(col, 0.55)
    outline = shade(col, 0.3)
    for y in range(-size, size + 1):
        w = size - abs(y)
        for x in range(-w, w + 1):
            c = col
            if y < 0 and x <= 0:
                c = hi
            elif y > 0 and x >= 0:
                c = dark
            elif y > 0:
                c = shade(col, 0.8)
            px[cx + x, cy + y] = c
        px[cx - w - 1, cy + y] = outline
        px[cx + w + 1, cy + y] = outline
    px[cx, cy - size - 1] = outline
    px[cx, cy + size + 1] = outline
    px[cx - 1, cy - size // 2] = (255, 255, 255, 255)


def ore_tile(name, col, hi, form, base, seed):
    r = random.Random(seed)
    img = dirt_tile(seed, base, grit=False)
    px = img.load()
    col, hi = rgb(col), rgb(hi)
    if form == "chunk":
        spots = [(10, 11, 5), (21, 19, 5), (11, 23, 3), (23, 8, 3)]
        for cx, cy, s in spots:
            draw_chunk(px, cx, cy, s, col, hi, r)
    elif form == "glow":
        # radioaktiver Schimmer
        for y in range(T):
            for x in range(T):
                dd = math.hypot(x - 16, y - 16)
                if dd < 13:
                    px[x, y] = mix(px[x, y], col, max(0, 0.45 - dd / 30))
        for cx, cy, s in [(12, 12, 4), (20, 20, 4), (21, 10, 2), (11, 22, 2)]:
            draw_chunk(px, cx, cy, s, col, hi, r)
    else:  # gem
        draw_gem(px, 16, 15, 7, col, hi)
        draw_gem(px, 7, 25, 3, col, hi)
        draw_gem(px, 26, 6, 2, col, hi)
        # Funkeln
        for sx, sy in [(24, 22), (6, 7)]:
            px[sx, sy] = (255, 255, 255, 255)
            px[sx - 1, sy] = px[sx + 1, sy] = shade(hi, 1.0)
            px[sx, sy - 1] = px[sx, sy + 1] = shade(hi, 1.0)
    return img


def make_ores():
    for i, (name, (col, hi, form, base)) in enumerate(ORES.items()):
        save(ore_tile(name, col, hi, form, base, 700 + i * 7), "tiles", f"tile_ore_{name}")
        # Icon fuer HUD/Laderaum (16x16, ohne Erde)
        icon = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
        px = icon.load()
        r = random.Random(800 + i)
        if form == "gem":
            draw_gem(px, 8, 8, 5, rgb(col), rgb(hi))
        else:
            draw_chunk(px, 8, 8, 5, rgb(col), rgb(hi), r)
        save(icon, "icons", f"icon_ore_{name}")


# ---------------------------------------------------------------- Artefakte

def make_artifacts():
    bone = rgb("#e8dfc8")
    bone_d = rgb("#a89c80")

    # Dinosaurier-Knochen
    img = dirt_tile(900, DIRT_DEEP, grit=False)
    d = ImageDraw.Draw(img)
    d.line([(5, 22), (26, 10)], fill=bone, width=3)
    for (x, y) in [(5, 22), (26, 10)]:
        d.ellipse([x - 3, y - 3, x + 1, y + 1], fill=bone, outline=bone_d)
        d.ellipse([x - 1, y - 1, x + 3, y + 3], fill=bone, outline=bone_d)
    d.line([(7, 23), (25, 13)], fill=bone_d)
    save(img, "tiles", "tile_artifact_dinosaur", note="Dinosaurier-Fossil")

    # Schatztruhe
    img = dirt_tile(901, DIRT_DEEP, grit=False)
    d = ImageDraw.Draw(img)
    d.rectangle([6, 13, 25, 26], fill=rgb("#7a4518"), outline=rgb("#2e1606"))
    d.rectangle([6, 9, 25, 14], fill=rgb("#94561f"), outline=rgb("#2e1606"))
    d.line([(6, 18), (25, 18)], fill=rgb("#d9a520"))
    d.line([(10, 9), (10, 26)], fill=rgb("#d9a520"))
    d.line([(21, 9), (21, 26)], fill=rgb("#d9a520"))
    d.rectangle([14, 15, 17, 19], fill=rgb("#ffe066"), outline=rgb("#6b4a00"))
    for p in [(12, 7), (19, 6), (16, 8)]:
        img.putpixel(p, rgb("#fff4a0"))
    save(img, "tiles", "tile_artifact_treasure", note="vergrabener Schatz")

    # Marsianer-Skelett (Schaedel mit grossen Augen)
    img = dirt_tile(902, DIRT_CORE, grit=False)
    d = ImageDraw.Draw(img)
    d.ellipse([7, 4, 25, 22], fill=bone, outline=bone_d)
    d.ellipse([9, 10, 14, 16], fill=rgb("#1a0f0a"))
    d.ellipse([18, 10, 23, 16], fill=rgb("#1a0f0a"))
    d.rectangle([12, 21, 20, 25], fill=bone, outline=bone_d)
    for x in (14, 16, 18):
        d.line([(x, 22), (x, 25)], fill=bone_d)
    d.line([(16, 3), (16, 0)], fill=bone)  # Antenne
    img.putpixel((16, 0), rgb("#9fe8ff"))
    save(img, "tiles", "tile_artifact_skeleton", note="Marsianer-Skelett")

    # Religioeses Relikt (Goldstatue)
    img = dirt_tile(903, DIRT_CORE, grit=False)
    d = ImageDraw.Draw(img)
    gold, gold_d, gold_h = rgb("#d9a520"), rgb("#7a5a08"), rgb("#fff070")
    d.ellipse([12, 4, 19, 11], fill=gold, outline=gold_d)
    d.polygon([(10, 27), (13, 11), (18, 11), (21, 27)], fill=gold, outline=gold_d)
    d.rectangle([8, 26, 23, 28], fill=gold_d)
    d.line([(14, 6), (14, 9)], fill=gold_h)
    d.line([(14, 13), (13, 24)], fill=gold_h)
    d.ellipse([14, 15, 17, 18], fill=rgb("#c4182e"))
    save(img, "tiles", "tile_artifact_relic", note="religioeses Artefakt")

    for name in ("dinosaur", "treasure", "skeleton", "relic"):
        src = Image.open(os.path.join(ROOT, "tiles", f"tile_artifact_{name}.png"))
        icon = src.crop((4, 2, 28, 30)).resize((16, 16), Image.NEAREST)
        save(icon, "icons", f"icon_artifact_{name}")


# ---------------------------------------------------------------- Gefahren

def make_hazards():
    # Lava, 4 Frames Blubbern
    frames = []
    for f in range(4):
        r = random.Random(1000)
        img = Image.new("RGBA", (T, T))
        px = img.load()
        for y in range(T):
            for x in range(T):
                v = math.sin((x + f * 2) * 0.45) + math.cos((y - f) * 0.5 + x * 0.2) + r.random() * 0.6
                if v > 1.2:
                    c = rgb("#ffe14a")
                elif v > 0.5:
                    c = rgb("#ff9a1f")
                elif v > -0.4:
                    c = rgb("#e8471a")
                else:
                    c = rgb("#9e1f0f")
                px[x, y] = c
        # Blasen
        for bx, by in [(8, 20), (22, 9), (17, 26)]:
            yy = (by - f * 3) % T
            for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1)]:
                px[(bx + dx) % T, (yy + dy) % T] = rgb("#fff6b0")
        frames.append(img)
    save(strip(frames), "tiles", "tile_lava", frames=4, note="animiert, ~6 fps")

    # Gas: sieht fast wie Erde aus (Falle), nur leicht gruenstichig
    img = dirt_tile(1100, DIRT_DEEP)
    px = img.load()
    r = random.Random(1101)
    for y in range(T):
        for x in range(T):
            if r.random() < 0.06:
                px[x, y] = mix(px[x, y], rgb("#8fbf3a"), 0.5)
    save(img, "tiles", "tile_gas",
         note="Gastasche; bewusst unauffaellig (im Original unsichtbar - Engine kann auch tile_dirt_deep_* nutzen)")

    # Gaswolke nach Explosion, 4 Frames
    frames = []
    for f in range(4):
        img = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        r = random.Random(1200 + f)
        for _ in range(7):
            cx, cy = r.randint(6, 26), r.randint(6, 26)
            rad = 4 + f + r.randint(0, 3)
            a = max(40, 180 - f * 40)
            d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(150, 200, 60, a))
        frames.append(img)
    save(strip(frames), "fx", "fx_gas", frames=4)


# ---------------------------------------------------------------- Pod

POD_BODY = rgb("#d9481e")
POD_BODY_H = rgb("#ff7a3d")
POD_BODY_D = rgb("#8a2a10")
GLASS = rgb("#7fd8ff")
GLASS_H = rgb("#e0f8ff")
METAL = rgb("#8c939a")
METAL_D = rgb("#4a4f55")
OUT = rgb("#1c1410")


def pod_base(tread_phase=0):
    """Pod schaut nach rechts. 32x32: Rumpf x1..24, vorne Platz fuer den Bohrer,
    unten Platz fuer Bohrer/Duesenflamme."""
    img = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Raupenkette
    d.rounded_rectangle([2, 20, 24, 26], radius=3, fill=METAL_D, outline=OUT)
    for i in range(6):
        x = 4 + ((i * 4 + tread_phase) % 20)
        d.line([(x, 21), (x, 25)], fill=OUT)
    for cx in (6, 13, 20):
        d.ellipse([cx - 2, 21, cx + 2, 25], fill=METAL, outline=OUT)
    # Rumpf
    d.polygon([(1, 19), (2, 11), (7, 9), (20, 9), (24, 12), (24, 20), (1, 20)], fill=POD_BODY, outline=OUT)
    d.line([(3, 12), (7, 10), (19, 10)], fill=POD_BODY_H)
    d.line([(2, 18), (23, 18)], fill=POD_BODY_D)
    d.line([(2, 15), (23, 15)], fill=POD_BODY_D)
    # Cockpit-Kuppel
    d.chord([5, 1, 19, 16], start=180, end=360, fill=GLASS, outline=OUT)
    d.line([(8, 5), (10, 3)], fill=GLASS_H)
    d.point((8, 6), fill=GLASS_H)
    # Pilot (Silhouette)
    d.ellipse([12, 4, 16, 8], fill=rgb("#3a2a20"))
    # Lampe vorne
    d.rectangle([22, 12, 24, 14], fill=rgb("#fff3a0"), outline=OUT)
    return img


def drill_side(img, phase):
    """Bohrer nach rechts, Spitze bei x=31."""
    d = ImageDraw.Draw(img)
    d.rectangle([24, 13, 25, 21], fill=METAL_D, outline=OUT)
    d.polygon([(26, 12), (31, 17), (26, 22)], fill=METAL, outline=OUT)
    for i in range(3):
        x = 26 + ((i * 2 + phase) % 5)
        h = max(0, 4 - (x - 26))
        d.line([(x, 17 - h), (x + 1, 17 + h)], fill=rgb("#d8dde2"))
        d.line([(x + 1, 17 - h), (x + 1, 17 - h)], fill=METAL_D)


def drill_down(img, phase):
    """Bohrer nach unten (Kegel, Zeile fuer Zeile), Spitze bei y=31."""
    px = img.load()
    light, mid, dark = rgb("#d8dde2"), METAL, METAL_D
    for row, hw in enumerate([6, 5, 4, 2, 1]):
        y = 27 + row
        for x in range(13 - hw, 13 + hw):
            band = (x + y + phase * 2) % 4
            c = light if band == 0 else (dark if band == 3 else mid)
            px[x, y] = c
        px[13 - hw - 1, y] = OUT
        px[13 + hw, y] = OUT


def propeller(img, phase):
    d = ImageDraw.Draw(img)
    d.line([(12, 2), (12, 0)], fill=METAL_D)
    w = [7, 4, 1][phase]
    d.line([(12 - w, 0), (12 + w, 0)], fill=METAL)
    d.point((12 - w, 0), fill=OUT)
    d.point((12 + w, 0), fill=OUT)
    d.point((12, 1), fill=OUT)


def flame(img, phase):
    d = ImageDraw.Draw(img)
    ln = [3, 5, 4][phase]
    d.polygon([(8, 26), (17, 26), (12, 26 + ln), (13, 26 + ln)], fill=rgb("#ff9a1f"))
    d.polygon([(10, 26), (15, 26), (12, 25 + ln - 1), (13, 25 + ln - 1)], fill=rgb("#fff6b0"))


def make_pod():
    idle = pod_base()
    drill_side(idle, 0)
    save(idle, "pod", "pod_idle", note="schaut nach rechts; fuer links horizontal spiegeln")

    save(strip([pod_base(p) for p in (0, 2, 4)]), "pod", "pod_drive", frames=3, note="Fahren, Raupen laufen")

    fr = []
    for p in range(3):
        im = pod_base(p * 2)
        drill_side(im, p)
        fr.append(im)
    save(strip(fr), "pod", "pod_drill_side", frames=3)

    fr = []
    for p in range(3):
        im = pod_base(p * 2)
        drill_down(im, p)
        fr.append(im)
    save(strip(fr), "pod", "pod_drill_down", frames=3)

    fr = []
    for p in range(3):
        im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        flame(im, p)
        im.alpha_composite(pod_base())
        propeller(im, p)
        fr.append(im)
    save(strip(fr), "pod", "pod_fly", frames=3, note="Propeller + Duesenflamme")

    # Wrack nach Zerstoerung
    wreck = pod_base()
    px = wreck.load()
    r = random.Random(1300)
    for y in range(T):
        for x in range(T):
            if px[x, y][3] and r.random() < 0.55:
                px[x, y] = shade(px[x, y], 0.45)
    save(wreck, "pod", "pod_wreck")


# ---------------------------------------------------------------- Effekte

def make_fx():
    frames = []
    for f in range(6):
        img = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        r = random.Random(1400 + f)
        rad = 4 + f * 2.4
        cols = ["#fff6b0", "#ffe14a", "#ff9a1f", "#e8471a", "#7a3020", "#4a3a34"]
        for i in range(10):
            a = r.random() * math.tau
            dd = r.random() * rad * 0.6
            cx, cy = 16 + math.cos(a) * dd, 16 + math.sin(a) * dd
            rr = rad * (0.35 + r.random() * 0.3)
            c = rgb(cols[min(5, f + (i % 2))])
            alpha = 255 if f < 4 else 160 - (f - 4) * 60
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=c[:3] + (alpha,))
        if f < 3:
            d.ellipse([16 - rad / 3, 16 - rad / 3, 16 + rad / 3, 16 + rad / 3], fill=rgb("#ffffff"))
        frames.append(img)
    save(strip(frames), "fx", "fx_explosion", frames=6)

    frames = []
    for f in range(4):
        img = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        r = random.Random(1500)
        for _ in range(8):
            a = r.random() * math.tau
            sp = 3 + r.random() * 4
            x = 16 + math.cos(a) * sp * (f + 1)
            y = 16 + math.sin(a) * sp * (f + 1) * 0.6 + f * 2
            s = 2 if f < 2 else 1
            d.rectangle([x, y, x + s, y + s], fill=(150, 100, 60, 230 - f * 50))
        frames.append(img)
    save(strip(frames), "fx", "fx_dust", frames=4, note="Bohrstaub/Erdbrocken")


# ---------------------------------------------------------------- Pixel-Schrift

FONT = {
    "A": ["010", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"],
    "C": ["011", "100", "100", "100", "011"], "D": ["110", "101", "101", "101", "110"],
    "E": ["111", "100", "110", "100", "111"], "F": ["111", "100", "110", "100", "100"],
    "G": ["011", "100", "101", "101", "011"], "H": ["101", "101", "111", "101", "101"],
    "I": ["111", "010", "010", "010", "111"], "L": ["100", "100", "100", "100", "111"],
    "M": ["10001", "11011", "10101", "10001", "10001"], "N": ["1001", "1101", "1011", "1001", "1001"],
    "O": ["010", "101", "101", "101", "010"], "P": ["110", "101", "110", "100", "100"],
    "R": ["110", "101", "110", "101", "101"], "S": ["011", "100", "010", "001", "110"],
    "T": ["111", "010", "010", "010", "010"], "U": ["101", "101", "101", "101", "111"],
    "V": ["10001", "10001", "01010", "01010", "00100"], "&": ["010", "101", "010", "101", "011"],
    " ": ["000", "000", "000", "000", "000"], "$": ["011", "110", "010", "011", "110"],
}


def text(d, x, y, s, col, scale=1):
    for ch in s:
        g = FONT[ch]
        for gy, row in enumerate(g):
            for gx, bit in enumerate(row):
                if bit == "1":
                    d.rectangle([x + gx * scale, y + gy * scale,
                                 x + gx * scale + scale - 1, y + gy * scale + scale - 1], fill=col)
        x += (len(g[0]) + 1) * scale


def text_w(s, scale=1):
    return sum((len(FONT[ch][0]) + 1) * scale for ch in s) - scale


# ---------------------------------------------------------------- Gebaeude

BW, BH = 128, 96


def building(label, wall, roof, accent, seed, extra=None):
    img = Image.new("RGBA", (BW, BH), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    wall, roof, accent = rgb(wall), rgb(roof), rgb(accent)
    # Fundament
    d.rectangle([4, BH - 6, BW - 5, BH - 1], fill=rgb("#4a4f55"), outline=OUT)
    # Wand
    d.rectangle([10, 36, BW - 11, BH - 6], fill=wall, outline=OUT)
    r = random.Random(seed)
    for y in range(40, BH - 8, 6):
        d.line([(11, y), (BW - 12, y)], fill=shade(wall, 0.88))
    for _ in range(40):
        x, y = r.randint(11, BW - 12), r.randint(37, BH - 7)
        img.putpixel((x, y), shade(wall, 0.8))
    # Dach
    d.polygon([(4, 38), (18, 22), (BW - 19, 22), (BW - 5, 38)], fill=roof, outline=OUT)
    d.line([(19, 24), (BW - 20, 24)], fill=shade(roof, 1.3))
    # Schild
    sw = text_w(label, 2) + 10
    sx = (BW - sw) // 2
    d.rectangle([sx, 6, sx + sw, 22], fill=rgb("#20242a"), outline=OUT)
    d.rectangle([sx + 1, 7, sx + sw - 1, 21], outline=accent)
    text(d, sx + 6, 10, label, accent, 2)
    d.line([(sx + 6, 22), (sx + 6, 25)], fill=OUT)
    d.line([(sx + sw - 6, 22), (sx + sw - 6, 25)], fill=OUT)
    # Tor (Einfahrt fuer den Pod)
    d.rectangle([44, 52, 83, BH - 6], fill=rgb("#2b2f35"), outline=OUT)
    for y in range(55, BH - 6, 4):
        d.line([(45, y), (82, y)], fill=rgb("#3d434a"))
    d.rectangle([44, 52, 83, 54], fill=accent)
    # Fenster
    for wx in (18, BW - 34):
        d.rectangle([wx, 46, wx + 16, 60], fill=GLASS, outline=OUT)
        d.line([(wx + 8, 46), (wx + 8, 60)], fill=OUT)
        d.line([(wx + 2, 48), (wx + 5, 48)], fill=GLASS_H)
    if extra:
        extra(d, img)
    return img


def fuel_extra(d, img):
    # Zapfsaeule links vor dem Gebaeude
    d.rectangle([14, 64, 30, 90], fill=rgb("#d9481e"), outline=OUT)
    d.rectangle([17, 67, 27, 74], fill=rgb("#fff3a0"), outline=OUT)
    d.line([(30, 70), (36, 70), (36, 84)], fill=OUT, width=2)
    d.rectangle([34, 84, 38, 88], fill=METAL, outline=OUT)


def mineral_extra(d, img):
    # Erzhaufen + Waage
    for (x, y, c) in [(100, 84, "#d9a520"), (106, 86, "#a9b4bf"), (95, 87, "#b0662a"),
                      (103, 80, "#16a35a"), (110, 88, "#c4182e")]:
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=rgb(c), outline=OUT)


def upgrade_extra(d, img):
    # Zahnrad am Dach
    cx, cy = BW - 22, 30
    for i in range(8):
        a = i * math.tau / 8
        d.rectangle([cx + math.cos(a) * 6 - 1, cy + math.sin(a) * 6 - 1,
                     cx + math.cos(a) * 6 + 1, cy + math.sin(a) * 6 + 1], fill=METAL, outline=OUT)
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=METAL, outline=OUT)
    d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=METAL_D)


def repair_extra(d, img):
    # Schraubenschluessel-Symbol + Kran
    d.line([(BW - 14, 36), (BW - 14, 12), (BW - 34, 12)], fill=rgb("#e8b020"), width=2)
    d.line([(BW - 34, 12), (BW - 34, 20)], fill=OUT)
    d.rectangle([BW - 36, 20, BW - 32, 23], fill=METAL, outline=OUT)
    d.rectangle([22, 66, 30, 74], fill=rgb("#ffffff"), outline=OUT)
    d.rectangle([25, 67, 27, 73], fill=rgb("#c4182e"))
    d.rectangle([23, 69, 29, 71], fill=rgb("#c4182e"))


def save_extra(d, img):
    # Antenne mit Diskette-Symbol
    d.line([(20, 22), (20, 6)], fill=METAL_D, width=2)
    d.ellipse([17, 3, 23, 9], fill=rgb("#5ad1ff"), outline=OUT)


def make_buildings():
    save(building("FUEL", "#c9c2b4", "#d9481e", "#ffe14a", 1, fuel_extra), "buildings", "building_fuel",
         note="Tankstelle")
    save(building("MINERALS", "#b8a68a", "#2f6e25", "#7cff8a", 2, mineral_extra), "buildings",
         "building_mineral", note="Erzverkauf")
    save(building("UPGRADES", "#9aa4ae", "#2a4f8a", "#5ad1ff", 3, upgrade_extra), "buildings",
         "building_upgrade", note="Upgrade-Shop")
    save(building("REPAIR", "#c2b8a6", "#8a2a10", "#ff8a95", 4, repair_extra), "buildings",
         "building_repair", note="Werkstatt")
    save(building("SAVE", "#a8b0b8", "#4a4f55", "#ffffff", 5, save_extra), "buildings",
         "building_save", note="Speicherpunkt")


# ---------------------------------------------------------------- Himmel

def make_sky():
    W, H = 640, 480
    img = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(img)
    top, mid, horizon = rgb("#1d1f4a"), rgb("#6b4a7a"), rgb("#f0a060")
    for y in range(H):
        t = y / H
        c = mix(top, mid, t / 0.6) if t < 0.6 else mix(mid, horizon, (t - 0.6) / 0.4)
        # Banding fuer Pixel-Look
        c = tuple((v // 8) * 8 for v in c[:3]) + (255,)
        d.line([(0, y), (W, y)], fill=c)
    r = random.Random(1600)
    for _ in range(140):
        x, y = r.randrange(W), r.randrange(int(H * 0.55))
        b = r.choice([160, 200, 255])
        img.putpixel((x, y), (b, b, b, 255))
    # zwei Monde (Phobos & Deimos)
    d.ellipse([480, 50, 512, 82], fill=rgb("#d8d0c4"), outline=rgb("#8a8278"))
    d.ellipse([488, 58, 494, 64], fill=rgb("#b0a89c"))
    d.ellipse([498, 70, 503, 75], fill=rgb("#b0a89c"))
    d.ellipse([120, 90, 132, 102], fill=rgb("#c8bfb2"))
    # Bergketten (Mars-Tafelberge)
    def ridge(base_y, amp, col, seed):
        rr = random.Random(seed)
        y = base_y
        pts = [(0, H)]
        for x in range(0, W + 8, 8):
            y += rr.randint(-amp, amp)
            y = max(base_y - 60, min(base_y + 20, y))
            pts += [(x, y), (x + 8, y)]
        pts.append((W, H))
        d.polygon(pts, fill=col)
    ridge(330, 6, rgb("#7a3a3a"), 1601)
    ridge(370, 5, rgb("#5e2a2a"), 1602)
    ridge(405, 3, rgb("#4a2020"), 1603)
    save(img, "backgrounds", "bg_sky", note="Oberflaechen-Himmel, 640x480")


# ---------------------------------------------------------------- Endkampf

BOSS = 96


def natas_frame(f):
    """Mr. Natas in seiner Kampfmaschine, schaut nach links."""
    img = Image.new("RGBA", (BOSS, BOSS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    oy = 2 * f  # Schweben
    steel, steel_h, steel_d = rgb("#5a6270"), rgb("#8c96a6"), rgb("#2c313a")
    # Duesenflammen unten
    for jx in (30, 62):
        ln = 10 + 4 * f
        d.polygon([(jx - 6, 78 + oy), (jx + 6, 78 + oy), (jx, 78 + oy + ln)], fill=rgb("#ff9a1f"))
        d.polygon([(jx - 3, 78 + oy), (jx + 3, 78 + oy), (jx, 78 + oy + ln - 5)], fill=rgb("#fff6b0"))
        d.rectangle([jx - 7, 72 + oy, jx + 7, 79 + oy], fill=steel_d, outline=OUT)
    # Rumpf
    d.polygon([(14, 40 + oy), (24, 26 + oy), (74, 26 + oy), (86, 40 + oy), (82, 74 + oy), (18, 74 + oy)],
              fill=steel, outline=OUT)
    d.line([(25, 28 + oy), (73, 28 + oy)], fill=steel_h)
    d.line([(16, 41 + oy), (24, 29 + oy)], fill=steel_h)
    for y in (52, 64):
        d.line([(18, y + oy), (82, y + oy)], fill=steel_d)
    for x in (24, 40, 56, 72):
        for y in (46, 58, 69):
            d.point((x, y + oy), fill=steel_h)
    # Kanzel mit Mr. Natas (Anzug, Glatze, Brille)
    d.chord([28, 4 + oy, 70, 46 + oy], start=180, end=360, fill=rgb("#4a8aa8"), outline=OUT)
    d.ellipse([42, 10 + oy, 54, 22 + oy], fill=rgb("#e0b090"), outline=OUT)
    d.rectangle([43, 15 + oy, 48, 17 + oy], fill=OUT)  # Brille (nach links)
    d.point((43, 20 + oy), fill=rgb("#8a3a2a"))
    d.polygon([(40, 25 + oy), (56, 25 + oy), (58, 26 + oy), (38, 26 + oy)], fill=rgb("#20202a"))
    d.rectangle([40, 22 + oy, 56, 25 + oy], fill=rgb("#20202a"))
    d.polygon([(47, 22 + oy), (49, 22 + oy), (48, 25 + oy)], fill=rgb("#c4182e"))  # Krawatte
    d.line([(33, 12 + oy), (38, 8 + oy)], fill=rgb("#d0f0ff"))
    # Kanone nach links
    d.rectangle([2, 44 + oy, 18, 52 + oy], fill=steel_d, outline=OUT)
    d.rectangle([0, 46 + oy, 3, 50 + oy], fill=rgb("#1a1a1a"), outline=OUT)
    d.line([(4, 45 + oy), (17, 45 + oy)], fill=steel_h)
    # Warnlichter
    for x, c in ((26, "#ff3030"), (74, "#ffe14a")):
        d.ellipse([x - 2, 32 + oy, x + 2, 36 + oy], fill=rgb(c) if f == 0 else shade(rgb(c), 0.5), outline=OUT)
    # Logo-Schriftzug
    text(d, 36, 58 + oy, "NATAS", rgb("#ffe14a"))
    return img


def satan_frame(f):
    """Gehoernte Teufelsgestalt mit Fluegeln, schaut nach links."""
    img = Image.new("RGBA", (BOSS, BOSS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    oy = 2 * f
    red, red_h, red_d = rgb("#b81818"), rgb("#e84a3a"), rgb("#5e0a0a")
    wing, wing_d = rgb("#3a0a14"), rgb("#200408")
    # Fluegel (hinten, rechts), Frame 0 oben, Frame 1 unten
    tip = 4 if f == 0 else 30
    d.polygon([(52, 34 + oy), (94, tip + oy), (90, 40 + oy), (94, 52 + oy), (80, 50 + oy), (84, 64 + oy),
               (56, 52 + oy)], fill=wing, outline=OUT)
    d.line([(54, 38 + oy), (94, tip + oy)], fill=wing_d)
    d.line([(56, 44 + oy), (90, 40 + oy)], fill=wing_d)
    d.polygon([(30, 34 + oy), (8, tip + 10 + oy), (14, 44 + oy), (6, 54 + oy), (34, 50 + oy)], fill=wing_d,
              outline=OUT)
    # Schwanz
    d.line([(58, 76 + oy), (78, 82 + oy), (88, 74 + oy)], fill=red_d, width=3)
    d.polygon([(86, 70 + oy), (94, 72 + oy), (88, 78 + oy)], fill=red_d, outline=OUT)
    # Beine
    d.rectangle([34, 70 + oy, 42, 88 + oy], fill=red_d, outline=OUT)
    d.rectangle([50, 70 + oy, 58, 88 + oy], fill=red_d, outline=OUT)
    d.polygon([(30, 88 + oy), (42, 88 + oy), (42, 92 + oy), (28, 92 + oy)], fill=OUT)
    d.polygon([(46, 88 + oy), (58, 88 + oy), (58, 92 + oy), (44, 92 + oy)], fill=OUT)
    # Koerper
    d.polygon([(28, 40 + oy), (64, 40 + oy), (60, 72 + oy), (32, 72 + oy)], fill=red, outline=OUT)
    d.line([(46, 46 + oy), (46, 66 + oy)], fill=red_d)
    d.line([(36, 52 + oy), (56, 52 + oy)], fill=red_d)
    d.line([(30, 42 + oy), (34, 70 + oy)], fill=red_h)
    # Arm mit Feuerball-Hand nach links
    d.polygon([(30, 44 + oy), (14, 54 + oy), (12, 60 + oy), (18, 60 + oy), (32, 52 + oy)], fill=red, outline=OUT)
    d.ellipse([6, 54 + oy, 16, 64 + oy], fill=rgb("#ff9a1f") if f == 0 else rgb("#ffe14a"))
    d.ellipse([9, 57 + oy, 13, 61 + oy], fill=rgb("#fff6b0"))
    # Kopf
    d.ellipse([30, 16 + oy, 58, 44 + oy], fill=red, outline=OUT)
    d.polygon([(30, 34 + oy), (24, 36 + oy), (32, 40 + oy)], fill=red, outline=OUT)  # Kinn/Bart nach links
    d.polygon([(26, 36 + oy), (34, 42 + oy), (28, 48 + oy)], fill=OUT)  # Spitzbart
    # Hoerner
    d.polygon([(34, 22 + oy), (26, 4 + oy), (40, 18 + oy)], fill=rgb("#e8dfc8"), outline=OUT)
    d.polygon([(50, 18 + oy), (60, 2 + oy), (56, 22 + oy)], fill=rgb("#e8dfc8"), outline=OUT)
    # Augen (gluehend) und Grinsen, Blick nach links
    eye = rgb("#ffe14a") if f == 0 else rgb("#fff6b0")
    d.polygon([(33, 26 + oy), (40, 28 + oy), (34, 30 + oy)], fill=eye, outline=OUT)
    d.polygon([(44, 26 + oy), (51, 28 + oy), (45, 30 + oy)], fill=eye, outline=OUT)
    d.line([(32, 36 + oy), (46, 37 + oy)], fill=OUT)
    for x in (35, 39, 43):
        d.point((x, 37 + oy), fill=(255, 255, 255, 255))
    d.line([(34, 20 + oy), (42, 18 + oy)], fill=red_h)
    return img


def make_bosses():
    save(strip([natas_frame(f) for f in range(2)]), "bosses", "boss_natas", frames=2,
         note="Mr. Natas in Kampfmaschine; schaut nach links, Schwebe-Animation")
    save(strip([satan_frame(f) for f in range(2)]), "bosses", "boss_satan", frames=2,
         note="Teufelsgestalt (zweite Phase); schaut nach links, Schwebe-Animation")
    frames = []
    for f in range(4):
        img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        # Feuerball fliegt nach links, Schweif nach rechts
        r = random.Random(1700 + f)
        for i in range(4):
            x = 8 + i * 2 + r.randint(0, 1)
            y = 8 + r.randint(-2, 2)
            d.point((x, y), fill=rgb(["#ff9a1f", "#e8471a", "#9e1f0f", "#5e0a0a"][i]))
        d.ellipse([2, 4, 10, 12], fill=rgb("#e8471a"))
        d.ellipse([2 + (f % 2), 5, 9, 11], fill=rgb("#ff9a1f"))
        d.ellipse([3, 6, 7, 10], fill=rgb("#ffe14a"))
        img.putpixel((4, 7), rgb("#fff6b0"))
        frames.append(img)
    save(strip(frames), "fx", "fx_fireball", frames=4, note="16x16, fliegt nach links (fuer rechts spiegeln)")


SPRITES_JS = """// AUTOMATISCH ERZEUGT von assets/graphics/tools/generate.py - nicht von Hand aendern.
// Funktioniert ohne Server (auch per file://), da das Manifest eingebettet ist.
(function (global) {
  var TILE = 32;
  var SPRITES = __MANIFEST__;
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
"""


def main():
    make_dirt()
    make_rock()
    make_ores()
    make_artifacts()
    make_hazards()
    make_pod()
    make_fx()
    make_buildings()
    make_sky()
    make_bosses()
    with open(os.path.join(ROOT, "sprites.json"), "w") as f:
        json.dump({"tileSize": T, "sprites": MANIFEST}, f, indent=2, sort_keys=True)
    with open(os.path.join(ROOT, "sprites.js"), "w") as f:
        f.write(SPRITES_JS.replace("__MANIFEST__", json.dumps(MANIFEST, indent=2, sort_keys=True)))
    print(f"{len(MANIFEST)} Sprites erzeugt")


if __name__ == "__main__":
    main()
