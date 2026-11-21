// Sous-titres calqués sur les références : 1 à 4 mots, blanc gras, liseré sombre fin + ombre douce,
// centrés à ~78 % de la hauteur (au-dessus de l'interface TikTok), coupe sèche sans animation.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { Timeline } from './types';

export const SUB_FONT = '"DejaVu Sans", Verdana, "Segoe UI", sans-serif';

export const Subtitles: React.FC<{ subs: Timeline['subs'] }> = ({ subs }) => {
  const f = useCurrentFrame();
  const cur = subs.find((s) => f >= s.from && f < s.to);
  if (!cur) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1500,
          transform: 'translateY(-50%)',
          textAlign: 'center',
          fontFamily: SUB_FONT,
          fontWeight: 700,
          fontSize: 66,
          letterSpacing: -0.5,
          lineHeight: 1.1,
          color: '#ffffff',
          WebkitTextStroke: '3px rgba(0,0,0,0.85)',
          paintOrder: 'stroke fill',
          textShadow: '0 3px 6px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {cur.text}
      </div>
    </AbsoluteFill>
  );
};
