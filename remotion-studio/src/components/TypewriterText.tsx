import React from 'react';
import { continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { COLORS } from './geometry';

// Chargement de JetBrains Mono embarquée dans public/fonts (rendu identique sur toutes les machines).
export const FONT_FAMILY = 'JetBrains Mono Pack';
export const FONT_STACK = `'${FONT_FAMILY}', 'JetBrains Mono', ui-monospace, monospace`;
let fontRequested = false;
const ensureFont = () => {
  if (fontRequested || typeof document === 'undefined') return;
  fontRequested = true;
  const handle = delayRender('Chargement de JetBrains Mono');
  const face = new FontFace(FONT_FAMILY, `url(${staticFile('fonts/JetBrainsMono-Bold.ttf')}) format('truetype')`, {
    weight: '700',
  });
  face
    .load()
    .then((loaded) => {
      (document.fonts as unknown as { add: (font: FontFace) => void }).add(loaded);
      continueRender(handle);
    })
    .catch(() => continueRender(handle)); // repli sur la police monospace système
};
ensureFont();

type Props = {
  text: string;
  /** Image (locale) où la frappe commence. */
  start?: number;
  /** Images par caractère. */
  framesPerChar?: number;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  letterSpacing?: number;
  /** Image (locale) où le texte disparaît (optionnel). */
  hideAt?: number;
  cursor?: boolean;
};

/** Texte écrit lettre par lettre en JetBrains Mono avec curseur clignotant. */
export const TypewriterText: React.FC<Props> = ({
  text,
  start = 0,
  framesPerChar = 2,
  x = 540,
  y = 960,
  fontSize = 72,
  color = COLORS.white,
  glowColor,
  letterSpacing = 0.12,
  hideAt,
  cursor = true,
}) => {
  const frame = useCurrentFrame();
  if (frame < start || (hideAt !== undefined && frame >= hideAt)) return null;
  const count = Math.min(text.length, Math.floor((frame - start) / framesPerChar) + 1);
  const typing = count < text.length;
  // Curseur : fixe pendant la frappe, clignote (15 images) une fois le mot terminé.
  const showCursor = cursor && (typing || Math.floor((frame - start) / 15) % 2 === 0);
  const glow = glowColor ?? color;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: '100%',
        top: y - fontSize * 0.6,
        textAlign: 'center',
        fontFamily: `'${FONT_FAMILY}', 'JetBrains Mono', ui-monospace, monospace`,
        fontWeight: 700,
        fontSize,
        letterSpacing: `${letterSpacing}em`,
        color,
        whiteSpace: 'pre',
        textShadow: `0 0 8px ${glow}, 0 0 28px ${glow}99`,
        transform: `translateX(${x - 540}px)`,
      }}
    >
      {/* Le texte complet est réservé (invisible) pour que le mot ne se décale pas pendant la frappe. */}
      <span>{text.slice(0, count)}</span>
      <span style={{ opacity: 0 }}>{text.slice(count)}</span>
      <span
        style={{
          display: 'inline-block',
          width: '0.55em',
          height: '1em',
          marginLeft: '0.08em',
          verticalAlign: '-0.12em',
          background: showCursor ? color : 'transparent',
          boxShadow: showCursor ? `0 0 12px ${glow}` : 'none',
        }}
      />
    </div>
  );
};
