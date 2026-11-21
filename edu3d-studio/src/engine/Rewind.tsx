// Habillage « flashback » repris des références : ◀◀ en haut à gauche, lignes VHS, léger bruit.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const RewindOverlay: React.FC<{ label: string }> = ({ label }) => {
  const f = useCurrentFrame();
  const jitter = (Math.sin(f * 12.9898) * 43758.5453) % 1;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0) 5px)',
          mixBlendMode: 'overlay',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${(f * 37) % 1920}px`,
          height: 26,
          background: 'rgba(255,255,255,0.10)',
          filter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 70 + jitter * 3,
          top: 150,
          fontFamily: '"DejaVu Sans Mono", monospace',
          fontSize: 50,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: 3,
          textShadow: '3px 0 rgba(255,0,60,0.55), -3px 0 rgba(0,200,255,0.55), 0 2px 6px rgba(0,0,0,0.6)',
          opacity: f % 30 < 22 ? 1 : 0.35,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
