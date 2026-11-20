import React from 'react';
import { random, useCurrentFrame } from 'remotion';
import { ease, lin, scaleAround } from '../../components/anim';
import { CameraRig } from '../../components/CameraRig';
import { circle, COLORS, CX, line, polar, polyline, rect } from '../../components/geometry';
import { GlowingSvgPath } from '../../components/GlowingSvgPath';
import { FONT_STACK, TypewriterText } from '../../components/TypewriterText';
import { Stage } from './Stage';

/* Scène 4 : téléphone + compteur de notifications 0 -> 96 */
export const PhoneBuzz: React.FC = () => {
  const f = useCurrentFrame();
  const count = Math.round(ease(f, 20, 150, 0, 96));
  const buzz = f > 20 && f < 150 && f % 6 < 2 ? (random(`buzz${f}`) - 0.5) * 14 : 0;
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 330, scale: 1.1 }]} shakes={[{ frame: 150, intensity: 22, duration: 14 }]}>
      <Stage>
        <g transform={`translate(${buzz} 0)`}>
          <GlowingSvgPath d={[rect(CX - 170, 520, 340, 640, 46), line([CX - 50, 570], [CX + 50, 570]), circle(CX, 1110, 22)]} start={0} duration={25} stagger={4} />
          <GlowingSvgPath d={circle(CX + 160, 530, 70)} start={14} duration={12} color="red" fill={COLORS.red} glow={1.4} />
          <text x={CX + 160} y={552} textAnchor="middle" fontFamily={FONT_STACK} fontWeight={700} fontSize={62} fill={COLORS.white}>{count}</text>
        </g>
        {[0, 1, 2].map((i) => (
          <path key={i} d={circle(CX, 840, 260 + ((f * 4 + i * 60) % 180))} fill="none" stroke={COLORS.white} strokeWidth={3} opacity={f > 20 && f < 160 ? 0.25 : 0} />
        ))}
      </Stage>
      <TypewriterText text="96 / JOUR" start={160} framesPerChar={3} y={1300} fontSize={96} color={COLORS.gold} />
    </CameraRig>
  );
};

/* Scène 5 : chronomètre, aiguille rouge 23 minutes */
export const FocusTimer: React.FC = () => {
  const f = useCurrentFrame();
  const angle = ease(f, 40, 200, -90, -90 + (23 / 60) * 360);
  const tip = polar(CX, 860, 250, angle);
  const ticks = Array.from({ length: 12 }, (_, i) => line(polar(CX, 860, 300, i * 30), polar(CX, 860, 270, i * 30)));
  return (
    <CameraRig keys={[{ frame: 0, scale: 1.05 }, { frame: 200, scale: 1 }, { frame: 330, scale: 1.08 }]} shakes={[{ frame: 200, intensity: 24, duration: 16 }]}>
      <Stage>
        <GlowingSvgPath d={[circle(CX, 860, 320), line([CX - 40, 500], [CX + 40, 500]), line([CX, 500], [CX, 540])]} start={0} duration={25} stagger={4} />
        <GlowingSvgPath d={ticks} start={15} duration={10} stagger={1} strokeWidth={6} color="grey" />
        <path d={`M${CX} 860 L${polar(CX, 860, 310, -90).join(' ')} A310 310 0 ${angle + 90 > 180 ? 1 : 0} 1 ${polar(CX, 860, 310, angle).join(' ')} Z`} fill={COLORS.red} opacity={0.18 * lin(f, 40, 60, 0, 1)} />
        <GlowingSvgPath d={line([CX, 860], tip)} start={35} duration={6} color="red" strokeWidth={10} glow={1.4} />
        <GlowingSvgPath d={circle(CX, 860, 16)} start={35} duration={4} color="red" fill={COLORS.red} />
      </Stage>
      <TypewriterText text="-23 MIN" start={205} framesPerChar={3} y={1330} fontSize={120} glowColor={COLORS.red} />
    </CameraRig>
  );
};

/* Scène 6 : un cercle se fissure en 12 éclats */
const SHARDS = Array.from({ length: 12 }, (_, i) => i * 30);
const shard = (r0: number, r1: number, a: number) => polyline([polar(0, 0, r0, a), polar(0, 0, r1, a), polar(0, 0, r1, a + 30), polar(0, 0, r0, a + 30)], true);
export const Fragmented: React.FC = () => {
  const f = useCurrentFrame();
  const spread = ease(f, 60, 220, 0, 1);
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 330, scale: 0.92, rotate: 4 }]} shakes={[{ frame: 60, intensity: 18, duration: 12 }]}>
      <Stage>
        {SHARDS.map((a, i) => {
          const [dx, dy] = polar(0, 0, spread * (70 + random(`d${i}`) * 90), a + 15);
          const rot = spread * (random(`r${i}`) - 0.5) * 60;
          return (
            <g key={i} transform={`translate(${CX + dx} ${880 + dy}) rotate(${rot})`}>
              <GlowingSvgPath d={shard(90, 300, a)} start={i * 2} duration={20} strokeWidth={6} color={i % 4 === 0 ? 'red' : 'white'} />
            </g>
          );
        })}
      </Stage>
      <TypewriterText text="FRAGMENTÉ" start={230} framesPerChar={3} y={1400} fontSize={100} />
    </CameraRig>
  );
};

/* Scène 7 : les éclats se ressoudent, onde de silence */
export const SilenceRepair: React.FC = () => {
  const f = useCurrentFrame();
  const spread = ease(f, 0, 90, 1, 0);
  const wave = lin(f, 100, 300, 0, 1);
  const pulse = f >= 90 ? 1 + 0.06 * Math.max(0, 1 - (f - 90) / 12) : 1;
  return (
    <CameraRig keys={[{ frame: 0, scale: 0.92 }, { frame: 330, scale: 1.04 }]}>
      <Stage>
        <g transform={scaleAround(CX, 880, pulse)}>
          {SHARDS.map((a, i) => {
            const [dx, dy] = polar(0, 0, spread * (70 + random(`d${i}`) * 90), a + 15);
            return (
              <g key={i} transform={`translate(${CX + dx} ${880 + dy}) rotate(${spread * (random(`r${i}`) - 0.5) * 60})`}>
                <GlowingSvgPath d={shard(90, 300, a)} progress={1} strokeWidth={6} color={f >= 90 ? 'white' : 'grey'} />
              </g>
            );
          })}
        </g>
        {f >= 100 ? <path d={circle(CX, 880, 300 + wave * 520)} fill="none" stroke={COLORS.white} strokeWidth={4} opacity={1 - wave} /> : null}
      </Stage>
      <TypewriterText text="SILENCE" start={150} framesPerChar={4} y={1340} fontSize={110} />
    </CameraRig>
  );
};

export const V1_EXTRA = [PhoneBuzz, FocusTimer, Fragmented, SilenceRepair];
