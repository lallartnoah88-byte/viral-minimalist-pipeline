import React from 'react';
import { AbsoluteFill, random, Sequence, useCurrentFrame } from 'remotion';
import { ease, lin, placeIcon, popIn, scaleAround } from '../components/anim';
import { CameraRig } from '../components/CameraRig';
import {
  arrowHead,
  BRAIN_FOLDS,
  BRAIN_LEFT,
  BRAIN_RIGHT,
  circle,
  COLORS,
  CX,
  CY,
  HEIGHT,
  line,
  polar,
  polyline,
  rect,
  WIDTH,
} from '../components/geometry';
import { GlowingSvgPath } from '../components/GlowingSvgPath';
import { MinimalCanvas } from '../components/MinimalCanvas';
import { getVideo, SfxTrack } from '../components/SfxTrack';
import { TypewriterText } from '../components/TypewriterText';

const ID = 'Video1-MentalNoise' as const;
const SCENES = getVideo(ID).scenes;

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    {children}
  </svg>
);

/* Scène 1 : cerveau + batterie rouge 10 % ------------------------------------ */
const BrainBattery: React.FC = () => {
  const f = useCurrentFrame();
  const brain = placeIcon(CX, 820, 640);
  const collapse = ease(f, 104, 120, 1, 0.02);
  const blink = f > 70 && Math.floor(f / 8) % 2 === 1 ? 0.25 : 1;
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 120, scale: 1.08 }]}>
      <Stage>
        <g transform={scaleAround(CX, CY, collapse)}>
          <GlowingSvgPath
            d={[BRAIN_LEFT, BRAIN_RIGHT, ...BRAIN_FOLDS]}
            transform={brain.transform}
            strokeWidth={8 / brain.scale}
            start={0}
            duration={25}
            stagger={3}
          />
          <GlowingSvgPath d={[rect(390, 1190, 300, 130, 22), rect(690, 1228, 22, 54, 6)]} start={45} duration={20} stagger={4} />
          <GlowingSvgPath d={rect(408, 1208, 30, 94, 6)} start={58} duration={10} color="red" fill={COLORS.red} opacity={blink} />
          <GlowingSvgPath d={[line([540, 1225], [540, 1268]), circle(540, 1290, 3)]} start={62} duration={10} color="red" opacity={blink} />
        </g>
      </Stage>
    </CameraRig>
  );
};

/* Scène 2 : point central + 12 flèches vibrantes ------------------------------ */
const ScatteredArrows: React.FC = () => {
  const f = useCurrentFrame();
  const collapse = ease(f, 136, 150, 1, 0);
  return (
    <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 150, scale: 1.06, rotate: 4 }]}>
      <Stage>
        <g transform={scaleAround(CX, CY, collapse)}>
          <GlowingSvgPath d={circle(CX, CY, 16)} progress={1} fill={COLORS.white} />
          {Array.from({ length: 12 }, (_, i) => {
            const base = i * 30 + (random(`a${i}`) - 0.5) * 22;
            const dev = (random(`d${i}`) - 0.5) * 50;
            const r0 = 70 + random(`r${i}`) * 30;
            const len = 190 + random(`l${i}`) * 140;
            const a = polar(CX, CY, r0, base);
            const b: [number, number] = [a[0] + len * Math.cos(((base + dev) * Math.PI) / 180), a[1] + len * Math.sin(((base + dev) * Math.PI) / 180)];
            // Vibration perpendiculaire (line boil exagéré) une fois la flèche tracée
            const amp = lin(f, 30, 45, 0, 9);
            const perp = ((base + dev + 90) * Math.PI) / 180;
            const wob = Math.sin(f * 1.9 + i * 1.7) * amp;
            return (
              <g key={i} transform={`translate(${Math.cos(perp) * wob} ${Math.sin(perp) * wob})`}>
                <GlowingSvgPath d={[line(a, b), arrowHead(a, b, 28)]} start={14 + i * 1.5} duration={18} stagger={14} />
              </g>
            );
          })}
        </g>
      </Stage>
    </CameraRig>
  );
};

