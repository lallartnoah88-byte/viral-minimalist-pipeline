// Plateau 3D commun : caméra pilotée par image, éclairage studio « softbox », cyclorama dégradé.
import React, { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { V3 } from './anim';

export const Cam: React.FC<{ pos: V3; target: V3; fov?: number; roll?: number }> = ({ pos, target, fov = 35, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(target[0], target[1], target[2]);
    if (camera.fov !== fov) {
      camera.fov = fov;
    }
    camera.near = 0.02;
    camera.far = 200;
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Éclairage studio : grande clé douce, contre-jour (liseré), ambiance hémisphérique colorée. */
export const StudioLights: React.FC<{
  key_?: V3;
  keyIntensity?: number;
  sky?: string;
  ground?: string;
  rim?: string;
  shadowSize?: number;
  target?: V3;
}> = ({ key_ = [3, 6, 5], keyIntensity = 2.6, sky = '#cfe8ff', ground = '#6d7f99', rim = '#ffffff', shadowSize = 4, target = [0, 0, 0] }) => {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight('#fff4e8', keyIntensity);
    l.castShadow = true;
    l.shadow.mapSize.set(1024, 1024);
    l.shadow.radius = 6;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -shadowSize; c.right = shadowSize; c.top = shadowSize; c.bottom = -shadowSize; c.near = 0.5; c.far = 40;
    return l;
  }, [keyIntensity, shadowSize]);
  light.position.set(key_[0] + target[0], key_[1] + target[1], key_[2] + target[2]);
  light.target.position.set(target[0], target[1], target[2]);
  light.target.updateMatrixWorld();
  return (
    <>
      <StudioEnv />
      <hemisphereLight args={[sky, ground, 1.0]} />
      <primitive object={light} />
      <primitive object={light.target} />
      <directionalLight position={[-4 + target[0], 3 + target[1], -5 + target[2]]} intensity={1.6} color={rim} />
      <directionalLight position={[-5 + target[0], 1.5 + target[1], 3 + target[2]]} intensity={0.55} color="#dfe9ff" />
    </>
  );
};

/** Texture dégradé vertical (fond de cyclorama, ciel, écrans). */
export const gradientTexture = (stops: Array<[number, string]>, w = 4, h = 256) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Cyclorama : mur courbe infini qui se fond dans le sol (fond studio des vidéos de référence). */
export const Cyclorama: React.FC<{ top?: string; bottom?: string; floor?: string; radius?: number; y?: number }> = ({
  top = '#2f9be0',
  bottom = '#a8dcfa',
  floor = '#9fd3f2',
  radius = 14,
  y = 0,
}) => {
  const tex = useMemo(() => gradientTexture([[0, top], [0.75, bottom], [1, floor]]), [top, bottom, floor]);
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius * 1.6, 64]} />
        <meshStandardMaterial color={floor} roughness={0.85} />
      </mesh>
      <mesh position={[0, radius * 0.7 - 0.01, 0]}>
        <cylinderGeometry args={[radius, radius, radius * 1.4, 64, 1, true]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Sphère d'ambiance (intérieur du corps, salle) — fond uni dégradé vu de l'intérieur. */
export const SkyDome: React.FC<{ top: string; bottom: string; radius?: number }> = ({ top, bottom, radius = 60 }) => {
  const tex = useMemo(() => gradientTexture([[0, top], [1, bottom]]), [top, bottom]);
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};

/** Reflets « studio photo » (carte d'environnement préfiltrée) : donne du volume aux matières mates. */
export const StudioEnv: React.FC<{ intensity?: number }> = ({ intensity = 0.45 }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const tex = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return t;
  }, [gl]);
  useLayoutEffect(() => {
    scene.environment = tex;
    (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = intensity;
  });
  return null;
};
