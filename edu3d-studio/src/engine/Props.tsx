// Accessoires 3D procéduraux réutilisables : voiture, route, collines, particules, écran texte.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { rand, type V3 } from './anim';

export const RBox: React.FC<{
  size: V3;
  radius?: number;
  color: string;
  position?: V3;
  rotation?: V3;
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
}> = ({ size, radius = 0.08, color, position, rotation, rough = 0.4, metal = 0, emissive, emissiveIntensity = 1, opacity }) => {
  const geo = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 4, radius), [size[0], size[1], size[2], radius]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={rough}
        metalness={metal}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
};

/** Cabriolet stylisé orienté vers +X, conduite à droite (Royaume-Uni). Le conducteur est en (0, 0.72, 0.38). */
export const Car: React.FC<{ wheelSpin?: number; color?: string; position?: V3; rotation?: V3; children?: React.ReactNode }> = ({
  wheelSpin = 0,
  color = '#d93a2f',
  position,
  rotation,
  children,
}) => (
  <group position={position} rotation={rotation}>
    <RBox size={[3.4, 0.62, 1.78]} radius={0.24} color={color} position={[0, 0.62, 0]} rough={0.28} metal={0.15} />
    <RBox size={[1.15, 0.3, 1.7]} radius={0.14} color={color} position={[1.1, 0.98, 0]} rough={0.28} metal={0.15} />
    <RBox size={[0.9, 0.28, 1.7]} radius={0.14} color={color} position={[-1.25, 0.96, 0]} rough={0.28} metal={0.15} />
    {/* Portières (flancs) */}
    {([1, -1] as const).map((s) => (
      <RBox key={s} size={[1.4, 0.32, 0.12]} radius={0.05} color={color} position={[-0.1, 1.04, 0.83 * s]} rough={0.28} metal={0.15} />
    ))}
    {/* Pare-brise */}
    <group position={[0.55, 1.12, 0]} rotation={[0, 0, 0.55]}>
      <mesh>
        <boxGeometry args={[0.03, 0.55, 1.55]} />
        <meshPhysicalMaterial color="#cfefff" roughness={0.05} transmission={0} transparent opacity={0.28} />
      </mesh>
      <RBox size={[0.06, 0.6, 0.06]} radius={0.02} color="#222" position={[0, 0, 0.78]} />
      <RBox size={[0.06, 0.6, 0.06]} radius={0.02} color="#222" position={[0, 0, -0.78]} />
      <RBox size={[0.06, 0.06, 1.6]} radius={0.02} color="#222" position={[0, 0.3, 0]} />
    </group>
    {/* Sièges */}
    {([1, -1] as const).map((s) => (
      <group key={s} position={[-0.35, 0, 0.38 * s]}>
        <RBox size={[0.6, 0.16, 0.56]} radius={0.07} color="#3a2a24" position={[0.25, 0.7, 0]} rough={0.7} />
        <RBox size={[0.16, 0.85, 0.56]} radius={0.07} color="#3a2a24" position={[-0.1, 1.08, 0]} rotation={[0, 0, 0.12]} rough={0.7} />
      </group>
    ))}
    {/* Volant (à droite) */}
    <group position={[0.4, 1.28, 0.38]} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[0.45, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.2, 0.025, 10, 32]} />
          <meshStandardMaterial color="#1b1b1f" roughness={0.5} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
          <meshStandardMaterial color="#1b1b1f" roughness={0.5} />
        </mesh>
      </group>
    </group>
    <RBox size={[0.35, 0.18, 1.6]} radius={0.06} color="#2a2a30" position={[0.55, 1.08, 0]} rough={0.6} />
    {/* Roues */}
    {[
      [1.1, 0.85],
      [1.1, -0.85],
      [-1.1, 0.85],
      [-1.1, -0.85],
    ].map(([x, z], i) => (
      <group key={i} position={[x, 0.38, z]} rotation={[Math.PI / 2, wheelSpin, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.28, 28]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.145 * Math.sign(z), 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 20]} />
          <meshStandardMaterial color="#c9ccd2" roughness={0.25} metalness={0.7} />
        </mesh>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[Math.cos((k / 5) * Math.PI * 2) * 0.12, 0.15 * Math.sign(z), Math.sin((k / 5) * Math.PI * 2) * 0.12]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        ))}
      </group>
    ))}
    {/* Phares */}
    {([1, -1] as const).map((s) => (
      <mesh key={s} position={[1.7, 0.75, 0.55 * s]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#fffbe0" emissive="#fff3b0" emissiveIntensity={0.8} />
      </mesh>
    ))}
    {children}
  </group>
);

