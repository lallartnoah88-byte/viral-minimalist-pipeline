// Personnage 3D stylisé (proportions « cartoon semi-réaliste ») entièrement procédural.
// Les bras sont pilotés par cinématique inverse : on donne la position des mains, le coude se place seul.
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { lerp, type V3 } from './anim';

export type Pose = {
  lean?: number; // inclinaison du buste (rad, + = vers l'avant)
  twist?: number; // rotation du buste (rad)
  head?: V3; // tangage, lacet, roulis de la tête
  handL?: V3; // cibles des mains dans le repère du buste (origine = bassin)
  handR?: V3;
  poleL?: V3;
  poleR?: V3;
  legs?: 'sit' | 'stand' | 'none';
  mouth?: number; // 0 fermée → 1 grande ouverte
  mouthPinch?: number; // 1 = lèvres serrées (éternuement retenu)
  eyes?: number; // 0 ouverts → 1 fermés
  brows?: number; // -1 froncés … +1 levés
  cheeks?: number; // joues gonflées 0..1
  flush?: number; // rougeur 0..1
  neckSwell?: number; // gonflement du cou 0..1
  look?: [number, number];
  xray?: number; // 0..1 : cou translucide, trachée visible
};

export type Look = { skin?: string; top?: string; pants?: string; hair?: string; shoes?: string; beard?: boolean; hairStyle?: 'short' | 'curly'; collar?: boolean };

export const SHOULDER_Y = 0.86;
export const NECK_PIVOT: V3 = [0, 1.04, 0];
const UPPER = 0.4;
const FORE = 0.38;

const v = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);

/** Cinématique inverse à deux segments (épaule → coude → main). */
export const solveElbow = (s: V3, t: V3, pole: V3): V3 => {
  const S = v(s);
  const T = v(t);
  const dir = T.clone().sub(S);
  let d = dir.length();
  d = Math.min(Math.max(d, 0.08), UPPER + FORE - 0.001);
  dir.normalize();
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, UPPER * UPPER - a * a));
  const p = v(pole).sub(dir.clone().multiplyScalar(v(pole).dot(dir))).normalize();
  const E = S.clone().add(dir.multiplyScalar(a)).add(p.multiplyScalar(h));
  return [E.x, E.y, E.z];
};

/** Tube arrondi entre deux points (membres). */
export const Limb: React.FC<{ a: V3; b: V3; r: number; r2?: number; color: string; rough?: number }> = ({ a, b, r, r2, color, rough = 0.6 }) => {
  const A = v(a);
  const B = v(b);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const len = Math.max(0.001, A.distanceTo(B));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return (
    <group position={mid} quaternion={q}>
      {r2 === undefined ? (
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[r, len, 6, 16]} />
          <meshStandardMaterial color={color} roughness={rough} />
        </mesh>
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[r2, r, len, 16]} />
            <meshStandardMaterial color={color} roughness={rough} />
          </mesh>
          <mesh position={[0, -len / 2, 0]} castShadow>
            <sphereGeometry args={[r, 16, 12]} />
            <meshStandardMaterial color={color} roughness={rough} />
          </mesh>
          <mesh position={[0, len / 2, 0]} castShadow>
            <sphereGeometry args={[r2, 16, 12]} />
            <meshStandardMaterial color={color} roughness={rough} />
          </mesh>
        </>
      )}
    </group>
  );
};

/** Position (repère du buste) d'un point défini dans le repère de la tête — utile pour viser le nez, le cou… */
export const headPoint = (local: V3, head: V3 = [0, 0, 0]): V3 => {
  const e = new THREE.Euler(head[0], head[1], head[2], 'YXZ');
  const p = v(local).applyEuler(e);
  return [p.x + NECK_PIVOT[0], p.y + NECK_PIVOT[1], p.z + NECK_PIVOT[2]];
};
export const NOSE_TIP: V3 = [0, 0.3, 0.42];

const Hand: React.FC<{ at: V3; from: V3; skin: string; side: 1 | -1 }> = ({ at, from, skin, side }) => {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v(at).sub(v(from)).normalize());
  return (
    <group position={at} quaternion={q}>
      <mesh castShadow scale={[0.8, 1.05, 0.55]} position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.085, 20, 14]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0.055 * side, 0.03, 0.03]} rotation={[0.3, 0, -0.6 * side]}>
        <capsuleGeometry args={[0.026, 0.06, 4, 10]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      {[-0.03, 0, 0.03].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.11, 0.0]}>
          <capsuleGeometry args={[0.021, 0.05, 4, 8]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
};

