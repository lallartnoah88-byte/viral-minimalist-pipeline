import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, SIGNATURE_EASING } from './geometry';

export type GlowColor = 'white' | 'red' | 'gold' | 'grey';

const GLOW: Record<GlowColor, string> = {
  white: COLORS.white,
  red: COLORS.red,
  gold: COLORS.gold,
  grey: COLORS.grey,
};

type Props = {
  /** Attribut "d" du tracé (ou liste de tracés dessinés ensemble). */
  d: string | string[];
  /** Image (locale à la Sequence) où le tracé commence à se dessiner. */
  start?: number;
  /** Durée du tracé en images (25 = valeur du plugin AE). */
  duration?: number;
  /** Décalage entre plusieurs tracés d'une même liste. */
  stagger?: number;
  /** Progression forcée 0..1 (ignore start/duration). */
  progress?: number;
  color?: GlowColor;
  strokeWidth?: number;
  opacity?: number;
  /** Intensité de la double lueur (0 = aucune). */
  glow?: number;
  fill?: string;
  transform?: string;
  dashed?: string;
};

/**
 * Tracé SVG révélé par stroke-dasharray / stroke-dashoffset avec la courbe
 * Easing.bezier(0.75, 0, 0.15, 1) et double drop-shadow lumineux (équivalent FX_01_DOUBLE_GLOW).
 */
export const GlowingSvgPath: React.FC<Props> = ({
  d,
  start = 0,
  duration = 25,
  stagger = 0,
  progress,
  color = 'white',
  strokeWidth = 8,
  opacity = 1,
  glow = 1,
  fill = 'none',
  transform,
  dashed,
}) => {
  const frame = useCurrentFrame();
  const paths = Array.isArray(d) ? d : [d];
  const c = GLOW[color];
  const filter =
    glow > 0
      ? `drop-shadow(0 0 ${6 * glow}px ${c}) drop-shadow(0 0 ${26 * glow}px ${c}${color === 'white' ? 'AA' : 'CC'})`
      : undefined;

  return (
    <g transform={transform} style={{ filter }} opacity={opacity}>
      {paths.map((pathD, i) => {
        const p =
          progress ??
          interpolate(frame, [start + i * stagger, start + i * stagger + duration], [0, 1], {
            easing: SIGNATURE_EASING,
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        if (p <= 0) return null;
        return (
          <path
            key={i}
            d={pathD}
            pathLength={1}
            fill={p >= 1 ? fill : 'none'}
            stroke={c}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dashed ?? '1 1'}
            strokeDashoffset={dashed ? 0 : 1 - p}
          />
        );
      })}
    </g>
  );
};
