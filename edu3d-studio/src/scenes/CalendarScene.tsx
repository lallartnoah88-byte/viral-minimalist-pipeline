// Retour en arrière : le calendrier rembobine les années jusqu'au premier cas connu (2018).
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Cam, Cyclorama, StudioLights } from '../engine/Stage';
import { RBox, textTexture } from '../engine/Props';
import { keys, keysV, pop, ramp, shake } from '../engine/anim';
import type { SceneProps } from '../engine/types';

const YEARS = ['2023', '2022', '2021', '2020', '2019', '2018'];

const pageTex = (year: string) =>
  textTexture(
    [
      { text: 'ANNÉE', size: 64, color: '#ffffff', y: 70 },
      { text: year, size: 230, color: '#1d2430', y: 330 },
    ],
    600,
    480,
    '#fbfaf6',
  );

const Page: React.FC<{ tex: THREE.Texture; flip: number; z: number }> = ({ tex, flip, z }) => (
  <group position={[0, 0.8, z]} rotation={[-flip * Math.PI * 0.95, 0, 0]}>
    <mesh position={[0, -0.8, 0]} castShadow>
      <boxGeometry args={[2.0, 1.6, 0.012]} />
      <meshStandardMaterial attach="material-0" color="#eeeae0" />
      <meshStandardMaterial attach="material-1" color="#eeeae0" />
      <meshStandardMaterial attach="material-2" color="#eeeae0" />
      <meshStandardMaterial attach="material-3" color="#eeeae0" />
      <meshStandardMaterial attach="material-4" map={tex} roughness={0.7} />
      <meshStandardMaterial attach="material-5" color="#eeeae0" />
    </mesh>
  </group>
);

export const CalendarScene: React.FC<SceneProps> = ({ f, dur, params, cue }) => {
  const target = String(params.year ?? '2018');
  const years = YEARS.includes(target) ? YEARS.slice(0, YEARS.indexOf(target) + 1) : [...YEARS.slice(0, 5), target];
  const texes = useMemo(() => years.map(pageTex), [years.join(',')]);
  const land = cue(target, 50);
  const startFlip = 10;
  const per = Math.max(3, (land - startFlip) / (years.length - 1));
  const appear = pop(f, 0, 30, 170, 11);
  const sh = shake(f, land, 0.06, 14, 9);

  return (
    <>
      <Cam
        pos={keysV(f, [[0, [1.8, 1.8, 7.4]], [land, [0.8, 1.5, 6.0]], [dur, [0.5, 1.45, 5.5]]]).map((v, i) => v + sh[i]) as [number, number, number]}
        target={[0, 1.15, 0]}
        fov={36}
      />
      <color attach="background" args={['#5db6ef']} />
      <StudioLights key_={[3, 6, 5]} keyIntensity={2.6} target={[0, 1, 0]} shadowSize={3} />
      <Cyclorama top="#2f93dd" bottom="#a6dcfa" floor="#9fd3f2" radius={10} />
      <group position={[0, 0.02, 0]} scale={appear} rotation={[0, keys(f, [[0, -0.5], [land, 0.15], [dur, 0.05]]), 0]}>
        {/* Socle chevalet */}
        <group rotation={[-0.18, 0, 0]}>
          <RBox size={[2.3, 2.05, 0.18]} color="#2f3f57" position={[0, 1.02, -0.12]} radius={0.06} rough={0.5} />
          {/* Bandeau rouge + anneaux */}
          <RBox size={[2.15, 0.32, 0.12]} color="#e2342c" position={[0, 1.93, 0.02]} radius={0.05} rough={0.5} />
          {[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((x) => (
            <mesh key={x} position={[x, 1.92, 0.1]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.07, 0.018, 8, 20]} />
              <meshStandardMaterial color="#cfd5dc" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
          <group position={[0, 0.98, 0.05]}>
            {texes.map((t, i) => {
              const fl = i === texes.length - 1 ? 0 : ramp(f, startFlip + i * per, startFlip + (i + 1) * per);
              return <Page key={i} tex={t} flip={fl} z={0.03 - i * 0.004} />;
            })}
          </group>
        </group>
      </group>
      <pointLight position={[0, 2, 2.5]} intensity={ramp(f, land - 2, land + 2) * 4 * (1 - ramp(f, land + 4, land + 18))} distance={5} color="#fff2c0" />
    </>
  );
};