/* Scène 3 : 5 fenêtres d'onglets empilées ------------------------------------- */
const TabWindow: React.FC<{ x: number; y: number; start: number; accent: boolean }> = ({ x, y, start, accent }) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const w = 600;
  const h = 420;
  const s = popIn(f, start);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const paths = [
    rect(x, y, w, h, 18),
    line([x, y + 74], [x + w, y + 74]),
    polyline([[x + 18, y], [x + 30, y - 46], [x + 150, y - 46], [x + 162, y]]),
    polyline([[x + 162, y], [x + 174, y - 46], [x + 294, y - 46], [x + 306, y]]),
    polyline([[x + 306, y], [x + 318, y - 46], [x + 438, y - 46], [x + 450, y]]),
    line([x + 50, y + 140], [x + 420, y + 140]),
    line([x + 50, y + 200], [x + 540, y + 200]),
    line([x + 50, y + 260], [x + 300, y + 260]),
    line([x + 50, y + 320], [x + 470, y + 320]),
  ];
  return (
    <g transform={scaleAround(cx, cy, s)} opacity={lin(f, start, start + 3, 0, 1)}>
      <path d={rect(x, y - 46, w, h + 46, 18)} fill={COLORS.bg} />
      <GlowingSvgPath d={paths} progress={1} strokeWidth={7} />
      <GlowingSvgPath d={circle(x + w - 46, y + 37, 12)} progress={1} color={accent ? 'red' : 'white'} fill={accent ? COLORS.red : 'none'} />
    </g>
  );
};

const OpenTabs: React.FC = () => {
  const f = useCurrentFrame();
  const out = lin(f, 140, 150, 1, 0);
  return (
    <CameraRig keys={[{ frame: 0, scale: 1.12 }, { frame: 110, scale: 0.98 }]} shakes={[{ frame: 86, intensity: 10 }]}>
      <Stage>
        <g opacity={out}>
          {Array.from({ length: 5 }, (_, i) => (
            <TabWindow key={i} x={CX - 300 + (i - 2) * 62} y={CY - 210 + (i - 2) * 96} start={14 + i * 18} accent={i === 4} />
          ))}
        </g>
      </Stage>
    </CameraRig>
  );
};

/* Scène 4 : ligne rouge -> cible + EXECUTE ------------------------------------- */
const Execute: React.FC = () => {
  const f = useCurrentFrame();
  const target: [number, number] = [830, 900];
  const ring = lin(f, 50, 72, 30, 300);
  const ringOpacity = lin(f, 50, 72, 1, 0);
  return (
    <>
      <CameraRig keys={[{ frame: 0, x: 500, scale: 1 }, { frame: 50, x: 600, scale: 1.06 }, { frame: 240, x: 560, scale: 1.12 }]} shakes={[{ frame: 50, intensity: 26, duration: 16 }]}>
        <Stage>
          <GlowingSvgPath d={[circle(target[0], target[1], 120), circle(target[0], target[1], 78), circle(target[0], target[1], 36)]} start={0} duration={25} stagger={4} />
          <GlowingSvgPath d={line([40, 900], target)} start={0} duration={50} color="red" strokeWidth={11} glow={1.4} />
          <GlowingSvgPath d={arrowHead([40, 900], target, 40)} start={48} duration={6} color="red" strokeWidth={11} />
          {f >= 50 && f < 72 ? <path d={circle(target[0], target[1], ring)} fill="none" stroke={COLORS.red} strokeWidth={6} opacity={ringOpacity} /> : null}
          <GlowingSvgPath d={circle(target[0], target[1], 14)} start={50} duration={4} color="red" fill={COLORS.red} glow={1.6} />
        </Stage>
      </CameraRig>
      <TypewriterText text="EXECUTE" start={80} framesPerChar={3} y={1330} fontSize={128} glowColor={COLORS.red} />
    </>
  );
};

export const Video1_MentalNoise: React.FC = () => {
  const [s1, s2, s3, s4] = SCENES;
  return (
    <AbsoluteFill>
      <MinimalCanvas>
        <Sequence from={s1.from} durationInFrames={s1.to - s1.from}><BrainBattery /></Sequence>
        <Sequence from={s2.from} durationInFrames={s2.to - s2.from}><ScatteredArrows /></Sequence>
        <Sequence from={s3.from} durationInFrames={s3.to - s3.from}><OpenTabs /></Sequence>
        <Sequence from={s4.from} durationInFrames={s4.to - s4.from}><Execute /></Sequence>
      </MinimalCanvas>
      <SfxTrack id={ID} />
    </AbsoluteFill>
  );
};
