import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { ease, lin, popIn, scaleAround } from '../components/anim';
import { CameraRig } from '../components/CameraRig';
import { circle, COLORS, cubicPoint, CX, CY, HEIGHT, polyline, Pt, rect, regular, WIDTH } from '../components/geometry';
import { GlowingSvgPath } from '../components/GlowingSvgPath';
import { MinimalCanvas } from '../components/MinimalCanvas';
import { getVideo, SfxTrack } from '../components/SfxTrack';
import { TypewriterText } from '../components/TypewriterText';

const ID = 'Video3-PriceOfDifference' as const;
const SCENES = getVideo(ID).scenes;

/** Rayon du cercle blanc : identique sur la première et la dernière image (boucle parfaite). */
const HERO_R = 44;

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    {children}
  </svg>
);

const Hero: React.FC<{ x?: number; y?: number; scale?: number }> = ({ x = CX, y = CY, scale = 1 }) => (
  <GlowingSvgPath d={circle(x, y, HERO_R)} progress={1} transform={scaleAround(x, y, scale)} strokeWidth={9} glow={1.2} />
);

/** Géométrie sacrée dorée centrée sur (x, y). */
const structurePaths = (x: number, y: number) => [
  polyline(regular(x, y, 230, 6, -90), true),
  polyline(regular(x, y, 230, 3, -90), true),
  polyline(regular(x, y, 230, 3, 90), true),
  circle(x, y, 115),
  circle(x, y, 262),
  polyline(regular(x, y, 66, 6, 0), true),
];

/* Scène 1 : le cercle isolé, respiration lente ------------------------------- */
const Isolated: React.FC = () => {
  const f = useCurrentFrame();
  // sin(2πf/120) vaut 0 à l'image 0 et à l'image 120 : aucune rupture avec la suite ni avec la boucle.
  const breath = 1 + 0.04 * Math.sin((2 * Math.PI * f) / 120);
  return (
    <Stage>
      <Hero scale={breath} />
    </Stage>
  );
};

/* Scènes 2 + 3 : boîte COMFORT, route pointillée, structure dorée --------------- */
const ROUTE: [Pt, Pt, Pt, Pt] = [[CX, CY], [860, 820], [220, 560], [CX, 380]];
const ROUTE_START = 90; // global 210
const ROUTE_END = 200;
const STRUCT_START = 210; // global 330

const Journey: React.FC = () => {
  const f = useCurrentFrame();
  const p = ease(f, ROUTE_START, ROUTE_END, 0, 1);
  const hero = cubicPoint(...ROUTE, p);
  const trail = Array.from({ length: 26 }, (_, i) => (i + 1) / 27);
  const dots: Pt[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) dots.push([360 + c * 72, 1222 + r * 60]);
  const labelOn = lin(f, 18, 30, 0, 1);
  const structure = structurePaths(CX, 380);
  return (
    <CameraRig
      keys={[
        { frame: 0, x: CX, y: CY, scale: 1 },
        { frame: 20, x: CX, y: 1060, scale: 0.92 },
        { frame: ROUTE_START, x: CX, y: 1040, scale: 0.92 },
        { frame: ROUTE_END, x: CX, y: 560, scale: 1 },
        { frame: 300, x: CX, y: 380, scale: 1 },
      ]}
      shakes={[{ frame: 306, intensity: 16, duration: 14 }]}
    >
      <Stage>
        {/* Boîte grise COMFORT et ses 30 points gris */}
        <GlowingSvgPath d={rect(300, 1120, 480, 410, 18)} start={0} duration={25} color="grey" strokeWidth={6} glow={0.3} />
        <text
          x={CX}
          y={1178}
          textAnchor="middle"
          fill={COLORS.grey}
          opacity={labelOn}
          style={{ font: "700 34px 'JetBrains Mono Pack', 'JetBrains Mono', monospace", letterSpacing: '0.3em' }}
        >
          COMFORT
        </text>
        {dots.map(([x, y], i) => {
          const start = 30 + i * 0.8;
          if (f < start) return null;
          return <circle key={i} cx={x} cy={y} r={9} fill={COLORS.grey} transform={scaleAround(x, y, popIn(f, start, 12))} />;
        })}

        {/* Route en pointillés laissée par le cercle */}
        {trail.map((t, i) =>
          p >= t ? <circle key={i} cx={cubicPoint(...ROUTE, t)[0]} cy={cubicPoint(...ROUTE, t)[1]} r={5} fill={COLORS.white} opacity={0.85} /> : null
        )}

        {/* Structure géométrique dorée au bout de la route */}
        <GlowingSvgPath d={structure} start={STRUCT_START} duration={30} stagger={16} color="gold" strokeWidth={6} />

        <Hero x={hero[0]} y={hero[1]} />
      </Stage>
    </CameraRig>
  );
};

/* Scène 4 : SILENCE. puis retour au cercle isolé (boucle) ----------------------- */
const Silence: React.FC = () => {
  const f = useCurrentFrame();
  const collapse = ease(f, 88, 118, 1, 0);
  const fade = lin(f, 100, 118, 1, 0);
  return (
    <>
      <Stage>
        <g transform={scaleAround(CX, CY, collapse)} opacity={fade}>
          <GlowingSvgPath d={structurePaths(CX, CY)} progress={1} color="gold" strokeWidth={6} />
        </g>
        <Hero />
      </Stage>
      <TypewriterText text="SILENCE." start={20} framesPerChar={3} y={1560} fontSize={120} hideAt={90} />
    </>
  );
};

export const Video3_PriceOfDifference: React.FC = () => {
  const [s1, s2, , s4] = SCENES;
  return (
    <AbsoluteFill>
      <MinimalCanvas>
        <Sequence from={s1.from} durationInFrames={s1.to - s1.from}><Isolated /></Sequence>
        {/* Scènes 2 et 3 : un seul plan, la caméra suit le cercle jusqu'à la structure dorée. */}
        <Sequence from={s2.from} durationInFrames={s4.from - s2.from}><Journey /></Sequence>
        <Sequence from={s4.from} durationInFrames={s4.to - s4.from}><Silence /></Sequence>
      </MinimalCanvas>
      <SfxTrack id={ID} />
    </AbsoluteFill>
  );
};
