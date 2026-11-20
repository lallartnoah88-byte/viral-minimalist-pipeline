import React from 'react';
import { random, useCurrentFrame } from 'remotion';
import { ease, lin, popIn, scaleAround } from '../../components/anim';
import { CameraRig } from '../../components/CameraRig';
import { arrowHead, circle, COLORS, CX, line, Pt, rect } from '../../components/geometry';
import { GlowingSvgPath } from '../../components/GlowingSvgPath';
import { FONT_STACK, TypewriterText } from '../../components/TypewriterText';
import { Stage } from './Stage';

const CROWD: Pt[] = Array.from({ length: 26 }, (_, i) => [180 + random(`cx${i}`) * 360, 640 + random(`cy${i}`) * 520]);
const LONE: Pt = [840, 900];

/* Scène 4 : la foule ne comprend pas */
export const Misunderstood: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 330, x: 480, scale: 1.08 }]}>
      <Stage>
        {CROWD.map((p, i) => (
          <GlowingSvgPath key={i} d={circle(p[0], p[1], 22)} start={i} duration={14} color="grey" strokeWidth={5} glow={0.4} />
        ))}
        <GlowingSvgPath d={circle(LONE[0], LONE[1], 34)} start={10} duration={18} />
        {CROWD.slice(0, 8).map((p, i) => {
          const on = 50 + i * 9;
          return f >= on ? (
            <text key={i} x={p[0]} y={p[1] - 40} textAnchor="middle" fontFamily={FONT_STACK} fontWeight={700} fontSize={44} fill={COLORS.white} opacity={lin(f, on, on + 8, 0, 1)}>?</text>
          ) : null;
        })}
      </Stage>
    </CameraRig>
  );
};

/* Scène 5 : RIRES / DOUTES / ARRÊTE barrent le chemin */
export const Obstacles: React.FC = () => (
  <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 330, scale: 1.06 }]} shakes={[{ frame: 170, intensity: 22, duration: 14 }]}>
    <TypewriterText text="RIRES" start={30} framesPerChar={3} y={640} fontSize={110} color={COLORS.grey} cursor={false} />
    <TypewriterText text="DOUTES" start={100} framesPerChar={3} y={860} fontSize={110} color={COLORS.grey} cursor={false} />
    <TypewriterText text="ARRÊTE" start={170} framesPerChar={3} y={1080} fontSize={130} glowColor={COLORS.red} />
    <Stage>
      <GlowingSvgPath d={line([160, 1080], [920, 1080])} start={240} duration={20} color="red" strokeWidth={10} glow={1.3} />
    </Stage>
  </CameraRig>
);

/* Scène 6 : un mur d'or, une brique toutes les 12 images */
export const BrickWall: React.FC = () => {
  const f = useCurrentFrame();
  const bw = 180;
  const bh = 80;
  const bricks = Array.from({ length: 24 }, (_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const offset = row % 2 === 0 ? 0 : bw / 2;
    return [CX - 2 * bw + col * bw + offset - bw / 4, 1240 - (row + 1) * bh] as Pt;
  });
  return (
    <CameraRig keys={[{ frame: 0, y: 1100, scale: 1.2 }, { frame: 330, y: 1000, scale: 1 }]}>
      <Stage>
        <GlowingSvgPath d={line([160, 1240], [920, 1240])} start={0} duration={16} />
        {bricks.map((b, i) => {
          const on = 20 + i * 12;
          if (f < on) return null;
          const drop = ease(f, on, on + 10, -60, 0);
          return <path key={i} d={rect(b[0] + 6, b[1] + 6 + drop, bw - 12, bh - 12, 6)} fill="none" stroke={COLORS.gold} strokeWidth={6} opacity={lin(f, on, on + 6, 0, 1)} />;
        })}
      </Stage>
      <TypewriterText text="1 / JOUR" start={40} framesPerChar={3} y={1400} fontSize={80} color={COLORS.gold} cursor={false} />
    </CameraRig>
  );
};

/* Scène 7 : le point isolé devient la référence */
export const TurnTables: React.FC = () => {
  const f = useCurrentFrame();
  const grow = ease(f, 20, 120, 34, 120);
  const s = f >= 120 ? popIn(f, 120, 16) : 1;
  return (
    <CameraRig keys={[{ frame: 0, x: 480, scale: 1.08 }, { frame: 330, x: CX, scale: 1 }]} shakes={[{ frame: 120, intensity: 24, duration: 16 }]}>
      <Stage>
        {CROWD.map((p, i) => (
          <g key={i}>
            <GlowingSvgPath d={circle(p[0], p[1], 22)} progress={1} color="grey" strokeWidth={5} glow={0.4} />
            <GlowingSvgPath d={[line(p, [LONE[0] - 140, LONE[1]]), arrowHead(p, [LONE[0] - 140, LONE[1]], 18)]} start={130 + i * 3} duration={18} strokeWidth={3} color="grey" glow={0} opacity={0.6} />
          </g>
        ))}
        <g transform={scaleAround(LONE[0], LONE[1], s)}>
          <GlowingSvgPath d={circle(LONE[0], LONE[1], grow)} progress={1} color={f >= 120 ? 'gold' : 'white'} fill={f >= 120 ? COLORS.gold : 'none'} glow={1.5} />
        </g>
      </Stage>
      <TypewriterText text="COMMENT ?" start={200} framesPerChar={3} y={1330} fontSize={100} glowColor={COLORS.gold} />
    </CameraRig>
  );
};

export const V3_EXTRA = [Misunderstood, Obstacles, BrickWall, TurnTables];
