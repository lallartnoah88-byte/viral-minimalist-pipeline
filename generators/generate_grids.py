#!/usr/bin/env python3
"""
generate_grids.py
Génère :
  - les 5 fonds / grilles PNG 1080x1920 (RGBA, vignettage radial doux)
  - le visuel boutique Store_Cover_Mockup_1080x1080.png

Dépendances : numpy, Pillow.
"""
from __future__ import annotations

import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "DIST_PACK_TO_SELL"
GRID_DIR = DIST / "ULTIMATE_MINIMALIST_ANIMATION_PACK" / "02_Fonds_&_Grilles_1080x1920"

W, H = 1080, 1920
BG = (7, 7, 7)
RED = (255, 30, 30)
WHITE = (255, 255, 255)
GOLD = (255, 199, 44)

FONT_CANDIDATES = {
    "inter_black": [
        "/usr/share/fonts/opentype/inter/Inter-Black.otf",
        "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "inter_medium": [
        "/usr/share/fonts/opentype/inter/Inter-Medium.otf",
        "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "mono": [
        "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-SemiBold.ttf",
        "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    ],
}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES[kind]:
        if os.path.exists(candidate):
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size)


# ---------------------------------------------------------------------------
# Outils
# ---------------------------------------------------------------------------
def radial_vignette(w: int, h: int, inner: float = 0.15, outer: float = 1.0, power: float = 1.6) -> np.ndarray:
    """Masque 0..1 : 1 au centre, fondu doux jusqu'à 0 sur les bords."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (x - w / 2) / (w / 2)
    ny = (y - h / 2) / (h / 2)
    d = np.sqrt(nx * nx + ny * ny) / math.sqrt(2)
    t = np.clip((d - inner) / (outer - inner), 0.0, 1.0)
    t = t * t * (3 - 2 * t)  # smoothstep
    return np.power(1.0 - t, power)


def lines_to_rgba(mask: Image.Image, opacity: float, vignette: np.ndarray, color=WHITE) -> Image.Image:
    """Convertit un masque L (255 = trait) en calque RGBA blanc avec opacité * vignette."""
    m = np.asarray(mask, dtype=np.float32) / 255.0
    alpha = np.clip(m * opacity * vignette * 255.0, 0, 255).astype(np.uint8)
    rgb = np.zeros((mask.height, mask.width, 3), dtype=np.uint8)
    rgb[...] = color
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"[PNG] {path.relative_to(ROOT)} ({img.width}x{img.height}, {path.stat().st_size // 1024} Ko)")


# ---------------------------------------------------------------------------
# Les 5 grilles
# ---------------------------------------------------------------------------
def grid_square_90(vig: np.ndarray) -> Image.Image:
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    ox, oy = (W // 2) % 90, (H // 2) % 90
    for x in range(ox, W, 90):
        d.rectangle([x - 1, 0, x, H], fill=255)
    for y in range(oy, H, 90):
        d.rectangle([0, y - 1, W, y], fill=255)
    return lines_to_rgba(mask, 0.12, vig)


def grid_blueprint_45(vig: np.ndarray) -> Image.Image:
    fine = Image.new("L", (W, H), 0)
    major = Image.new("L", (W, H), 0)
    df, dm = ImageDraw.Draw(fine), ImageDraw.Draw(major)
    ox, oy = (W // 2) % 45, (H // 2) % 45
    for x in range(ox, W, 45):
        df.line([(x, 0), (x, H)], fill=255, width=1)
    for y in range(oy, H, 45):
        df.line([(0, y), (W, y)], fill=255, width=1)
    mx, my = (W // 2) % 180, (H // 2) % 180
    for x in range(mx, W, 180):
        dm.rectangle([x - 1, 0, x, H], fill=255)
    for y in range(my, H, 180):
        dm.rectangle([0, y - 1, W, y], fill=255)
    # Croix de repère centrale
    dm.rectangle([W // 2 - 1, H // 2 - 40, W // 2, H // 2 + 40], fill=255)
    dm.rectangle([W // 2 - 40, H // 2 - 1, W // 2 + 40, H // 2], fill=255)
    a = lines_to_rgba(fine, 0.07, vig)
    b = lines_to_rgba(major, 0.16, vig)
    return Image.alpha_composite(a, b)


def grid_dot_matrix(vig: np.ndarray) -> Image.Image:
    # Rendu en 2x puis réduction pour des points ronds anti-aliasés
    s = 2
    mask = Image.new("L", (W * s, H * s), 0)
    d = ImageDraw.Draw(mask)
    ox, oy = (W // 2) % 60, (H // 2) % 60
    r = 2 * s
    for y in range(oy, H, 60):
        for x in range(ox, W, 60):
            d.ellipse([x * s - r, y * s - r, x * s + r, y * s + r], fill=255)
    mask = mask.resize((W, H), Image.LANCZOS)
    return lines_to_rgba(mask, 0.35, vig)


def grid_isometric(vig: np.ndarray) -> Image.Image:
    s = 2
    mask = Image.new("L", (W * s, H * s), 0)
    d = ImageDraw.Draw(mask)
    spacing = 80
    tan30 = math.tan(math.radians(30))
    span = int(W * tan30) + H
    cx = W // 2
    # Verticales
    for x in range(cx % spacing, W, spacing):
        d.line([(x * s, 0), (x * s, H * s)], fill=255, width=2 * s)
    # Diagonales à +30° et -30° (y = ±tan30 * x + b), espacées verticalement
    step = spacing / math.cos(math.radians(30)) * tan30 * 2
    b = -span
    while b < span + H:
        d.line([(0, b * s), (W * s, (b + W * tan30) * s)], fill=255, width=2 * s)
        d.line([(0, (b + W * tan30) * s), (W * s, b * s)], fill=255, width=2 * s)
        b += step
    mask = mask.resize((W, H), Image.LANCZOS)
    return lines_to_rgba(mask, 0.10, vig)


def film_grain(seed: int = 7) -> Image.Image:
    rng = np.random.default_rng(seed)
    base = np.zeros((H, W, 3), dtype=np.float32)
    base[...] = BG
    noise = rng.normal(0.0, 1.0, (H, W)).astype(np.float32)
    # Grain haute fréquence : passe-haut (bruit - version floutée du bruit)
    norm = (noise - noise.min()) / np.ptp(noise) * 255.0
    blurred = np.asarray(
        Image.fromarray(norm.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),
        dtype=np.float32,
    )
    grain = np.clip((norm - blurred) * 2.0 + 128.0, 0, 255)
    out = base * (1 - 0.08) + grain[..., None] * 0.08
    vig = radial_vignette(W, H, inner=0.25, outer=1.0, power=1.0)
    out = out * (0.55 + 0.45 * vig[..., None])
    rgb = np.clip(out, 0, 255).astype(np.uint8)
    alpha = np.full((H, W, 1), 255, dtype=np.uint8)
    return Image.fromarray(np.concatenate([rgb, alpha], axis=2), "RGBA")


# ---------------------------------------------------------------------------
# Visuel boutique 1080x1080
# ---------------------------------------------------------------------------
def add_screen(base: Image.Image, layer: Image.Image, gain: float = 1.0) -> Image.Image:
    """Mélange additif (pré-multiplié par l'alpha) pour la lueur."""
    b = np.asarray(base.convert("RGB"), dtype=np.float32)
    l = np.asarray(layer, dtype=np.float32)
    rgb = l[..., :3] * (l[..., 3:4] / 255.0) * gain
    out = np.clip(b + rgb, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGB")


def store_mockup(path: Path) -> None:
    S = 1080
    # Fond + grille subtile + vignettage + grain
    vig = radial_vignette(S, S, inner=0.05, outer=1.0, power=1.3)
    base = np.zeros((S, S, 3), dtype=np.float32)
    base[...] = BG
    gm = Image.new("L", (S, S), 0)
    gd = ImageDraw.Draw(gm)
    for x in range(0, S + 1, 60):
        gd.line([(x, 0), (x, S)], fill=255, width=1)
        gd.line([(0, x), (S, x)], fill=255, width=1)
    base += (np.asarray(gm, dtype=np.float32)[..., None] / 255.0) * 22.0 * vig[..., None]
    rng = np.random.default_rng(42)
    base += rng.normal(0, 5.0, (S, S, 1)).astype(np.float32)
    base *= (0.35 + 0.65 * vig[..., None])
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB")

    cx, cy = S // 2, 440

    # --- Sablier-cerveau blanc ---
    def draw_hourglass(d: ImageDraw.ImageDraw, color, w):
        top, bot, half = cy - 210, cy + 110, 120
        d.line([(cx - half - 20, top), (cx + half + 20, top)], fill=color + (255,), width=w)
        d.line([(cx - half - 20, bot), (cx + half + 20, bot)], fill=color + (255,), width=w)
        pts_l, pts_r = [], []
        for i in range(61):
            t = i / 60
            y = top + (bot - top) * t
            k = abs(t - 0.5) * 2
            x = 14 + (half - 14) * (k ** 0.7)
            pts_l.append((cx - x, y))
            pts_r.append((cx + x, y))
        d.line(pts_l, fill=color + (255,), width=w, joint="curve")
        d.line(pts_r, fill=color + (255,), width=w, joint="curve")
        # hémisphères cérébraux dans le bulbe supérieur
        for side in (-1, 1):
            d.arc([cx - 70 if side < 0 else cx, top + 30, cx if side < 0 else cx + 70, top + 110],
                  90 if side < 0 else -90, 270 if side < 0 else 90, fill=color + (255,), width=max(2, w - 2))
        d.line([(cx, top + 30), (cx, top + 110)], fill=color + (255,), width=max(2, w - 2))
        # flux de sable
        d.line([(cx, cy - 40), (cx, bot - 40)], fill=color + (255,), width=max(2, w - 2))
        d.arc([cx - 80, bot - 70, cx + 80, bot + 50], 200, 340, fill=color + (255,), width=max(2, w - 2))

    # --- Speed Graph rouge (courbe en cloche asymétrique 75/85) ---
    gx0, gx1, gy = 150, 930, cy + 300

    def speed_curve():
        """cubic-bezier(0.75, 0, 0.15, 1) : vitesse = dy/dx, échantillonnée en paramétrique."""
        x1, y1, x2, y2 = 0.75, 0.0, 0.15, 1.0
        pts = []
        for i in range(1, 400):
            s = i / 400
            dx = 3 * (1 - s) ** 2 * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s ** 2 * (1 - x2)
            dy = 3 * (1 - s) ** 2 * y1 + 6 * (1 - s) * s * (y2 - y1) + 3 * s ** 2 * (1 - y2)
            x = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3
            pts.append((x, dy / dx if dx > 1e-6 else 0.0))
        peak = max(v for _, v in pts)
        return [(0.0, 0.0)] + [(x, v / peak) for x, v in pts] + [(1.0, 0.0)]

    curve_pts = speed_curve()
    peak_x = max(curve_pts, key=lambda p: p[1])[0]

    def draw_speed(d: ImageDraw.ImageDraw, color, w):
        pts = [(gx0 + (gx1 - gx0) * x, gy - v * 200) for x, v in curve_pts]
        d.line(pts, fill=color + (255,), width=w, joint="curve")
        d.line([(gx0 - 20, gy), (gx1 + 20, gy)], fill=color + (255,), width=max(2, w - 4))
        px = gx0 + (gx1 - gx0) * peak_x
        d.ellipse([px - 9, gy - 209, px + 9, gy - 191], outline=color + (255,), width=max(2, w - 3))

    # --- Timeline minimaliste ---
    def draw_timeline(d: ImageDraw.ImageDraw, color, w):
        ty = 790
        d.rounded_rectangle([120, ty, 960, ty + 64], radius=12, outline=color + (255,), width=3)
        for i in range(1, 12):
            x = 120 + i * 70
            d.line([(x, ty + 8), (x, ty + (26 if i % 2 else 18))], fill=color + (255,), width=2)
        for kx in (260, 470, 680):
            d.polygon([(kx, ty + 34), (kx + 10, ty + 44), (kx, ty + 54), (kx - 10, ty + 44)], outline=color + (255,), width=3)
        d.line([(560, ty - 14), (560, ty + 78)], fill=RED + (255,), width=4)

    layers = [
        (draw_hourglass, WHITE, 7, 1.0),
        (draw_speed, RED, 7, 1.2),
    ]
    for fn, col, w, gain in layers:
        sharp = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        fn(ImageDraw.Draw(sharp), col, w)
        img = add_screen(img, sharp.filter(ImageFilter.GaussianBlur(40)), 7.0 * gain)
        img = add_screen(img, sharp.filter(ImageFilter.GaussianBlur(10)), 3.2 * gain)
        img = add_screen(img, sharp, 1.0)

    tl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw_timeline(ImageDraw.Draw(tl), (180, 180, 180), 3)
    img = add_screen(img, tl.filter(ImageFilter.GaussianBlur(8)), 0.8)
    img = add_screen(img, tl, 1.0)

    # --- Titres nets ---
    d = ImageDraw.Draw(img)
    title_font = font("inter_black", 64)
    sub_font = font("mono", 30)
    title = "VIRAL MINIMALIST ANIMATION PACK"
    sub = "COURSE + 150 ASSETS + AE PLUGIN"
    for size in range(64, 30, -2):
        title_font = font("inter_black", size)
        if d.textlength(title, font=title_font) <= S - 120:
            break
    tw = d.textlength(title, font=title_font)
    d.text(((S - tw) / 2, 900), title, font=title_font, fill=WHITE)
    sw = d.textlength(sub, font=sub_font)
    d.text(((S - sw) / 2, 990), sub, font=sub_font, fill=RED)
    d.rectangle([(S - 120) / 2, 975, (S + 120) / 2, 977], fill=(90, 90, 90))
    save(img, path)


def main() -> None:
    GRID_DIR.mkdir(parents=True, exist_ok=True)
    vig = radial_vignette(W, H)
    save(grid_square_90(vig), GRID_DIR / "01_Square_Grid_90px.png")
    save(grid_blueprint_45(vig), GRID_DIR / "02_Fine_Blueprint_Grid_45px.png")
    save(grid_dot_matrix(vig), GRID_DIR / "03_Dot_Matrix_Grid.png")
    save(grid_isometric(vig), GRID_DIR / "04_Isometric_Perspective_Grid.png")
    save(film_grain(), GRID_DIR / "05_Dark_Film_Grain_Overlay_4K.png")
    store_mockup(DIST / "Store_Cover_Mockup_1080x1080.png")


if __name__ == "__main__":
    main()
