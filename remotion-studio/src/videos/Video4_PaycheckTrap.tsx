import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { ease, lin, popIn, scaleAround } from '../components/anim';
import { CameraRig } from '../components/CameraRig';
import { arrowHead, circle, COLORS, CX, CY, HEIGHT, line, polar, polyline, Pt, rect, WIDTH } from '../components/geometry';
import { GlowingSvgPath, GlowColor } from '../components/GlowingSvgPath';
import { MinimalCanvas } from '../components/MinimalCanvas';
import { getVideo, SfxTrack } from '../components/SfxTrack';
import { FONT_STACK, TypewriterText } from '../components/TypewriterText';

/*
 * Vidéo bonus — « Le Piège du Salaire » (thème argent), 61 s = 1830 images à 30 fps.
 * Pas de voix-off : les phrases du storyboard s'affichent en sous-titres mot par mot.
 */
const ID = 'Video4-PaycheckTrap' as const;
const SCENES = getVideo(ID).scenes;

/* Intérêts composés : 100 €/mois, 8 %/an (mensualisé), 30 ans. */
const MONTHLY = 100;
const RATE = 0.08 / 12;
const capitalAfter = (years: number) => MONTHLY * ((1 + RATE) ** (years * 12) - 1) / RATE;
const FINAL = capitalAfter(30); // ≈ 149 036 €
const CONTRIB = MONTHLY * 12 * 30; // 36 000 €