/** Route qui défile (le décor bouge, la voiture reste centrée). */
export const Road: React.FC<{ offset: number; length?: number }> = ({ offset, length = 60 }) => {
  const dashes = Array.from({ length: 24 }, (_, i) => i);
  const sp = 3;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[length, 4.2]} />
        <meshStandardMaterial color="#3d4048" roughness={0.9} />
      </mesh>
      {dashes.map((i) => {
        const x = (((i * sp - offset) % (24 * sp)) + 24 * sp) % (24 * sp) - 12 * sp;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, -1.0]}>
            <planeGeometry args={[1.4, 0.12]} />
            <meshStandardMaterial color="#f4f1e6" roughness={0.6} />
          </mesh>
        );
      })}
      {([1, -1] as const).map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 2.0 * s]}>
          <planeGeometry args={[length, 0.08]} />
          <meshStandardMaterial color="#f4f1e6" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

/** Collines vertes arrondies (Écosse) qui défilent en parallaxe. */
export const Hills: React.FC<{ offset: number }> = ({ offset }) => (
  <group>
    {Array.from({ length: 14 }, (_, i) => {
      const span = 70;
      const x = (((i * 5.3 - offset * 0.35) % span) + span) % span - span / 2;
      const r = 2.2 + rand(i, 3) * 3;
      const z = -7 - rand(i, 5) * 9;
      return (
        <mesh key={i} position={[x, -r * 0.45, z]} scale={[1.6, 1, 1]} receiveShadow>
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#5fa35a' : i % 3 === 1 ? '#78b866' : '#4f9150'} roughness={0.95} />
        </mesh>
      );
    })}
    {Array.from({ length: 10 }, (_, i) => {
      const span = 50;
      const x = (((i * 5.1 + 2 - offset) % span) + span) % span - span / 2;
      const z = -3.6 - rand(i, 9) * 2;
      return (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 1, 8]} />
            <meshStandardMaterial color="#6b4a30" />
          </mesh>
          <mesh castShadow position={[0, 1.3, 0]}>
            <icosahedronGeometry args={[0.6, 1]} />
            <meshStandardMaterial color="#3f8a46" roughness={0.9} flatShading />
          </mesh>
        </group>
      );
    })}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[120, 60]} />
      <meshStandardMaterial color="#86c06c" roughness={1} />
    </mesh>
  </group>
);

/** Nuage de particules instanciées : positions calculées par une fonction pure de l'index. */
export const Particles: React.FC<{
  count: number;
  at: (i: number) => { p: V3; s: number } | null;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  radius?: number;
  opacity?: number;
}> = ({ count, at, color, emissive = '#000000', emissiveIntensity = 1, radius = 0.03, opacity = 1 }) => {
  const geo = useMemo(() => new THREE.SphereGeometry(radius, 10, 8), [radius]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.3, transparent: opacity < 1, opacity }),
    [color, emissive, emissiveIntensity, opacity],
  );
  const mesh = useMemo(() => new THREE.InstancedMesh(geo, mat, count), [geo, mat, count]);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const r = at(i);
    if (!r || r.s <= 0) {
      m.makeScale(0, 0, 0);
    } else {
      m.makeScale(r.s, r.s, r.s).setPosition(r.p[0], r.p[1], r.p[2]);
    }
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/** Texte peint sur canvas (étiquettes 3D, écrans, calendrier). */
export const textTexture = (lines: Array<{ text: string; size: number; color: string; y: number; weight?: string }>, w: number, h: number, bg?: string) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  if (bg) {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l) => {
    g.fillStyle = l.color;
    g.font = `${l.weight ?? 'bold'} ${l.size}px "DejaVu Sans", Verdana, sans-serif`;
    g.fillText(l.text, w / 2, l.y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
