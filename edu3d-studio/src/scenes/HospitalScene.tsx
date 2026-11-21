// Hôpital : passage au scanner, l'écran confirme la déchirure.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Cam, StudioLights } from '../engine/Stage';
import { RBox } from '../engine/Props';
import { Character } from '../engine/Character';
import { keys, keysV, pop, ramp, type V3 } from '../engine/anim';
import type { SceneProps } from '../engine/types';

const MONITOR: V3 = [2.7, 2.0, 0.5];

const scanTexture = (marked: boolean) => {
  const w = 512;
  const h = 640;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const bg = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 420);
  bg.addColorStop(0, '#1c2733'); bg.addColorStop(1, '#05080c');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // Cou en coupe : silhouette grise + trachée noire (air) + anneaux
  g.fillStyle = '#6f7a84';
  g.beginPath(); g.ellipse(w / 2, h / 2 + 20, 190, 250, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c9d1d8';
  g.beginPath(); g.ellipse(w / 2, h / 2 + 150, 60, 55, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0a0c0f';
  g.beginPath(); g.ellipse(w / 2, h / 2 - 20, 70, 58, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#e8eef3'; g.lineWidth = 10;
  g.beginPath(); g.arc(w / 2, h / 2 - 20, 80, Math.PI * 0.9, Math.PI * 2.1); g.stroke();
  // Bulles d'air sombres dans les tissus
  [[150, 260, 16], [360, 250, 12], [330, 360, 14], [170, 380, 10], [395, 330, 9], [120, 330, 8]].forEach(([x, y, r]) => {
    g.fillStyle = '#0d1014'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = '#7fd3ff'; g.font = 'bold 30px "DejaVu Sans", sans-serif'; g.textAlign = 'left';
  g.fillText('CT · COU', 24, 46);
  g.fillStyle = '#7fd3ff'; g.font = '22px "DejaVu Sans Mono", monospace';
  g.fillText('AXIAL  C7', 24, h - 26);
  if (marked) {
    g.strokeStyle = '#ff2b2b'; g.lineWidth = 9;
    g.beginPath(); g.arc(w / 2 + 52, h / 2 - 62, 44, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ff2b2b'; g.font = 'bold 36px "DejaVu Sans", sans-serif'; g.textAlign = 'center';
    g.fillText('DÉCHIRURE', w / 2, 115);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const HospitalScene: React.FC<SceneProps> = ({ f, dur, cue }) => {
  const c0 = cue('confirme', 30);
  const d0 = cue('dechirure', 48);
  const texA = useMemo(() => scanTexture(false), []);
  const texB = useMemo(() => scanTexture(true), []);
  const bedX = keys(f, [[0, 2.3], [c0, 0.6]]);
  const ringGlow = 0.5 + 0.5 * Math.sin(f * 0.6);
  const mark = pop(f, d0 - 2, 30, 200, 12);
  const scanX = Math.sin(f * 0.18) * 0.5;

  const cam = {
    pos: keysV(f, [[0, [3.4, 2.6, 4.8]], [c0 - 4, [2.6, 2.35, 3.9]], [c0 + 8, [4.6, 2.1, 2.05]], [dur, [4.3, 2.05, 1.8]]]),
    target: keysV(f, [[0, [0.6, 1.2, 0]], [c0 - 4, [0.3, 1.3, 0]], [c0 + 8, MONITOR], [dur, MONITOR]]),
    fov: 38,
  };

  return (
    <>
      <Cam pos={cam.pos} target={cam.target} fov={cam.fov} />
      <color attach="background" args={['#cfe3f2']} />
      <StudioLights key_={[2, 6, 4]} keyIntensity={2.2} sky="#eef6ff" ground="#9aa9b8" target={[0, 1, 0]} shadowSize={5} />
      {/* Salle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#d9e1e8" roughness={0.35} />
      </mesh>
      <mesh position={[0, 3, -2.6]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial color="#a9cfe8" roughness={0.9} />
      </mesh>
      <mesh position={[-4, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial color="#bcd9ec" roughness={0.9} />
      </mesh>
      <RBox size={[20, 0.25, 0.08]} color="#2f6fb0" position={[0, 1.0, -2.55]} radius={0.03} />
      {/* Plafonniers */}
      {[-2, 1, 4].map((x) => (
        <mesh key={x} position={[x, 5.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 0.6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Scanner (anneau) */}
      <group position={[0, 1.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[1.08, 0.42, 32, 64]} />
          <meshStandardMaterial color="#f4f6f8" roughness={0.3} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.7, 0.04, 12, 64]} />
          <meshStandardMaterial color="#4ec3ff" emissive="#2aa8ff" emissiveIntensity={1 + ringGlow * 2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <ringGeometry args={[0.66, 0.7, 64]} />
          <meshStandardMaterial color="#2b3540" roughness={0.5} />
        </mesh>
      </group>
      <RBox size={[0.9, 0.7, 2.3]} color="#e9edf0" position={[0, 0.35, 0]} radius={0.12} rough={0.35} />
      {/* Table qui glisse */}
      <group position={[bedX, 0, 0]}>
        <RBox size={[2.6, 0.14, 0.75]} color="#eef1f4" position={[0.6, 1.05, 0]} radius={0.06} rough={0.4} />
        <RBox size={[2.4, 0.06, 0.7]} color="#5aa9d6" position={[0.6, 1.14, 0]} radius={0.03} rough={0.7} />
        <group position={[0.75, 1.36, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Character
            rotation={[0, -Math.PI / 2, 0]}
            pose={{ legs: 'stand', head: [0, 0.15, 0], handL: [0.4, 0.12, 0.05], handR: [-0.4, 0.12, 0.05], eyes: 0.15, brows: -0.2, mouth: 0.1, neckSwell: 0.7, flush: 0.25 }}
            look={{ top: '#a9d4ec' }}
          />
        </group>
        {/* Ligne laser de balayage */}
        <mesh position={[scanX, 1.95, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 0.02]} />
          <meshBasicMaterial color="#ff3030" toneMapped={false} transparent opacity={ramp(f, 4, 12) * (1 - ramp(f, c0, c0 + 6))} />
        </mesh>
      </group>
      <RBox size={[1.2, 0.95, 0.25]} color="#3a4652" position={[-1.6, 0.55, -1.6]} radius={0.08} />
      {/* Écran de diagnostic */}
      <group position={MONITOR} rotation={[0, 0.9, 0]}>
        <RBox size={[1.05, 1.28, 0.08]} color="#20262d" radius={0.05} rough={0.4} />
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.95, 1.18]} />
          <meshBasicMaterial map={mark > 0.5 ? texB : texA} toneMapped={false} />
        </mesh>
        <mesh position={[0, -1.1, -0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 12]} />
          <meshStandardMaterial color="#9aa5b0" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      <pointLight position={[MONITOR[0] + 0.6, MONITOR[1], MONITOR[2] + 0.8]} intensity={2.2} distance={3} color="#7fd3ff" />
    </>
  );
};
