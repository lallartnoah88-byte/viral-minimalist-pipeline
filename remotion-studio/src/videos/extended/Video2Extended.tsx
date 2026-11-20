import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ease, lin, popIn, scaleAround } from '../../components/anim';
import { CameraRig } from '../../components/CameraRig';
import { COLORS, CX, line, polyline, rect } from '../../components/geometry';
import { GlowingSvgPath } from '../../components/GlowingSvgPath';
import { FONT_STACK, TypewriterText } from '../../components/TypewriterText';
import { Stage } from './Stage';

/* Scène 4 : sablier, on attend l'envie */
export const Hourglass: React.FC = () => {
  const f = useCurrentFrame();
  const sand = lin(f, 40, 300, 1, 0);
  const top = 560;
  const mid = 880;
  const bot = 1200;
  const blink = f > 180 && Math.floor(f / 10) % 2 === 1 ? 0.2 : 1;
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 330, scale: 1.08 }]}>
      <Stage>
        <GlowingSvgPath d={[line([CX - 220, top], [CX + 220, top]), line([CX - 220, bot], [CX + 220, bot]), polyline([[CX - 180, top], [CX - 20, mid], [CX - 180, bot]]), polyline([[CX + 180, top], [CX + 20, mid], [CX + 180, bot]])]} start={0} duration={25} stagger={4} />
        <path d={polyline([[CX - 160 * sand, mid - 300 * sand], [CX + 160 * sand, mid - 300 * sand], [CX, mid]], true)} fill={COLORS.gold} opacity={0.85} />
        <path d={polyline([[CX - 160 * (1 - sand), bot - 10], [CX + 160 * (1 - sand), bot - 10], [CX, bot - 10 - 260 * (1 - sand)]], true)} fill={COLORS.gold} opacity={0.85} />
        {f > 40 && f < 300 ? <path d={line([CX, mid], [CX, bot - 10])} stroke={COLORS.gold} strokeWidth={4} /> : null}
      </Stage>
      <g opacity={blink}><TypewriterText text="ATTENTE..." start={180} framesPerChar={3} y={1330} fontSize={96} cursor={false} /></g>
    </CameraRig>
  );
};

/* Scène 5 : même motivation, actions différentes */
export const SameMotivation: React.FC = () => {
  const f = useCurrentFrame();
  const mot = ease(f, 20, 70, 0, 260);
  const act = ease(f, 90, 220, 0, 620);
  const base = 1180;
  const bar = (x: number, h: number, color: string, label: string) => (
    <g>
      <rect x={x - 70} y={base - h} width={140} height={h} fill={color} opacity={0.9} />
      <text x={x} y={base + 60} textAnchor="middle" fontFamily={FONT_STACK} fontSize={30} fill={COLORS.white}>{label}</text>
    </g>
  );
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 330, scale: 1.05 }]} shakes={[{ frame: 220, intensity: 16, duration: 12 }]}>
      <Stage>
        <GlowingSvgPath d={line([120, base], [960, base])} start={0} duration={20} />
        {bar(280, mot, COLORS.grey, 'ENVIE A')}
        {bar(500, mot, COLORS.grey, 'ENVIE B')}
        {bar(780, act, COLORS.gold, 'ACTIONS B')}
      </Stage>
      <TypewriterText text="PAS PLUS MOTIVÉS" start={230} framesPerChar={2} y={1370} fontSize={64} />
    </CameraRig>
  );
};

/* Scène 6 : calendrier d'habitudes 7 x 4 */
export const HabitGrid: React.FC = () => {
  const f = useCurrentFrame();
  const cell = 110;
  const x0 = CX - (7 * cell) / 2;
  const y0 = 560;
  const cells = Array.from({ length: 28 }, (_, i) => i);
  return (
    <CameraRig keys={[{ frame: 0, scale: 1.1 }, { frame: 330, scale: 1 }]} shakes={[{ frame: 200, intensity: 18, duration: 12 }]}>
      <Stage>
        {cells.map((i) => {
          const x = x0 + (i % 7) * cell;
          const y = y0 + Math.floor(i / 7) * cell;
          const on = 30 + i * 6;
          const s = f >= on ? popIn(f, on, 12) : 0;
          return (
            <g key={i}>
              <path d={rect(x + 8, y + 8, cell - 16, cell - 16, 12)} fill="none" stroke={COLORS.grey} strokeWidth={4} />
              {s > 0 ? <path d={rect(x + 20, y + 20, cell - 40, cell - 40, 8)} fill={COLORS.gold} transform={scaleAround(x + cell / 2, y + cell / 2, s)} /> : null}
            </g>
          );
        })}
      </Stage>
      <TypewriterText text="SYSTÈME" start={210} framesPerChar={3} y={1260} fontSize={110} glowColor={COLORS.gold} />
    </CameraRig>
  );
};

/* Scène 7 : 1,01^365 = 37,8 */
export const Compound37: React.FC = () => {
  const f = useCurrentFrame();
  const curve = polyline(
    Array.from({ length: 91 }, (_, i) => {
      const day = (365 * i) / 90;
      return [120 + (day / 365) * 840, 1300 - (Math.pow(1.01, day) - 1) * (700 / 36.8)] as const;
    }),
  );
  const s = f >= 150 ? popIn(f, 150, 18) : 0;
  return (
    <CameraRig keys={[{ frame: 0, x: 400, scale: 1.1 }, { frame: 150, x: 700, scale: 1.05 }, { frame: 330, x: CX, scale: 1 }]} shakes={[{ frame: 150, intensity: 26, duration: 16 }]}>
      <Stage>
        <GlowingSvgPath d={[line([120, 1300], [960, 1300]), line([120, 1300], [120, 520])]} start={0} duration={18} color="grey" strokeWidth={5} />
        <GlowingSvgPath d={curve} start={10} duration={140} color="gold" strokeWidth={9} glow={1.3} />
        {s > 0 ? (
          <g transform={scaleAround(860, 520, s)}>
            <text x={860} y={550} textAnchor="middle" fontFamily={FONT_STACK} fontWeight={700} fontSize={130} fill={COLORS.gold}>x37</text>
          </g>
        ) : null}
      </Stage>
    </CameraRig>
  );
};

export const V2_EXTRA = [Hourglass, SameMotivation, HabitGrid, Compound37];
