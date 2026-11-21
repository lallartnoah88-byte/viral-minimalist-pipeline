// Montage d'un épisode : un plan 3D par Sequence, transitions « zoom-flou », sous-titres, voix + bruitages.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { Subtitles } from './engine/Subtitles';
import { makeCue, type SceneProps, type Shot, type Timeline } from './engine/types';
import { CarScene } from './scenes/CarScene';
import { TracheaScene } from './scenes/TracheaScene';
import { NeckScene } from './scenes/NeckScene';
import { HospitalScene } from './scenes/HospitalScene';
import { CalendarScene } from './scenes/CalendarScene';
import { ThroatScene } from './scenes/ThroatScene';
import { ElbowScene } from './scenes/ElbowScene';
import { RewindOverlay } from './engine/Rewind';

const SCENES: Record<string, React.FC<SceneProps>> = {
  car: CarScene,
  trachea: TracheaScene,
  neck: NeckScene,
  hospital: HospitalScene,
  calendar: CalendarScene,
  throat: ThroatScene,
  elbow: ElbowScene,
};

const W = 1080;
const H = 1920;

const ShotView: React.FC<{ shot: Shot; prevScene?: string; rewind?: boolean }> = ({ shot, prevScene, rewind }) => {
  const f = useCurrentFrame();
  const Scene = SCENES[shot.scene];
  const cue = makeCue(shot);
  // Coupe franche ; si on change de décor, entrée « zoom-flou » sur 5 images (motion blur simulé).
  const enter = prevScene !== undefined && prevScene !== shot.scene;
  const blur = enter ? interpolate(f, [0, 5], [14, 0], { extrapolateRight: 'clamp' }) : 0;
  const scale = enter ? interpolate(f, [0, 6], [1.12, 1], { extrapolateRight: 'clamp' }) : 1;
  const exitBlur = interpolate(f, [shot.dur - 3, shot.dur], [0, 6], { extrapolateLeft: 'clamp' });
  return (
    <AbsoluteFill style={{ filter: `blur(${blur + exitBlur}px)`, transform: `scale(${scale})` }}>
      <ThreeCanvas
        width={W}
        height={H}
        shadows
        dpr={1}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, preserveDrawingBuffer: true }}
        camera={{ fov: 35, position: [0, 2, 6] }}
      >
        <Scene f={f} dur={shot.dur} mode={String(shot.params.mode ?? '')} params={shot.params} cue={cue} />
      </ThreeCanvas>
      {rewind && <RewindOverlay label={String(shot.params.rewindLabel ?? '◀◀ RETOUR EN 2018')} />}
    </AbsoluteFill>
  );
};

/** Vignettage + léger étalonnage commun (contraste, saturation « mobile »). */
const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)',
    }}
  />
);

export const Episode: React.FC<{ timeline: Timeline; only?: string }> = ({ timeline, only }) => (
  <AbsoluteFill style={{ backgroundColor: '#000', filter: 'saturate(1.12) contrast(1.04)' }}>
    {timeline.shots.map((s, i) =>
      only && only !== s.id ? null : (
        <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
          <ShotView shot={s} prevScene={timeline.shots[i - 1]?.scene} rewind={Boolean(s.params.rewind)} />
        </Sequence>
      ),
    )}
    <Grade />
    <Subtitles subs={timeline.subs} />
    <Audio src={staticFile(`${timeline.slug}/voice.wav`)} />
    <Audio src={staticFile(`${timeline.slug}/fx.wav`)} />
  </AbsoluteFill>
);
