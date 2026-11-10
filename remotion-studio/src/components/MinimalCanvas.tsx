import React from 'react';
import { AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, HEIGHT, WIDTH } from './geometry';

type Props = {
  children: React.ReactNode;
  /** Postérisation temporelle (équivalent de FX_03_POSTERIZE_15FPS). 0 = désactivée. */
  posterizeFps?: number;
  /** Intensité du "line boil" (équivalent de FX_02_LINE_BOIL, Turbulent Displace). */
  lineBoil?: number;
  /** Opacité du grain (équivalent de FX_04_NOISE). */
  grainOpacity?: number;
  /** Opacité de la grille 90 px. */
  gridOpacity?: number;
};

/**
 * Fond #070707 + grille 90 px à 4 % avec masque radial + grain feTurbulence animé à 6 %
 * + line boil + postérisation temporelle à 15 fps.
 */
export const MinimalCanvas: React.FC<Props> = ({
  children,
  posterizeFps = 15,
  lineBoil = 4,
  grainOpacity = 0.06,
  gridOpacity = 0.04,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = posterizeFps > 0 ? Math.max(1, Math.round(fps / posterizeFps)) : 1;
  const heldFrame = Math.floor(frame / step) * step;
  const seed = Math.floor(frame / step) % 97;
  const uid = React.useId().replace(/:/g, '');

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: 'hidden' }}>
      {/* Grille 90 px, masque radial */}
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id={`grid-${uid}`} width={90} height={90} patternUnits="userSpaceOnUse" x={WIDTH / 2 % 90} y={HEIGHT / 2 % 90}>
            <path d="M90 0 L0 0 0 90" fill="none" stroke={COLORS.white} strokeWidth={2} />
          </pattern>
          <radialGradient id={`fade-${uid}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="55%" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id={`mask-${uid}`}>
            <rect width={WIDTH} height={HEIGHT} fill={`url(#fade-${uid})`} />
          </mask>
          <filter id={`boil-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={lineBoil} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill={`url(#grid-${uid})`} opacity={gridOpacity} mask={`url(#mask-${uid})`} />
      </svg>

      {/* Contenu animé : postérisé + line boil */}
      <AbsoluteFill style={{ filter: lineBoil > 0 ? `url(#boil-${uid})` : undefined }}>
        {step > 1 ? <Freeze frame={heldFrame}>{children}</Freeze> : children}
      </AbsoluteFill>

      {/* Vignettage */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Grain monochrome haute fréquence */}
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, opacity: grainOpacity, mixBlendMode: 'screen' }}>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={seed + 11} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={WIDTH} height={HEIGHT} filter={`url(#grain-${uid})`} />
      </svg>
    </AbsoluteFill>
  );
};
