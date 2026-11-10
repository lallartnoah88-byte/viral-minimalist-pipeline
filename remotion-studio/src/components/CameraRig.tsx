import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CX, CY, SIGNATURE_EASING } from './geometry';

/** Point de vue de la caméra : point du monde centré à l'écran + facteur de zoom. */
export type CameraKey = {
  frame: number;
  /** Point du monde (repère 1080x1920) amené au centre de l'écran. */
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
};

export type Shake = { frame: number; duration?: number; intensity?: number };

type Props = {
  children: React.ReactNode;
  keys: CameraKey[];
  shakes?: Shake[];
};

const resolve = (keys: CameraKey[], frame: number, field: 'x' | 'y' | 'scale' | 'rotate', fallback: number) => {
  const defined = keys.filter((k) => k[field] !== undefined).sort((a, b) => a.frame - b.frame);
  if (defined.length === 0) return fallback;
  if (frame <= defined[0].frame) return defined[0][field] as number;
  for (let i = 0; i < defined.length - 1; i++) {
    const a = defined[i];
    const b = defined[i + 1];
    if (frame <= b.frame) {
      return interpolate(frame, [a.frame, b.frame], [a[field] as number, b[field] as number], {
        easing: SIGNATURE_EASING,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }
  return defined[defined.length - 1][field] as number;
};

/**
 * Conteneur caméra : translations X/Y et zooms avec la courbe 0.75, 0, 0.15, 1.
 * Équivalent du nul CAMERA_CONTROLLER_3D du plugin After Effects.
 */
export const CameraRig: React.FC<Props> = ({ children, keys, shakes = [] }) => {
  const frame = useCurrentFrame();
  const x = resolve(keys, frame, 'x', CX);
  const y = resolve(keys, frame, 'y', CY);
  const s = resolve(keys, frame, 'scale', 1);
  const rot = resolve(keys, frame, 'rotate', 0);

  let sx = 0;
  let sy = 0;
  for (const sh of shakes) {
    const dur = sh.duration ?? 12;
    const t = frame - sh.frame;
    if (t >= 0 && t < dur) {
      const decay = 1 - t / dur;
      const amp = (sh.intensity ?? 18) * decay * decay;
      sx += Math.sin(t * 2.7 + 1.3) * amp;
      sy += Math.cos(t * 3.4) * amp;
    }
  }

  // Le point (x, y) du monde est amené au centre de l'écran, puis zoomé autour du centre.
  const tx = (CX - x) * s + sx;
  const ty = (CY - y) * s + sy;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: `${CX}px ${CY}px`,
        transform: `translate(${tx}px, ${ty}px) scale(${s}) rotate(${rot}deg)`,
      }}
    >
      {children}
    </div>
  );
};
