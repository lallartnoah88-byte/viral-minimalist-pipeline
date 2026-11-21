// Conclusion : le bon réflexe, éternuer dans le pli du coude (gouttelettes stoppées par la manche).
import React from 'react';
import { Cam, Cyclorama, StudioLights } from '../engine/Stage';
import { Particles } from '../engine/Props';
import { Character, type Pose } from '../engine/Character';
import { mixPose } from './CarScene';
import { clamp01, keysV, lerp, ramp, rand, shake, type V3 } from '../engine/anim';
import type { SceneProps } from '../engine/types';

const ROOT_Y = 0.92;

export const ElbowScene: React.FC<SceneProps> = ({ f, dur, cue }) => {
  const sn = Math.max(8, cue('coude', 14) - 6);
  const raise = ramp(f, 0, sn - 2);
  const burst = ramp(f, sn - 1, sn + 3);
  const after = ramp(f, sn + 14, sn + 24);

  const rest: Pose = { legs: 'stand', head: [0, 0, 0], handL: [0.42, 0.18, 0.12], handR: [-0.42, 0.18, 0.12], eyes: 0.1 };
  const build: Pose = {
    legs: 'stand',
    head: [-0.35, 0.1, 0],
    handR: [0.22, 1.2, 0.22],
    poleR: [0.1, -0.3, 1],
    mouth: 0.6,
    eyes: 0.7,
    brows: 0.9,
    flush: 0.15,
  };
  const sneeze: Pose = { ...build, head: [0.42, 0.12, 0], mouth: 0.75, eyes: 1, brows: -0.6, lean: 0.15 };
  const smile: Pose = { ...rest, head: [0, -0.1, 0.05], mouth: 0.18, brows: 0.5, eyes: 0.05, look: [0, 0] };
  let pose = mixPose(rest, build, raise);
  pose = mixPose(pose, sneeze, burst);
  pose = mixPose(pose, smile, after);

  // Gouttelettes : jaillissent de la bouche et s'arrêtent net sur la manche.
  const drops = (i: number): { p: V3; s: number } | null => {
    const t = f - sn;
    if (t < 0) return null;
    const k = clamp01(t / (3 + rand(i, 1) * 3));
    const mouth: V3 = [0, 1.22, 0.42];
    const sleeve: V3 = [(rand(i, 2) - 0.5) * 0.3, 1.18 + (rand(i, 3) - 0.5) * 0.2, 0.62 + rand(i, 4) * 0.05];
    const fade = 1 - clamp01((t - 10) / 12);
    return { p: [lerp(mouth[0], sleeve[0], k), lerp(mouth[1], sleeve[1], k), lerp(mouth[2], sleeve[2], k)], s: fade };
  };

  const sh = shake(f, sn, 0.09, 16, 4);
  const pos = keysV(f, [[0, [0.6, 2.1, 4.6]], [sn, [0.9, 2.05, 3.3]], [sn + 4, [1.1, 2.0, 2.7]], [dur, [0.4, 2.0, 4.0]]]);
  return (
    <>
      <Cam pos={[pos[0] + sh[0], pos[1] + sh[1], pos[2]]} target={[0, 1.85, 0]} fov={36} />
      <color attach="background" args={['#5db6ef']} />
      <StudioLights key_={[3, 6, 5]} keyIntensity={2.6} target={[0, 1.4, 0]} shadowSize={3} />
      <Cyclorama top="#2f93dd" bottom="#a6dcfa" floor="#9fd3f2" radius={10} />
      <Character pose={pose} position={[0, ROOT_Y, 0]} rotation={[0, -0.35, 0]}>
        <Particles count={60} at={drops} color="#dff4ff" emissive="#9fdcff" emissiveIntensity={0.6} radius={0.018} opacity={0.9} />
      </Character>
    </>
  );
};