const euro = (v: number) => `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    {children}
  </svg>
);

/** Pièce € : double cercle + symbole euro, centré sur (x, y). */
const coinPaths = (x: number, y: number, r: number) => {
  const er = r * 0.42;
  const ex = x + r * 0.08;
  const a = polar(ex, y, er, -48);
  const b = polar(ex, y, er, 48);
  return [
    circle(x, y, r),
    circle(x, y, r * 0.8),
    `M${a[0]} ${a[1]} A${er} ${er} 0 1 0 ${b[0]} ${b[1]}`,
    line([x - r * 0.5, y - r * 0.1], [x + r * 0.12, y - r * 0.1]),
    line([x - r * 0.5, y + r * 0.1], [x + r * 0.12, y + r * 0.1]),
  ];
};

const Coin: React.FC<{ x: number; y: number; r: number; start?: number; color?: GlowColor; progress?: number; strokeWidth?: number }> = ({
  x,
  y,
  r,
  start = 0,
  color = 'gold',
  progress,
  strokeWidth = 8,
}) => <GlowingSvgPath d={coinPaths(x, y, r)} start={start} duration={22} stagger={3} color={color} progress={progress} strokeWidth={strokeWidth} />;

const Label: React.FC<{ x: number; y: number; text: string; color?: string; size?: number; opacity?: number }> = ({
  x,
  y,
  text,
  color = COLORS.white,
  size = 34,
  opacity = 1,
}) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fill={color}
    opacity={opacity}
    style={{ font: `700 ${size}px ${FONT_STACK}`, letterSpacing: '0.14em', filter: `drop-shadow(0 0 8px ${color})` }}
  >
    {text}
  </text>
);

/** Compteur animé avec la courbe signature. */
const Counter: React.FC<{ from: number; to: number; start: number; end: number; y: number; size?: number; color?: string }> = ({
  from,
  to,
  start,
  end,
  y,
  size = 120,
  color = COLORS.white,
}) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const v = ease(f, start, end, from, to);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: '100%',
        top: y - size * 0.6,
        textAlign: 'center',
        fontFamily: FONT_STACK,
        fontWeight: 700,
        fontSize: size,
        color,
        letterSpacing: '0.04em',
        textShadow: `0 0 10px ${color}, 0 0 34px ${color}88`,
      }}
    >
      {euro(v)}
    </div>
  );
};

/** Sous-titre révélé mot par mot (remplace la voix-off). */
const Caption: React.FC<{ text: string; duration: number }> = ({ text, duration }) => {
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
        right: 70,
        top: 1600,
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

/* 1. 5 000 € par mois… et pauvre ------------------------------------------------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const crack: Pt[] = [[470, 520], [520, 610], [490, 680], [560, 760], [530, 860], [600, 930]];
  const grey = f >= 135;
  const collapse = ease(f, 196, 210, 1, 0.05);
  return (
    <>
      <CameraRig keys={[{ frame: 0, scale: 0.94 }, { frame: 210, scale: 1.08 }]} shakes={[{ frame: 135, intensity: 24, duration: 16 }]}>
        <Stage>
          <g transform={scaleAround(CX, 720, collapse)}>
            <Coin x={CX} y={720} r={230} color={grey ? 'grey' : 'gold'} />
            <GlowingSvgPath d={polyline(crack)} start={135} duration={8} color="red" strokeWidth={9} glow={1.4} />
          </g>
        </Stage>
      </CameraRig>
      <Counter from={0} to={5000} start={25} end={80} y={1200} color={grey ? COLORS.grey : COLORS.white} />
      <TypewriterText text="/ MOIS" start={82} framesPerChar={2} y={1320} fontSize={56} color={grey ? COLORS.grey : COLORS.white} cursor={false} />
    </>
  );
};

/* 2. Le salaire disparaît --------------------------------------------------------- */
const Drain: React.FC = () => {
  const f = useCurrentFrame();
  const labels = ['LOYER', 'CRÉDIT', 'ABONNEMENTS', 'ACHATS'];
  const xs = [165, 415, 665, 915];
  const left = lin(f, 70, 190, 1, 0);
  const barColor = left < 0.3 ? COLORS.red : COLORS.white;
  return (
    <>
      <CameraRig keys={[{ frame: 0, scale: 1 }, { frame: 240, scale: 1.04 }]} shakes={[{ frame: 190, intensity: 20 }]}>
        <Stage>
          <Coin x={CX} y={560} r={110} progress={1} />
          {xs.map((x, i) => {
            const a: Pt = [CX + (x - CX) * 0.18, 690];
            const b: Pt = [x, 930];
            return (
              <g key={i}>
                <GlowingSvgPath d={[line(a, b), arrowHead(a, b, 24)]} start={30 + i * 15} duration={16} stagger={12} color="red" strokeWidth={7} />
                <GlowingSvgPath d={rect(x - 112, 960, 224, 90, 12)} start={40 + i * 15} duration={16} strokeWidth={5} />
                <Label x={x} y={1018} text={labels[i]} size={labels[i].length > 8 ? 25 : 32} opacity={lin(f, 50 + i * 15, 58 + i * 15, 0, 1)} />
              </g>
            );
          })}
          <GlowingSvgPath d={rect(140, 1180, 800, 70, 14)} start={20} duration={20} strokeWidth={5} />
          {left > 0 ? <rect x={154} y={1194} width={772 * left} height={42} rx={8} fill={barColor} style={{ filter: `drop-shadow(0 0 14px ${barColor})` }} /> : null}
          <Label x={CX} y={1310} text="SOLDE" size={30} color={COLORS.grey} />
        </Stage>
      </CameraRig>
      <Counter from={5000} to={0} start={70} end={190} y={1420} size={84} color={barColor} />
    </>
  );
};

/* 3. La course du rat ------------------------------------------------------------- */
const RatRace: React.FC = () => {
  const f = useCurrentFrame();
  const R = 270;
  const t = lin(f, 30, 230, 0, 1);
  const laps = 4 * t * t; // accélération : 4 tours, passages en haut aux images 130, 171, 203, 230
  const dot = polar(CX, CY - 60, R, -90 + 360 * laps);
  const nodes: [number, string][] = [[-90, 'TRAVAILLER'], [30, 'PAYER'], [150, 'RECOMMENCER']];
  return (
    <CameraRig keys={[{ frame: 0, scale: 0.92 }, { frame: 240, scale: 1.12, rotate: -3 }]}>
      <Stage>
        <GlowingSvgPath d={circle(CX, CY - 60, R)} start={0} duration={30} strokeWidth={7} />
        {nodes.map(([a, name], i) => {
          const p = polar(CX, CY - 60, R, a);
          const lp = polar(CX, CY - 60, R + (i === 0 ? 70 : 80), a);
          const mid = polar(CX, CY - 60, R, a + 60);
          const prev = polar(CX, CY - 60, R, a + 55);
          return (
            <g key={i}>
              <GlowingSvgPath d={circle(p[0], p[1], 16)} start={14 + i * 6} duration={10} fill={COLORS.bg} />
              <GlowingSvgPath d={arrowHead(prev, mid, 26)} start={24 + i * 6} duration={8} strokeWidth={7} />
              <Label x={lp[0]} y={lp[1] + 12} text={name} size={28} opacity={lin(f, 20 + i * 6, 30 + i * 6, 0, 1)} />
            </g>
          );
        })}
        {f >= 30 ? <GlowingSvgPath d={circle(dot[0], dot[1], 18)} progress={1} color="red" fill={COLORS.red} glow={1.5} /> : null}
      </Stage>
    </CameraRig>
  );
};

/* 4. Passif vs Actif --------------------------------------------------------------- */
const PassiveActive: React.FC = () => {
  const f = useCurrentFrame();
  const flow = (f % 30) / 30;
  const diamond = polyline([[700, 860], [880, 860], [930, 920], [790, 1090], [650, 920]], true);
  const facets = polyline([[650, 920], [930, 920]]);
  return (
    <CameraRig keys={[{ frame: 0, x: 380, scale: 1.05 }, { frame: 90, x: 380, scale: 1.05 }, { frame: 140, x: CX, scale: 1 }]}>
      <Stage>
        <GlowingSvgPath d={line([CX, 640], [CX, 1420])} start={10} duration={25} color="grey" strokeWidth={4} glow={0.3} />
        {/* PASSIF : l'argent sort */}
        <Label x={290} y={720} text="PASSIF" color={COLORS.red} size={46} opacity={lin(f, 18, 26, 0, 1)} />
        <Coin x={290} y={920} r={95} start={20} color="white" strokeWidth={7} />
        {[0, 1, 2].map((i) => {
          const x = 210 + i * 80;
          return <GlowingSvgPath key={i} d={[line([x, 1050], [x, 1300]), arrowHead([x, 1050], [x, 1300], 22)]} start={45 + i * 5} duration={18} stagger={14} color="red" strokeWidth={7} />;
        })}
        {f >= 70
          ? [0, 1, 2].map((i) => {
              const y = 1080 + ((flow + i / 3) % 1) * 220;
              return <circle key={i} cx={210 + i * 80} cy={y} r={9} fill={COLORS.red} opacity={0.9} />;
            })
          : null}
        {/* ACTIF : l'argent entre */}
        <Label x={790} y={720} text="ACTIF" color={COLORS.gold} size={46} opacity={lin(f, 108, 116, 0, 1)} />
        <GlowingSvgPath d={[diamond, facets]} start={110} duration={25} stagger={6} color="gold" strokeWidth={7} />
        {[0, 1, 2].map((i) => {
          const x = 710 + i * 80;
          return <GlowingSvgPath key={i} d={[line([x, 1380], [x, 1130]), arrowHead([x, 1380], [x, 1130], 22)]} start={130 + i * 5} duration={18} stagger={14} color="gold" strokeWidth={7} />;
        })}
        {f >= 150
          ? [0, 1, 2].map((i) => {
              const y = 1370 - ((flow + i / 3) % 1) * 220;
              return <circle key={i} cx={710 + i * 80} cy={y} r={9} fill={COLORS.gold} opacity={0.9} />;
            })
          : null}
      </Stage>
    </CameraRig>
  );
};

/* 5. 100 € / 8 % / 30 ans ------------------------------------------------------------ */
const Plan: React.FC = () => (
  <>
    <TypewriterText text="100 € / MOIS" start={10} framesPerChar={2} y={640} fontSize={104} cursor={false} />
    <TypewriterText text="8 % / AN" start={70} framesPerChar={2} y={900} fontSize={104} color={COLORS.gold} cursor={false} />
    <TypewriterText text="30 ANS" start={130} framesPerChar={3} y={1160} fontSize={104} />
    <TypewriterText text="Rendement hypothétique · pas un conseil financier" start={150} framesPerChar={0.6} y={1380} fontSize={28} color={COLORS.grey} cursor={false} letterSpacing={0.04} />
  </>
);

/* 6. Le graphique des intérêts composés --------------------------------------------- */
const Compound: React.FC = () => {
  const f = useCurrentFrame();
  const X0 = 130;
  const X1 = 950;
  const Y0 = 1380;
  const Y1 = 560;
  const toX = (years: number) => X0 + ((X1 - X0) * years) / 30;
  const toY = (eur: number) => Y0 - ((Y0 - Y1) * eur) / 150000;
  const total = polyline(Array.from({ length: 121 }, (_, i) => [toX(i / 4), toY(capitalAfter(i / 4))] as Pt));
  const contrib = polyline([[toX(0), toY(0)], [toX(30), toY(CONTRIB)]]);
  const endPt: Pt = [toX(30), toY(FINAL)];
  return (
    <>
      <CameraRig keys={[{ frame: 0, x: 420, y: 1200, scale: 1.5 }, { frame: 120, x: CX, y: 980, scale: 1 }]} shakes={[{ frame: 120, intensity: 28, duration: 18 }]}>
        <Stage>
          <GlowingSvgPath d={polyline([[X0, 520], [X0, Y0], [990, Y0]])} start={0} duration={20} strokeWidth={5} opacity={0.7} />
          {[10, 20, 30].map((y) => (
            <Label key={y} x={toX(y)} y={Y0 + 48} text={`${y} ANS`} size={24} color={COLORS.grey} />
          ))}
          <GlowingSvgPath d={contrib} start={10} duration={110} strokeWidth={6} />
          <GlowingSvgPath d={total} start={10} duration={110} color="gold" strokeWidth={9} glow={1.3} />
          {f >= 120 ? <GlowingSvgPath d={circle(endPt[0], endPt[1], 14)} progress={1} color="gold" fill={COLORS.gold} glow={1.6} /> : null}
          <Label x={toX(25)} y={toY(CONTRIB) - 30} text="VERSÉ : 36 000 €" size={26} opacity={lin(f, 125, 135, 0, 1)} />
        </Stage>
      </CameraRig>
      <Counter from={0} to={FINAL} start={10} end={120} y={290} size={112} color={COLORS.gold} />
      <TypewriterText text={`INTÉRÊTS : ${euro(FINAL - CONTRIB)}`} start={150} framesPerChar={1.5} y={420} fontSize={50} cursor={false} />
    </>
  );
};

/* 7. Le levier du temps -------------------------------------------------------------- */
const TimeLever: React.FC = () => {
  const f = useCurrentFrame();
  const pivot: Pt = [640, 1180];
  const angle = ease(f, 80, 100, 12, -9); // le bras droit (pièce) remonte quand le levier bascule
  const hg = (x: number, y: number, s: number) => [
    line([x - 38 * s, y - 60 * s], [x + 38 * s, y - 60 * s]),
    line([x - 38 * s, y + 60 * s], [x + 38 * s, y + 60 * s]),
    `M${x - 30 * s} ${y - 60 * s} C${x - 30 * s} ${y - 20 * s} ${x - 6 * s} ${y - 10 * s} ${x - 6 * s} ${y} C${x - 6 * s} ${y + 10 * s} ${x - 30 * s} ${y + 20 * s} ${x - 30 * s} ${y + 60 * s}`,
    `M${x + 30 * s} ${y - 60 * s} C${x + 30 * s} ${y - 20 * s} ${x + 6 * s} ${y - 10 * s} ${x + 6 * s} ${y} C${x + 6 * s} ${y + 10 * s} ${x + 30 * s} ${y + 20 * s} ${x + 30 * s} ${y + 60 * s}`,
  ];
  return (
    <CameraRig keys={[{ frame: 0, x: 560, y: 1050, scale: 1.05 }, { frame: 210, x: 560, y: 1000, scale: 0.98 }]} shakes={[{ frame: 90, intensity: 22, duration: 16 }]}>
      <Stage>
        <GlowingSvgPath d={[polyline([pivot, [596, 1270], [684, 1270]], true), line([90, 1270], [990, 1270])]} start={0} duration={20} stagger={5} strokeWidth={6} />
        <g transform={`rotate(${angle} ${pivot[0]} ${pivot[1]})`}>
          <GlowingSvgPath d={line([170, pivot[1]], [880, pivot[1]])} start={8} duration={22} strokeWidth={9} />
          <g transform={`rotate(${-angle} 200 ${pivot[1] - 80})`}>
            <GlowingSvgPath d={hg(200, pivot[1] - 80, 0.8)} start={25} duration={18} stagger={3} strokeWidth={6} />
            <Label x={200} y={pivot[1] - 165} text="TEMPS" size={30} opacity={lin(f, 35, 45, 0, 1)} />
          </g>
          <g transform={`rotate(${-angle} 800 ${pivot[1] - 120})`}>
            <Coin x={800} y={pivot[1] - 120} r={115} start={30} />
          </g>
        </g>
      </Stage>
    </CameraRig>
  );
};

/* 8. Commence aujourd'hui ----------------------------------------------------------- */
const StartToday: React.FC = () => {
  const f = useCurrentFrame();
  const s = f >= 95 ? popIn(f, 95) : 0;
  return (
    <>
      <TypewriterText text="COMMENCE" start={20} framesPerChar={2} y={640} fontSize={118} />
      <TypewriterText text="AUJOURD'HUI." start={40} framesPerChar={2} y={790} fontSize={118} color={COLORS.gold} cursor={false} />
      <Stage>{s > 0 ? <g transform={scaleAround(CX, 1180, s)}><Coin x={CX} y={1180} r={110} progress={1} /></g> : null}</Stage>
    </>
  );
};

const SCENE_COMPONENTS = [Hook, Drain, RatRace, PassiveActive, Plan, Compound, TimeLever, StartToday];

export const Video4_PaycheckTrap: React.FC = () => (
  <AbsoluteFill>
    <MinimalCanvas>
      {SCENES.map((scene, i) => {
        const Scene = SCENE_COMPONENTS[i];
        const duration = scene.to - scene.from;
        return (
          <Sequence key={i} from={scene.from} durationInFrames={duration}>
            <Scene />
            <Caption text={scene.voFr} duration={duration} />
          </Sequence>
        );
      })}
    </MinimalCanvas>
    <SfxTrack id={ID} />
  </AbsoluteFill>
);

