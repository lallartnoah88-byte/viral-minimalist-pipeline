import { interpolate } from 'remotion';
import { SIGNATURE_EASING } from './geometry';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Interpolation avec la courbe signature 75/85. */
export const ease = (frame: number, from: number, to: number, a: number, b: number) =>
  interpolate(frame, [from, to], [a, b], { ...clamp, easing: SIGNATURE_EASING });

/** Interpolation linéaire bornée. */
export const lin = (frame: number, from: number, to: number, a: number, b: number) =>
  interpolate(frame, [from, to], [a, b], clamp);

/** Pop-In Scale du plugin : 220 % -> 100 % sur 20 images. */
export const popIn = (frame: number, start: number, duration = 20) => ease(frame, start, start + duration, 2.2, 1);

/** Transformation SVG : mise à l'échelle autour d'un point. */
export const scaleAround = (cx: number, cy: number, s: number) =>
  `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;

/** Place une icône du repère 240x240 centrée sur (x, y) avec une taille donnée. */
export const placeIcon = (x: number, y: number, size: number) => {
  const s = size / 240;
  return { transform: `translate(${x - 120 * s} ${y - 120 * s}) scale(${s})`, scale: s };
};