export const Character: React.FC<{ pose: Pose; look?: Look; children?: React.ReactNode; position?: V3; rotation?: V3; scale?: number }> = ({
  pose,
  look = {},
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) => {
  const skinBase = look.skin ?? '#eab08f';
  const flush = pose.flush ?? 0;
  const skin = useMemo(() => '#' + new THREE.Color(skinBase).lerp(new THREE.Color('#e0544a'), flush * 0.55).getHexString(), [skinBase, flush]);
  const top = look.top ?? '#f0b030';
  const pants = look.pants ?? '#27324a';
  const hair = look.hair ?? '#5a3a22';
  const shoes = look.shoes ?? '#1d1d22';
  const head = pose.head ?? [0, 0, 0];
  const legs = pose.legs ?? 'sit';
  const swell = pose.neckSwell ?? 0;
  const xray = pose.xray ?? 0;
  const eyes = pose.eyes ?? 0;
  const brows = pose.brows ?? 0;
  const mouth = pose.mouth ?? 0;
  const pinch = pose.mouthPinch ?? 0;
  const cheeks = pose.cheeks ?? 0;
  const look2 = pose.look ?? [0, 0];

  const shL: V3 = [0.37, SHOULDER_Y, 0];
  const shR: V3 = [-0.37, SHOULDER_Y, 0];
  const handL = pose.handL ?? [0.42, 0.18, 0.12];
  const handR = pose.handR ?? [-0.42, 0.18, 0.12];
  const elL = solveElbow(shL, handL, pose.poleL ?? [0.6, -0.2, -0.6]);
  const elR = solveElbow(shR, handR, pose.poleR ?? [-0.6, -0.2, -0.6]);

  const sitLegs = (s: 1 | -1) => {
    const hip: V3 = [0.16 * s, 0.02, 0.04];
    const knee: V3 = [0.19 * s, 0.1, 0.56];
    const ankle: V3 = [0.19 * s, -0.36, 0.64];
    return { hip, knee, ankle };
  };
  const standLegs = (s: 1 | -1) => {
    const hip: V3 = [0.15 * s, 0.0, 0.0];
    const knee: V3 = [0.16 * s, -0.44, 0.03];
    const ankle: V3 = [0.16 * s, -0.86, 0];
    return { hip, knee, ankle };
  };

  const lidRot = lerp(-0.45, 1.5, eyes);
  const mouthH = lerp(0.05, 0.2, mouth) * (1 - pinch * 0.75);
  const mouthW = lerp(0.11, 0.09, mouth) * (1 - pinch * 0.35);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Jambes */}
      {legs !== 'none' &&
        ([1, -1] as const).map((s) => {
          const L = legs === 'sit' ? sitLegs(s) : standLegs(s);
          return (
            <group key={s}>
              <Limb a={L.hip} b={L.knee} r={0.12} r2={0.13} color={pants} rough={0.8} />
              <Limb a={L.knee} b={L.ankle} r={0.085} r2={0.11} color={pants} rough={0.8} />
              <mesh castShadow position={[L.ankle[0], L.ankle[1] - 0.05, L.ankle[2] + 0.07]}>
                <boxGeometry args={[0.15, 0.1, 0.3]} />
                <meshStandardMaterial color={shoes} roughness={0.5} />
              </mesh>
            </group>
          );
        })}
      {/* Bassin */}
      <mesh castShadow position={[0, 0.08, 0]} scale={[1, 0.7, 0.8]}>
        <sphereGeometry args={[0.27, 24, 16]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>

      <group rotation={[pose.lean ?? 0, pose.twist ?? 0, 0]}>
        {/* Buste (pull) */}
        <mesh castShadow receiveShadow position={[0, 0.5, 0]} scale={[1, 1, 0.72]}>
          <capsuleGeometry args={[0.3, 0.46, 8, 24]} />
          <meshStandardMaterial color={top} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 0.84, 0]} scale={[1.25, 0.45, 0.8]}>
          <sphereGeometry args={[0.29, 24, 12]} />
          <meshStandardMaterial color={top} roughness={0.85} />
        </mesh>
        {/* Col roulé (désactivable pour montrer le cou) */}
        <mesh castShadow position={[0, look.collar === false ? 0.86 : 0.92, 0]} scale={look.collar === false ? [1.1, 0.6, 1] : 1}>
          <torusGeometry args={[0.13 + swell * 0.04, 0.04, 10, 24]} />
          <meshStandardMaterial color={top} roughness={0.85} />
        </mesh>

        {/* Bras (IK) */}
        <Limb a={shL} b={elL} r={0.085} r2={0.095} color={top} rough={0.85} />
        <Limb a={elL} b={handL} r={0.065} r2={0.08} color={top} rough={0.85} />
        <Hand at={handL} from={elL} skin={skin} side={1} />
        <Limb a={shR} b={elR} r={0.085} r2={0.095} color={top} rough={0.85} />
        <Limb a={elR} b={handR} r={0.065} r2={0.08} color={top} rough={0.85} />
        <Hand at={handR} from={elR} skin={skin} side={-1} />

        {/* Cou (gonflable, mode rayons X) */}
        <group position={[0, 0.96, 0.0]}>
          <mesh castShadow scale={[1 + swell * 0.55, 1, 1 + swell * 0.45]}>
            <cylinderGeometry args={[0.115, 0.13, 0.22, 24]} />
            <meshStandardMaterial color={skin} roughness={0.5} transparent={xray > 0} opacity={1 - xray * 0.8} depthWrite={xray < 0.5} />
          </mesh>
          {swell > 0.01 &&
            ([1, -1] as const).map((s) => (
              <mesh key={s} position={[0.1 * s * (1 + swell * 0.4), 0.02, 0.03]} scale={[swell, swell * 1.2, swell]}>
                <sphereGeometry args={[0.11, 18, 12]} />
                <meshStandardMaterial color={skin} roughness={0.45} transparent={xray > 0} opacity={1 - xray * 0.72} depthWrite={xray < 0.5} />
              </mesh>
            ))}
          {xray > 0.01 && (
            <group scale={xray}>
              {/* Trachée visible au travers de la peau */}
              <mesh position={[0, 0, 0.03]}>
                <cylinderGeometry args={[0.045, 0.045, 0.3, 16, 1, true]} />
                <meshStandardMaterial color="#ff7a86" roughness={0.4} emissive="#ff3046" emissiveIntensity={0.9} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
              {[-0.1, -0.05, 0, 0.05, 0.1].map((y) => (
                <mesh key={y} position={[0, y, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.049, 0.01, 6, 20]} />
                  <meshStandardMaterial color="#f6e0d2" roughness={0.5} />
                </mesh>
              ))}
            </group>
          )}
        </group>

        {/* Tête */}
        <group position={NECK_PIVOT} rotation={[head[0], head[1], head[2], 'YXZ']}>
          <mesh castShadow receiveShadow position={[0, 0.33, 0.0]} scale={[1, 1.08, 1.02]}>
            <sphereGeometry args={[0.34, 40, 32]} />
            <meshStandardMaterial color={skin} roughness={0.52} emissive="#5a1a08" emissiveIntensity={0.08} />
          </mesh>
          {/* Mâchoire */}
          <mesh castShadow position={[0, 0.16, 0.06]} scale={[0.85, 0.6, 0.85]}>
            <sphereGeometry args={[0.3, 32, 20]} />
            <meshStandardMaterial color={skin} roughness={0.52} />
          </mesh>
          {/* Cheveux / barbe */}
          {(look.hairStyle ?? 'short') === 'short' ? (
            <mesh castShadow position={[0, 0.35, -0.025]} rotation={[-0.35, 0, 0]} scale={[1.04, 1.1, 1.06]}>
              <sphereGeometry args={[0.34, 40, 20, 0, Math.PI * 2, 0, 1.25]} />
              <meshStandardMaterial color={hair} roughness={0.9} />
            </mesh>
          ) : (
            <group position={[0, 0.5, -0.04]}>
              {Array.from({ length: 22 }, (_, i) => {
                const a = (i / 22) * Math.PI * 2;
                const rr = i % 2 ? 0.2 : 0.27;
                return (
                  <mesh key={i} castShadow position={[Math.cos(a) * rr, 0.06 + (i % 3) * 0.03, Math.sin(a) * rr * 0.9]}>
                    <sphereGeometry args={[0.12, 14, 10]} />
                    <meshStandardMaterial color={hair} roughness={0.95} />
                  </mesh>
                );
              })}
              <mesh castShadow position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.24, 20, 14]} />
                <meshStandardMaterial color={hair} roughness={0.95} />
              </mesh>
            </group>
          )}
          {look.beard && (
            <mesh castShadow position={[0, 0.14, 0.02]} scale={[0.95, 0.7, 0.95]}>
              <sphereGeometry args={[0.31, 32, 20, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4]} />
              <meshStandardMaterial color={hair} roughness={0.95} />
            </mesh>
          )}
          {/* Oreilles */}
          {([1, -1] as const).map((s) => (
            <mesh key={s} castShadow position={[0.335 * s, 0.32, 0]} scale={[0.4, 1, 0.7]}>
              <sphereGeometry args={[0.085, 16, 12]} />
              <meshStandardMaterial color={skin} roughness={0.55} />
            </mesh>
          ))}
          {/* Yeux */}
          {([1, -1] as const).map((s) => (
            <group key={s} position={[0.125 * s, 0.38, 0.285]}>
              <mesh>
                <sphereGeometry args={[0.072, 24, 18]} />
                <meshStandardMaterial color="#fbfbf8" roughness={0.2} />
              </mesh>
              <group rotation={[-look2[1] * 0.4, look2[0] * 0.4, 0]}>
                <mesh position={[0, 0, 0.052]} scale={[1, 1, 0.5]}>
                  <sphereGeometry args={[0.036, 18, 12]} />
                  <meshStandardMaterial color="#4a3020" roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, 0.068]} scale={[1, 1, 0.4]}>
                  <sphereGeometry args={[0.019, 14, 10]} />
                  <meshStandardMaterial color="#080808" roughness={0.1} />
                </mesh>
                <mesh position={[0.012, 0.014, 0.075]}>
                  <sphereGeometry args={[0.007, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
              {/* Paupière */}
              <mesh rotation={[lidRot, 0, 0]} scale={1.08}>
                <sphereGeometry args={[0.072, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={skin} roughness={0.55} side={THREE.DoubleSide} />
              </mesh>
              {/* Sourcil */}
              <mesh position={[0, 0.1 + brows * 0.025, 0.04]} rotation={[0, 0, Math.PI / 2 + (0.32 * brows) * s]}>
                <capsuleGeometry args={[0.019, 0.085, 4, 8]} />
                <meshStandardMaterial color={hair} roughness={0.9} />
              </mesh>
            </group>
          ))}
          {/* Nez */}
          <mesh castShadow position={[0, 0.29, 0.355]} scale={[0.85, 1.05, 1.15]}>
            <sphereGeometry args={[0.068, 20, 14]} />
            <meshStandardMaterial color={skin} roughness={0.5} />
          </mesh>
          {/* Joues (gonflables) */}
          {([1, -1] as const).map((s) => (
            <mesh key={s} position={[0.16 * s, 0.21, 0.19 + cheeks * 0.05]} scale={[1 + cheeks * 0.5, 0.85 + cheeks * 0.45, 0.8 + cheeks * 0.5]}>
              <sphereGeometry args={[0.095, 20, 14]} />
              <meshStandardMaterial color={'#' + new THREE.Color(skin).lerp(new THREE.Color('#e86a5c'), 0.12 + cheeks * 0.3).getHexString()} roughness={0.5} />
            </mesh>
          ))}
          {/* Bouche */}
          <group position={[0, 0.155, 0.305 + cheeks * 0.02]}>
            <mesh scale={[mouthW / 0.1, mouthH / 0.1, 0.35]}>
              <sphereGeometry args={[0.1, 24, 16]} />
              <meshStandardMaterial color="#5a1d1e" roughness={0.6} />
            </mesh>
            {mouth > 0.25 && (
              <mesh position={[0, mouthH * 0.55, 0.012]} scale={[mouthW / 0.1 * 0.8, 0.22, 0.3]}>
                <sphereGeometry args={[0.1, 18, 8]} />
                <meshStandardMaterial color="#f7f3ea" roughness={0.3} />
              </mesh>
            )}
            {/* Lèvres */}
            <mesh rotation={[0, 0, 0]} scale={[mouthW / 0.1, Math.max(0.35, mouthH / 0.1), 0.5]}>
              <torusGeometry args={[0.1, 0.018, 8, 28]} />
              <meshStandardMaterial color={'#' + new THREE.Color(skin).lerp(new THREE.Color('#b8564e'), 0.5).getHexString()} roughness={0.45} />
            </mesh>
          </group>
        </group>
        {children}
      </group>
    </group>
  );
};
