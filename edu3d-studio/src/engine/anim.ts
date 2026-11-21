// Outils d'animation déterministes (tout dépend de l'image courante, jamais de l'horloge).
import { Easing, interpolate, spring } from 'remotion';

export type V3 = [number, number, number];

/** Courbe « ease in-out » appuyée, proche des rendus 3D viraux (départ et arrivée très doux). */
export const smooth = Easing.bezier(0.65, 0, 0.25, 1);
export const outBack = Easing.bezier(0.34, 1.56, 0.64, 1);
export const outQuart = Easing.bezier(0.25, 1, 0.5, 1);

/** Interpolation par clés [image, valeur] avec easing entre chaque paire. */
export const keys = (f: number, k: Array<[number, number]>, ease = smooth): number =>
  interpolate(
    f,
    k.map((x) => x[0]),
    k.map((x) => x[1]),
    { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

export const keysV = (f: number, k: Array<[number, V3]>, ease = smooth): V3 => [
  keys(f, k.map(([t, v]) => [t, v[0]]), ease),
  keys(f, k.map(([t, v]) => [t, v[1]]), ease),
  keys(f, k.map(([t, v]) => [t, v[2]]), ease),
];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Rampe 0→1 entre deux images avec easing. */
export const ramp = (f: number, a: number, b: number, ease = smooth) =>
  interpolate(f, [a, b], [0, 1], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Apparition physique (rebond) — échelle 0→1 avec dépassement. */
export const pop = (f: number, start: number, fps = 30, stiffness = 180, damping = 11) =>
  spring({ frame: f - start, fps, config: { stiffness, damping, mass: 0.8 } });

/** Bruit pseudo-aléatoire lisse et déterministe (pour secousses et respiration). */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const t = x - i;
  const u = t * t * (3 - 2 * t);
  return lerp(hash(i + seed * 57.3), hash(i + 1 + seed * 57.3), u) * 2 - 1;
};

/** Secousse caméra : amplitude décroissante après un impact à l'image `at`. */
export const shake = (f: number, at: number, amp = 0.08, len = 14, seed = 1): V3 => {
  const d = f - at;
  if (d < 0 || d > len) return [0, 0, 0];
  const k = amp * Math.pow(1 - d / len, 2);
  return [noise1(f * 0.9, seed) * k, noise1(f * 0.9, seed + 3) * k, noise1(f * 0.9, seed + 7) * k * 0.5];
};

export const rand = (i: number, seed = 0) => hash(i * 13.37 + seed * 7.77);
