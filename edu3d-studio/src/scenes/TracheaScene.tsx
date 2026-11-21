// Coupe anatomique de la trachée : l'air bloqué, la pression qui monte, la déchirure, la cicatrisation.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Cam, SkyDome, StudioEnv } from '../engine/Stage';
import { Particles, textTexture } from '../engine/Props';
import { clamp01, keys, keysV, lerp, noise1, pop, ramp, rand, shake, type V3 } from '../engine/anim';
import type { SceneProps } from '../engine/types';

const R = 0.8; // rayon intérieur de la trachée
const TOP = 3.0; // obturation (nez pincé + bouche fermée)
const BOTTOM = -4.5;
const TEAR: V3 = [0.12, 0.55, -R + 0.02]; // point de rupture sur la paroi arrière

const Tube: React.FC<{ redness: number; pulse: number }> = ({ redness, pulse }) => {
  const wall = useMemo(() => new THREE.Color('#e88f8e').lerp(new THREE.Color('#d8323a'), redness), [redness]);
  const ringCol = useMemo(() => new THREE.Color('#f4c7bd').lerp(new THREE.Color('#f08a80'), redness * 0.6), [redness]);
  const rings = Array.from({ length: 18 }, (_, i) => TOP - 0.25 - i * 0.42);
  return (
    <group scale={[1 + pulse * 0.025, 1, 1 + pulse * 0.025]}>
      {/* Paroi (demi-cylindre arrière, vue en coupe) */}
      <mesh position={[0, (TOP + BOTTOM) / 2, 0]} receiveShadow>
        <cylinderGeometry args={[R, R, TOP - BOTTOM, 64, 24, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={wall} roughness={0.38} side={THREE.DoubleSide} emissive="#4a0a0e" emissiveIntensity={0.25 + redness * 0.4} />
      </mesh>
      {/* Anneaux de cartilage en relief */}
      {rings.map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[R - 0.02, 0.075, 12, 48, Math.PI]} />
          <meshStandardMaterial color={ringCol} roughness={0.32} />
        </mesh>
      ))}
      {/* Épaisseur de la coupe (tranches latérales) */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[R * s + 0.07 * s, (TOP + BOTTOM) / 2, 0]}>
          <boxGeometry args={[0.16, TOP - BOTTOM, 0.12]} />
          <meshStandardMaterial color="#f2b6a8" roughness={0.5} />
        </mesh>
      ))}
      {/* Tissus autour */}
      <mesh position={[0, (TOP + BOTTOM) / 2, -0.35]}>
        <cylinderGeometry args={[R + 0.45, R + 0.45, TOP - BOTTOM, 48, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#8a2a2c" roughness={0.6} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

/** Bouchon en haut : le nez pincé et la bouche fermée, vus de l'intérieur (dôme + anneau d'alerte). */
const Cap: React.FC<{ glow: number; squash: number }> = ({ glow, squash }) => (
  <group position={[0, TOP, 0]}>
    <mesh scale={[1, 0.55 - squash * 0.12, 1]}>
      <sphereGeometry args={[R + 0.08, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#d9746f" roughness={0.4} side={THREE.DoubleSide} emissive="#ff2a2a" emissiveIntensity={glow * 0.9} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[R + 0.02, 0.05 + glow * 0.04, 12, 48]} />
      <meshStandardMaterial color="#ff3b30" emissive="#ff1e1e" emissiveIntensity={0.6 + glow * 2} toneMapped={false} />
    </mesh>
  </group>
);

const Tear: React.FC<{ open: number; heat: number; heal: number }> = ({ open, heat, heal }) => {
  const r = 0.26 * open;
  const jag = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return { a, k: 0.85 + rand(i, 4) * 0.5, s: 0.5 + rand(i, 6) * 0.6 };
      }),
    [],
  );
  return (
    <group position={TEAR}>
      {/* Point chaud avant la rupture */}
      <mesh position={[0, 0, 0.03]} scale={0.2 + heat * 0.5}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#ff2020" transparent opacity={heat * 0.55 * (1 - open)} toneMapped={false} depthWrite={false} />
      </mesh>
      {r > 0.002 && (
        <>
          <mesh position={[0, 0, 0.02]} scale={[1, 0.7, 1]}>
            <circleGeometry args={[r, 32]} />
            <meshBasicMaterial color="#1a0204" />
          </mesh>
          {jag.map((j, i) => (
            <mesh
              key={i}
              position={[Math.cos(j.a) * r * j.k, Math.sin(j.a) * r * 0.7 * j.k, 0.05]}
              rotation={[0, 0, j.a]}
              scale={[0.06 * j.s * (0.5 + open), 0.02 + 0.03 * j.s, 0.04]}
            >
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#b0121c" roughness={0.3} emissive="#6a0008" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </>
      )}
      {heal > 0 && (
        <mesh position={[0, 0, 0.06]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.28 * (1 - heal * 0.6), 0.34 * (1 - heal * 0.6), 40]} />
          <meshBasicMaterial color="#7dffb0" transparent opacity={Math.sin(heal * Math.PI) * 0.9} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

const Label: React.FC<{ text: string; position: V3; scale: number }> = ({ text, position, scale }) => {
  const tex = useMemo(() => textTexture([{ text, size: 120, color: '#ffffff', y: 100 }], 512, 200), [text]);
  return (
    <mesh position={position} scale={[scale * 1.28, scale * 0.5, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthTest={false} />
    </mesh>
  );
};

export const TracheaScene: React.FC<SceneProps> = ({ f, dur, mode, cue }) => {
  const N = 150;
  let redness = 0;
  let pulse = 0;
  let open = 0;
  let heat = 0;
  let heal = 0;
  let capGlow = 0;
  let packed = 0; // 0 flux libre → 1 tassé sous le bouchon
  let agitation = 0;
  let escape = 0; // fraction d'air qui fuit par le trou
  let escapeT = 0;
  let sh: V3 = [0, 0, 0];
  let cam: { pos: V3; target: V3; fov: number };
  let label = 0;

  if (mode === 'hookTear') {
    const t0 = cue('trou', 22);
    packed = 1; agitation = 1; redness = 0.6; capGlow = 0.8;
    heat = ramp(f, 0, t0);
    open = pop(f, t0, 30, 220, 12);
    escape = 1; escapeT = Math.max(0, f - t0);
    pulse = Math.sin(f * 1.4) * 0.6;
    sh = shake(f, t0, 0.18, 18, 2);
    cam = {
      pos: keysV(f, [[0, [0, 2.9, 1.6]], [10, [0.2, 1.6, 2.4]], [t0, [0.15, 0.9, 2.3]], [dur, [0.1, 0.75, 1.65]]]),
      target: keysV(f, [[0, [0, 0.4, -0.8]], [t0, [0.1, 0.6, -0.8]], [dur, TEAR]]),
      fov: keys(f, [[0, 70], [10, 52], [dur, 46]]),
    };
  } else if (mode === 'trapped') {
    const t0 = cue('aucune', 25);
    packed = ramp(f, 0, t0 + 6);
    capGlow = ramp(f, t0 - 4, t0 + 4) * 0.6;
    agitation = 0.3 * packed;
    sh = shake(f, t0, 0.05, 10, 4);
    cam = {
      pos: keysV(f, [[0, [0.3, -1.6, 3.6]], [dur, [0.15, 1.2, 3.1]]]),
      target: keysV(f, [[0, [0, -0.6, -0.5]], [dur, [0, 2.1, -0.5]]]),
      fov: 50,
    };
  } else if (mode === 'pressure') {
    packed = 1;
    const t = f / dur;
    agitation = 0.4 + t * 0.9;
    redness = t * 0.65;
    heat = ramp(f, dur * 0.35, dur);
    capGlow = 0.6 + 0.4 * Math.abs(Math.sin(f * 0.35));
    pulse = Math.sin(f * (0.6 + t * 1.2)) * t;
    sh = [noise1(f * 0.8, 1) * 0.03 * t, noise1(f * 0.8, 5) * 0.03 * t, 0];
    cam = {
      pos: keysV(f, [[0, [-0.9, 2.2, 2.9]], [dur, [0.25, 1.2, 2.3]]]),
      target: keysV(f, [[0, [0, 2.0, -0.5]], [dur, [0.1, 0.8, -0.7]]]),
      fov: 48,
    };
  } else if (mode === 'tear') {
    const t0 = cue('dechire', 5);
    const mm = cue('millimetres', 30);
    packed = 1;
    agitation = 1.2;
    redness = 0.65;
    capGlow = 0.9;
    heat = 1;
    open = pop(f, t0 + 2, 30, 240, 12);
    escape = 1; escapeT = Math.max(0, f - t0 - 2);
    pulse = Math.sin(f * 1.5) * 0.5 * (1 - ramp(f, t0, t0 + 20));
    sh = shake(f, t0 + 2, 0.22, 20, 7);
    label = pop(f, mm - 2, 30, 200, 12);
    cam = {
      pos: keysV(f, [[0, [0.2, 0.9, 2.4]], [t0 + 2, [0.15, 0.75, 1.95]], [mm, [0.35, 0.7, 1.6]], [dur, [0.3, 0.65, 1.35]]]),
      target: [TEAR[0], TEAR[1], TEAR[2]],
      fov: 46,
    };
  } else {
    // heal : le trou se referme, l'air circule de nouveau librement.
    const c0 = cue('cicatrise', 18);
    const o0 = cue('operation', 60);
    open = 1 - ramp(f, c0, o0 + 6);
    heal = ramp(f, c0 - 4, o0 + 10);
    redness = 0.45 * (1 - heal);
    capGlow = 0;
    packed = 0;
    agitation = 0;
    cam = {
      pos: keysV(f, [[0, [0.25, 0.7, 1.5]], [dur, [-0.2, 0.9, 2.7]]]),
      target: keysV(f, [[0, TEAR], [dur, [0, 0.8, -0.6]]]),
      fov: 46,
    };
  }

  const escN = Math.floor(N * 0.35);
  const air = (i: number): { p: V3; s: number } => {
    const sp = 0.03 + rand(i, 1) * 0.03;
    const a = rand(i, 2) * Math.PI * 2;
    const rr = Math.sqrt(rand(i, 3)) * (R - 0.15);
    const free = BOTTOM + ((rand(i, 4) * (TOP - BOTTOM) + f * sp * 3) % (TOP - BOTTOM));
    // Position tassée sous le bouchon (empilement en couches)
    const layer = Math.floor(i / 22);
    const stack = TOP - 0.25 - layer * 0.17 - rand(i, 5) * 0.1;
    const jit = agitation * 0.07;
    let p: V3 = [
      Math.cos(a) * rr + noise1(f * 0.6 + i, 1) * jit,
      lerp(free, stack, packed) + noise1(f * 0.7 + i, 2) * jit,
      Math.sin(a) * rr * 0.6 + noise1(f * 0.6 + i, 3) * jit,
    ];
    if (escape > 0 && i < escN) {
      // Fuite par le trou : aspiration vers la brèche puis traversée de la paroi
      const delay = rand(i, 7) * 18;
      const k = clamp01((escapeT - delay) / 14);
      const out = clamp01((escapeT - delay - 14) / 16);
      const via: V3 = [TEAR[0] + (rand(i, 8) - 0.5) * 0.1, TEAR[1] + (rand(i, 9) - 0.5) * 0.08, TEAR[2]];
      const beyond: V3 = [via[0] + (rand(i, 10) - 0.5) * 1.2, via[1] + (rand(i, 11) - 0.5) * 1.0, via[2] - 1.4];
      const q = k * k * (3 - 2 * k);
      p = [lerp(p[0], via[0], q) + (beyond[0] - via[0]) * out, lerp(p[1], via[1], q) + (beyond[1] - via[1]) * out, lerp(p[2], via[2], q) + (beyond[2] - via[2]) * out];
      return { p, s: 1 - out * 0.7 };
    }
    return { p, s: 1 };
  };

  return (
    <>
      <Cam pos={[cam.pos[0] + sh[0], cam.pos[1] + sh[1], cam.pos[2] + sh[2]]} target={cam.target} fov={cam.fov} />
      <StudioEnv intensity={0.35} />
      <SkyDome top="#3a0a0d" bottom="#12030a" />
      <fog attach="fog" args={['#2a070b', 4, 11]} />
      <ambientLight intensity={0.5} color="#ffd0c8" />
      <pointLight position={[0, 2.2, 2.4]} intensity={18} distance={9} color="#fff0e6" castShadow shadow-mapSize={[512, 512]} />
      <pointLight position={[0, -2.5, 2.0]} intensity={10} distance={8} color="#ffc4b4" />
      <pointLight position={[TEAR[0], TEAR[1], TEAR[2] + 0.5]} intensity={heat * 6 * (1 - heal)} distance={3} color="#ff2020" />
      {heal > 0 && <pointLight position={[TEAR[0], TEAR[1], TEAR[2] + 0.6]} intensity={Math.sin(heal * Math.PI) * 6} distance={3} color="#6dffb0" />}
      <Tube redness={redness} pulse={pulse} />
      <Cap glow={capGlow} squash={packed * agitation * 0.5} />
      <Tear open={open} heat={heat} heal={heal} />
      <Particles count={N} at={air} color="#bfe9ff" emissive="#6ec8ff" emissiveIntensity={0.55 + agitation * 0.3} radius={0.065} />
      {heal > 0 && (
        <Particles
          count={30}
          color="#c8ffd9"
          emissive="#55ff99"
          emissiveIntensity={1.4}
          radius={0.025}
          at={(i) => {
            const a = rand(i, 1) * Math.PI * 2 + f * 0.05;
            const r = 0.5 - heal * 0.35 + rand(i, 2) * 0.1;
            return { p: [TEAR[0] + Math.cos(a) * r, TEAR[1] + Math.sin(a) * r * 0.8, TEAR[2] + 0.12], s: Math.sin(heal * Math.PI) };
          }}
        />
      )}
      {label > 0.01 && <Label text="2 mm" position={[TEAR[0] - 0.05, TEAR[1] + 0.42, TEAR[2] + 0.3]} scale={0.3 * label} />}
    </>
  );
};
