// Primitives géométriques : chaque fonction renvoie un attribut "d" de <path>,
// directement animable par GlowingSvgPath (stroke-dashoffset).
import { Easing } from 'remotion';

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const CX = WIDTH / 2;
export const CY = HEIGHT / 2;

export const COLORS = {
  bg: '#070707',
  white: '#FFFFFF',
  red: '#FF1E1E',
  gold: '#FFC72C',
  grey: '#6B6B6B',
} as const;

/** Courbe signature 75 / 85 (Speed Graph). */
export const SIGNATURE_EASING = Easing.bezier(0.75, 0, 0.15, 1);

export type Pt = readonly [number, number];

const r2 = (v: number) => Math.round(v * 100) / 100;

export const polar = (cx: number, cy: number, r: number, deg: number): Pt => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];

export const line = (a: Pt, b: Pt) => `M${r2(a[0])} ${r2(a[1])} L${r2(b[0])} ${r2(b[1])}`;

export const polyline = (pts: readonly Pt[], closed = false) =>
  `M${pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join(' L')}${closed ? ' Z' : ''}`;

/** Cercle sous forme de path (point de départ en haut, sens horaire). */
export const circle = (cx: number, cy: number, r: number) =>
  `M${r2(cx)} ${r2(cy - r)} A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx)} ${r2(cy + r)} A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx)} ${r2(cy - r)} Z`;

export const rect = (x: number, y: number, w: number, h: number, rx = 0) => {
  if (rx <= 0) return polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);
  return (
    `M${x + rx} ${y} H${x + w - rx} A${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V${y + h - rx} ` +
    `A${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H${x + rx} A${rx} ${rx} 0 0 1 ${x} ${y + h - rx} ` +
    `V${y + rx} A${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`
  );
};

export const regular = (cx: number, cy: number, r: number, sides: number, rot = -90): Pt[] =>
  Array.from({ length: sides }, (_, i) => polar(cx, cy, r, rot + (360 / sides) * i));

/** Pointe de flèche à l'extrémité b d'un segment a -> b. */
export const arrowHead = (a: Pt, b: Pt, size = 26, spread = 30) => {
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const l = polar(b[0], b[1], size, ang + 180 - spread);
  const r = polar(b[0], b[1], size, ang + 180 + spread);
  return polyline([l, b, r]);
};

/** Point sur une courbe de Bézier cubique. */
export const cubicPoint = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

export const cubicPath = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) =>
  `M${r2(p0[0])} ${r2(p0[1])} C${r2(p1[0])} ${r2(p1[1])} ${r2(p2[0])} ${r2(p2[1])} ${r2(p3[0])} ${r2(p3[1])}`;

/** Échantillonne y = f(x) en polyline. */
export const plot = (f: (x: number) => number, x0: number, x1: number, steps = 80) =>
  polyline(Array.from({ length: steps + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / steps;
    return [x, f(x)] as Pt;
  }));

/** Conversion décibels -> gain linéaire. */
export const db = (value: number) => Math.pow(10, value / 20);

/* Contour de cerveau (repère 240x240 des icônes du pack). */
export const BRAIN_LEFT =
  'M120 58 C104 46 80 50 72 66 C54 66 42 82 46 100 C32 110 32 132 46 142 C42 160 56 176 74 174 C82 190 106 194 120 180';
export const BRAIN_RIGHT =
  'M120 58 C136 46 160 50 168 66 C186 66 198 82 194 100 C208 110 208 132 194 142 C198 160 184 176 166 174 C158 190 134 194 120 180';
export const BRAIN_FOLDS = [
  'M78 92 C92 86 100 96 96 108',
  'M62 128 C76 120 90 128 88 142',
  'M162 92 C148 86 140 96 144 108',
  'M178 128 C164 120 150 128 152 142',
  'M120 58 L120 180',
];
