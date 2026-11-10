import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { ease, lin, scaleAround } from '../components/anim';
import { CameraRig, CameraKey } from '../components/CameraRig';
import { circle, COLORS, CX, CY, HEIGHT, line, plot, polar, polyline, Pt, WIDTH } from '../components/geometry';
import { GlowingSvgPath } from '../components/GlowingSvgPath';
import { MinimalCanvas } from '../components/MinimalCanvas';
import { getVideo, SfxTrack } from '../components/SfxTrack';
import { TypewriterText } from '../components/TypewriterText';

const ID = 'Video2-MotivationIllusion' as const;
const SCENES = getVideo(ID).scenes;

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    {children}
  </svg>
);

/* Scène 1 : horloge qui s'emballe ------------------------------------------- */
const FastClock: React.FC = () => {
  const f = useCurrentFrame();
  const R = 250;
  const ticks = Array.from({ length: 12 }, (_, i) => line(polar(CX, CY, R - 30, i * 30), polar(CX, CY, R - (i % 3 === 0 ? 74 : 52), i * 30)));
  // Les aiguilles accélèrent : angle ∝ t^2.6 (6 tours de l'aiguille des minutes en 4 s)
  const t = f / 120;
  const minute = -90 + 360 * 6 * Math.pow(t, 2.6);
  const hour = -90 + 60 + (minute + 90) / 12;
  const handsOn = lin(f, 18, 26, 0, 1);
  const collapse = ease(f, 108, 120, 1, 0);
  return (
    <CameraRig keys={[{ frame: 0, scale: 0.94 }, { frame: 120, scale: 1.1 }]}>
      <Stage>
        <g transform={scaleAround(CX, CY, collapse)}>
          <GlowingSvgPath d={circle(CX, CY, R)} start={0} duration={25} strokeWidth={10} />
          <GlowingSvgPath d={ticks} start={6} duration={14} stagger={1} />
          <g opacity={handsOn}>
            <GlowingSvgPath d={line([CX, CY], polar(CX, CY, 130, hour))} progress={1} strokeWidth={12} />
            <GlowingSvgPath d={line([CX, CY], polar(CX, CY, 200, minute))} progress={1} strokeWidth={8} color={t > 0.6 ? 'gold' : 'white'} />
            <GlowingSvgPath d={circle(CX, CY, 12)} progress={1} fill={COLORS.white} />
          </g>
        </g>
      </Stage>
    </CameraRig>
  );
};

/* Scène 2 : la courbe monte et s'écrase contre le mur rouge ------------------ */
const CrashCurve: React.FC = () => {
  const f = useCurrentFrame();
  const wallX = 820;
  const hitY = 560;
  const curve = plot((x) => 1380 - (1380 - hitY) * Math.pow((x - 140) / (wallX - 140), 3), 140, wallX, 90);
  const fall: Pt[] = [[wallX, hitY], [776, 640], [800, 780], [752, 930], [788, 1110], [764, 1380]];
  const flash = f >= 90 && f < 100 ? 1.8 : 1;
  const collapse = ease(f, 170, 180, 1, 0);
  return (
    <CameraRig keys={[{ frame: 0, x: 500, y: 980, scale: 0.96 }, { frame: 90, x: 600, y: 900, scale: 1.04 }, { frame: 180, x: 560, y: 960, scale: 1 }]} shakes={[{ frame: 90, intensity: 30, duration: 18 }]}>
      <Stage>
        <g transform={scaleAround(CX, CY, collapse)}>
          <GlowingSvgPath d={polyline([[120, 480], [120, 1400], [980, 1400]])} start={0} duration={20} strokeWidth={6} opacity={0.7} />
          <GlowingSvgPath d={line([wallX, 420], [wallX, 1400])} start={8} duration={25} color="red" strokeWidth={14} glow={flash} />
          <GlowingSvgPath d={curve} start={15} duration={75} strokeWidth={9} />
          <GlowingSvgPath d={polyline(fall)} start={90} duration={20} strokeWidth={9} />
          {f >= 90 ? <GlowingSvgPath d={circle(wallX, hitY, 10)} progress={1} color="red" fill={COLORS.red} glow={1.5} /> : null}
        </g>
      </Stage>
    </CameraRig>
  );
};

/* Scènes 3 + 4 : escalier doré puis dézoom sur la montagne -------------------- */
const STEP_W = 28;
const STEP_H = 50;
const STAIR_ORIGIN: Pt = [300, 1070];
const STEP_START = 20; // image locale de la 1re marche (global 320)
const STEP_GAP = 22;

const MountainReveal: React.FC = () => {
  const steps = Array.from({ length: 6 }, (_, i) => {
    const x = STAIR_ORIGIN[0] + i * STEP_W;
    const y = STAIR_ORIGIN[1] - i * STEP_H;
    return polyline([[x, y], [x, y - STEP_H], [x + STEP_W, y - STEP_H]]);
  });
  const cam: CameraKey[] = [{ frame: 0, x: STAIR_ORIGIN[0] + 14, y: STAIR_ORIGIN[1] - 20, scale: 3.2 }];
  for (let i = 0; i < 6; i++) {
    cam.push({ frame: STEP_START + i * STEP_GAP + 10, x: STAIR_ORIGIN[0] + i * STEP_W + 14, y: STAIR_ORIGIN[1] - i * STEP_H - 30 });
  }
  cam.push({ frame: 180, scale: 3.2 }, { frame: 240, x: 540, y: 1090, scale: 0.92 }, { frame: 360, x: 540, y: 1080, scale: 0.95 });

  const mountain = [
    polyline([[60, 1500], [540, 640], [1020, 1500]]),
    polyline([[700, 1500], [870, 1110], [1020, 1380]]),
    polyline([[430, 838], [480, 870], [540, 818], [600, 870], [650, 838]]),
    line([30, 1500], [1050, 1500]),
    circle(860, 560, 54),
  ];
  return (
    <>
      <CameraRig keys={cam} shakes={[{ frame: 240, intensity: 14, duration: 14 }]}>
        <Stage>
          <GlowingSvgPath d={mountain} start={190} duration={45} stagger={5} strokeWidth={9} />
          <GlowingSvgPath d={steps} start={STEP_START} duration={14} stagger={STEP_GAP} color="gold" strokeWidth={3.5} />
          <GlowingSvgPath d={circle(STAIR_ORIGIN[0] + 6 * STEP_W, STAIR_ORIGIN[1] - 6 * STEP_H, 3)} start={STEP_START + 6 * STEP_GAP} duration={6} color="gold" fill={COLORS.gold} />
        </Stage>
      </CameraRig>
      <TypewriterText text="1% EVERY DAY" start={260} framesPerChar={2} y={1700} fontSize={92} glowColor={COLORS.gold} />
    </>
  );
};

export const Video2_MotivationIllusion: React.FC = () => {
  const [s1, s2, s3, s4] = SCENES;
  return (
    <AbsoluteFill>
      <MinimalCanvas>
        <Sequence from={s1.from} durationInFrames={s1.to - s1.from}><FastClock /></Sequence>
        <Sequence from={s2.from} durationInFrames={s2.to - s2.from}><CrashCurve /></Sequence>
        {/* Les scènes 3 et 4 partagent le même monde : la caméra dézoome de l'escalier vers la montagne. */}
        <Sequence from={s3.from} durationInFrames={s4.to - s3.from}><MountainReveal /></Sequence>
      </MinimalCanvas>
      <SfxTrack id={ID} />
    </AbsoluteFill>
  );
};
