// Le cou qui gonfle et « crépite » (emphysème sous-cutané), puis vue rayons X : l'air sous la peau.
import React from 'react';
import { Cam, Cyclorama, StudioLights } from '../engine/Stage';
import { Particles } from '../engine/Props';
import { Character, type Pose } from '../engine/Character';
import { clamp01, keys, keysV, lerp, noise1, ramp, rand, shake, type V3 } from '../engine/anim';
import type { SceneProps } from '../engine/types';

const ROOT_Y = 0.92;
const NECK: V3 = [0, ROOT_Y + 0.96, 0];

export const NeckScene: React.FC<SceneProps> = ({ f, dur, mode, cue }) => {
  const xrayMode = mode === 'xray';
  const g0 = cue('gonfler', 12);
  const c0 = cue('crepiter', 35);
  const swell = xrayMode ? 1 : ramp(f, g0 - 4, g0 + 22);
  const press = xrayMode ? 0 : ramp(f, c0 - 10, c0);
  const xray = xrayMode ? ramp(f, 0, 10) : 0;
  const tap = press * (0.5 + 0.5 * Math.sin(f * 0.9));

  const pose: Pose = {
    legs: 'stand',
    head: [(xrayMode ? -0.12 : -0.38) + noise1(f * 0.3, 2) * 0.03, xrayMode ? -0.2 : 0.3, -0.05],
    handL: xrayMode ? [0.4, 0.15, 0.15] : [lerp(0.6, 0.27 + tap * 0.03, ramp(f, 0, 10)), lerp(0.25, 0.9, ramp(f, 0, 10)), lerp(0.15, 0.12, ramp(f, 0, 10))],
    poleL: [0.8, -0.6, -0.3],
    handR: [-0.4, 0.15, 0.15],
    mouth: xrayMode ? 0.05 : 0.15 + swell * 0.1,
    eyes: 0.35 + press * 0.2,
    brows: -0.4 - swell * 0.3,
    flush: 0.3 + swell * 0.25,
    neckSwell: swell,
    look: [-0.4, -0.2],
    xray,
  };

  // Petites bulles qui éclatent sous les doigts (crépitation)
  const crackle = (i: number): { p: V3; s: number } | null => {
    const birth = c0 - 4 + rand(i, 1) * (dur - c0);
    const life = f - birth;
    if (life < 0 || life > 7) return null;
    const a = rand(i, 2) * Math.PI * 1.6 - 0.2;
    return { p: [Math.cos(a) * 0.2 * (1 + swell * 0.4), 0.92 + rand(i, 3) * 0.12, Math.sin(a) * 0.17 + 0.03], s: Math.sin((life / 7) * Math.PI) };
  };
  // Air qui migre depuis la trachée vers les tissus du cou (vue rayons X)
  const leak = (i: number): { p: V3; s: number } => {
    const t = clamp01(((f + rand(i, 1) * 60) % 60) / 60);
    const a = rand(i, 2) * Math.PI * 2;
    const r = lerp(0.05, 0.22, t);
    return { p: [Math.cos(a) * r, 0.9 + rand(i, 3) * 0.16 + t * 0.03, Math.sin(a) * r * 0.85 + 0.03], s: Math.sin(t * Math.PI) * xray };
  };

  const sh = shake(f, c0, 0.025, 12, 6);
  const cam = xrayMode
    ? {
        pos: keysV(f, [[0, [1.6, NECK[1] + 0.2, 3.4]], [dur, [1.1, NECK[1] + 0.1, 2.7]]]),
        target: [NECK[0], NECK[1] + 0.12, NECK[2]] as V3,
        fov: 34,
      }
    : {
        pos: keysV(f, [[0, [1.7, NECK[1] + 0.1, 3.6]], [g0 + 10, [1.3, NECK[1], 2.9]], [dur, [1.0, NECK[1] - 0.1, 2.4]]]),
        target: keysV(f, [[0, [0, NECK[1] + 0.3, 0]], [dur, [0, NECK[1] + 0.12, 0]]]),
        fov: 34,
      };

  return (
    <>
      <Cam pos={[cam.pos[0] + sh[0], cam.pos[1] + sh[1], cam.pos[2]]} target={cam.target} fov={cam.fov} />
      <color attach="background" args={[xrayMode ? '#0b2a4a' : '#5db6ef']} />
      <StudioLights key_={[2.5, 4, 4]} keyIntensity={xrayMode ? 1.6 : 2.6} target={[0, 1.6, 0]} shadowSize={2.5} />
      {xrayMode ? (
        <Cyclorama top="#06152a" bottom="#103a66" floor="#0d2d50" radius={10} />
      ) : (
        <Cyclorama top="#2f93dd" bottom="#a6dcfa" floor="#9fd3f2" radius={10} />
      )}
      <Character pose={pose} position={[0, ROOT_Y, 0]} rotation={[0, 0.25, 0]} look={{ top: '#f0b030', collar: false }}>
        <Particles count={40} at={crackle} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} radius={0.018} opacity={0.85} />
        {xray > 0 && <Particles count={70} at={leak} color="#bfe9ff" emissive="#6ec8ff" emissiveIntensity={1.2} radius={0.014} />}
      </Character>
      {xrayMode && <pointLight position={[0.4, NECK[1] + 0.2, 0.8]} intensity={keys(f, [[0, 0], [10, 3]])} distance={3} color="#7cc8ff" />}
    </>
  );
};
