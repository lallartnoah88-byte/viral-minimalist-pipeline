import React from 'react';
import { useCurrentFrame } from 'remotion';
import { lin } from './anim';
import { COLORS } from './geometry';
import { FONT_STACK } from './TypewriterText';

/**
 * Sous-titre TikTok mot par mot, placé dans la zone sûre 9:16
 * (au-dessus de la barre de description et à gauche des boutons d'action).
 */
export const Caption: React.FC<{ text: string; duration: number }> = ({ text, duration }) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const revealEnd = Math.min(duration - 20, 18 + words.length * 7);
  const shown = Math.floor(lin(f, 6, revealEnd, 0, words.length));
  const out = lin(f, duration - 8, duration, 1, 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 150,
        top: 1480,
        textAlign: 'center',
        fontFamily: FONT_STACK,
        fontWeight: 700,
        fontSize: 50,
        lineHeight: 1.3,
        color: COLORS.white,
        opacity: out,
        textShadow: '0 0 12px rgba(255,255,255,0.45)',
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ opacity: i < shown ? 1 : 0 }}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  );
};
