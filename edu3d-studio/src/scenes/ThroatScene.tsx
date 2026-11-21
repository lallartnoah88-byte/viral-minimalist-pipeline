// Le cas de 2018 : un autre homme, la rupture au fond de la gorge (pharynx), vue rayons X partielle.
import React from 'react';
import { Cam, Cyclorama, StudioLights } from '../engine/Stage';
import { Character, type Pose } from '../engine/Character';
import { keysV, noise1, pop, ramp, shake, type V3 } from '../engine/anim';
import type { SceneProps } from '../engine/types';

const ROOT_Y = 0.92;

export const ThroatScene: React.FC<SceneProps> = ({ f, dur, cue }) => {
  const d0 = cue('dechire', 25);
  const g0 = cue('gorge', 45);
  const hit = pop(f, d0, 30, 220, 10);
  const glow = ramp(f, d0 - 2, d0 + 6) * (0.75 + 0.25 * Math.sin(f * 0.5));
  const xray = ramp(f, g0 - 8, g0 + 4) * 0.85;
  const pose: Pose = {
    legs: 'stand',
    lean: 0.12 * hit,
    head: [0.1 * hit + noise1(f * 0.4, 1) * 0.04, -0.25, 0.05],
    handL: [0.2, 0.93, 0.2],
    handR: [-0.2, 0.93, 0.2],
    poleL: [0.8, -0.6, -0.2],
    poleR: [-0.8, -0.6, -0.2],
    mouth: 0.25 + hit * 0.45,
    eyes: 0.2 + hit * 0.6,
    brows: 0.5 - hit * 1.3,
    flush: 0.2 + hit * 0.4,
    xray,
    look: [0.2, 0],
  };
  const sh = shake(f, d0, 0.06, 14, 12);
  const headY = ROOT_Y + 1.04 + 0.3;
  const pos = keysV(f, [[0, [2.4, headY + 0.3, 4.8]], [d0, [1.7, headY + 0.05, 3.8]], [dur, [1.2, headY - 0.1, 3.1]]]);
  const pharynx: V3 = [0, 1.1, -0.06];
  return (
    <>
      <Cam pos={[pos[0] + sh[0], pos[1] + sh[1], pos[2]]} target={[0, headY - 0.3, 0]} fov={34} />
      <color attach="background" args={['#5db6ef']} />
      <StudioLights key_={[2.5, 5, 4]} keyIntensity={2.6} target={[0, 1.6, 0]} shadowSize={2.5} />
      <Cyclorama top="#2f93dd" bottom="#a6dcfa" floor="#9fd3f2" radius={10} />
      <Character pose={pose} position={[0, ROOT_Y, 0]} rotation={[0, 0.35, 0]} look={{ top: '#3f9a6b', hair: '#1c1612', hairStyle: 'curly', beard: true, skin: '#c98e6b', pants: '#2b2f3a' }}>
        <group position={pharynx} scale={glow}>
          <mesh>
            <sphereGeometry args={[0.075, 20, 14]} />
            <meshBasicMaterial color="#ff2b2b" toneMapped={false} transparent opacity={0.85} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2 + 0.3]} position={[0, 0, 0.02]}>
              <boxGeometry args={[0.2, 0.012, 0.012]} />
              <meshBasicMaterial color="#ff6a5a" toneMapped={false} />
            </mesh>
          ))}
        </group>
        <pointLight position={[0, 1.12, 0.25]} intensity={glow * 2.5} distance={1.2} color="#ff3030" />
      </Character>
    </>
  );
};
