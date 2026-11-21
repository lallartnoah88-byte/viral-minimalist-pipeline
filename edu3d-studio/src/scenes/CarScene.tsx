// Plans « voiture » : le conducteur écossais, l'éternuement qui monte, le nez pincé.
import React from 'react';
import { Cam, Cyclorama, StudioLights } from '../engine/Stage';
import { Car, Hills, Road } from '../engine/Props';
import { Character, headPoint, NOSE_TIP, type Pose } from '../engine/Character';
import { keys, keysV, lerp, lerpV, noise1, ramp, shake, type V3 } from '../engine/anim';
import type { SceneProps } from '../engine/types';

// Conducteur : bassin posé sur le siège droit, regard vers +X.
const DRIVER: V3 = [-0.14, 0.8, 0.38];
const HEAD_C: V3 = [DRIVER[0], DRIVER[1] + 1.37, DRIVER[2]];
const NECK_C: V3 = [DRIVER[0] + 0.02, DRIVER[1] + 0.98, DRIVER[2]];

const WHEEL_L: V3 = [0.17, 0.5, 0.45];
const WHEEL_R: V3 = [-0.17, 0.5, 0.45];

const drive: Pose = { head: [0, 0, 0], handL: WHEEL_L, handR: WHEEL_R, mouth: 0, eyes: 0.08, brows: 0 };

/** Mélange deux poses (toutes les valeurs numériques et vecteurs). */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const out: Pose = { ...a };
  (Object.keys(b) as Array<keyof Pose>).forEach((k) => {
    const va = a[k] as unknown;
    const vb = b[k] as unknown;
    if (typeof vb === 'number') {
      (out as Record<string, unknown>)[k] = lerp(typeof va === 'number' ? va : 0, vb, t);
    } else if (Array.isArray(vb) && vb.length === 3) {
      (out as Record<string, unknown>)[k] = lerpV((Array.isArray(va) ? va : vb) as V3, vb as V3, t);
    } else if (Array.isArray(vb) && vb.length === 2) {
      const aa = (Array.isArray(va) ? va : [0, 0]) as number[];
      (out as Record<string, unknown>)[k] = [lerp(aa[0], vb[0], t), lerp(aa[1], vb[1], t)];
    } else if (t > 0.5) {
      (out as Record<string, unknown>)[k] = vb;
    }
  });
  return out;
};

const tickle = (f: number): Pose => ({
  head: [-0.38 + noise1(f * 0.25, 2) * 0.03, 0.05, 0.06],
  handL: WHEEL_L,
  handR: WHEEL_R,
  mouth: 0.6 + Math.sin(f * 0.5) * 0.08,
  eyes: 0.62,
  brows: 0.9,
  look: [0, 0.6],
  flush: 0.15,
});

const pinch = (f: number, intensity = 1): Pose => {
  const head: V3 = [0.12 + noise1(f * 0.7, 4) * 0.06 * intensity, noise1(f * 0.6, 8) * 0.08 * intensity, noise1(f * 0.8, 1) * 0.07 * intensity];
  const nose = headPoint(NOSE_TIP, head);
  return {
    head,
    handL: WHEEL_L,
    handR: [nose[0] - 0.03, nose[1] - 0.07, nose[2] + 0.1],
    poleR: [-0.8, -0.6, 0.2],
    mouth: 0,
    mouthPinch: 1,
    cheeks: 0.9 + noise1(f * 0.9, 3) * 0.1 * intensity,
    eyes: 0.92,
    brows: -0.8,
    flush: 0.75 * intensity,
  };
};

export const CarScene: React.FC<SceneProps> = ({ f, dur, mode, cue }) => {
  const speed = 0.16; // unités par image
  const road = f * speed + (mode === 'driveWide' ? 30 : mode === 'advice' ? 90 : 0);
  const bob = Math.sin(f * 0.55) * 0.012;

  let pose: Pose = drive;
  let cam: { pos: V3; target: V3; fov: number; roll?: number };
  let sh: V3 = [0, 0, 0];

  if (mode === 'hookPinch') {
    pose = pinch(f, 1.2);
    const tz = cue('tellement', 30);
    sh = shake(f, tz, 0.07, 16, 3);
    const push = keys(f, [[0, 0], [8, 1]]);
    const end = keys(f, [[dur - 9, 0], [dur, 1]]);
    cam = {
      pos: lerpV(lerpV([4.6, 3.0, 4.2], [2.55, 2.35, 1.95], push), [1.15, 2.0, 0.95], end),
      target: lerpV([HEAD_C[0], HEAD_C[1] - 0.1, HEAD_C[2]], NECK_C, end),
      fov: lerp(lerp(36, 30, push), 18, end),
    };
  } else if (mode === 'driveWide') {
    pose = mixPose(drive, { head: [0.02, Math.sin(f * 0.04) * 0.15, 0], look: [Math.sin(f * 0.04) * 0.5, 0] }, 1);
    const t = f / dur;
    cam = { pos: [lerp(4.4, 3.2, t), 2.7, lerp(7.2, 6.4, t)], target: [0.1, 1.35, 0], fov: 40 };
  } else if (mode === 'sneezeComing') {
    const a = cue('eternuement', 18);
    const t = ramp(f, a - 6, dur - 4);
    pose = mixPose(drive, tickle(f), t);
    cam = {
      pos: keysV(f, [[0, [3.4, 2.5, 3.1]], [dur, [2.5, 2.35, 2.05]]]),
      target: [HEAD_C[0], HEAD_C[1] - 0.05, HEAD_C[2]],
      fov: keys(f, [[0, 34], [dur, 30]]),
    };
  } else if (mode === 'pinch') {
    const p0 = cue('pince', 20);
    const b0 = cue('bouche', 55);
    const reach = ramp(f, p0 - 8, p0 + 4);
    const close = ramp(f, b0 - 6, b0 + 6);
    const start = tickle(f);
    const mid = mixPose(start, { ...pinch(f, 0.4), mouth: 0.55, mouthPinch: 0, cheeks: 0 }, reach);
    pose = mixPose(mid, pinch(f, 0.4 + 0.6 * close), close);
    sh = shake(f, p0 + 2, 0.03, 10, 5);
    const orbit = keys(f, [[0, -0.25], [dur, 0.35]]);
    const r = keys(f, [[0, 3.0], [b0, 2.55], [dur, 2.25]]);
    cam = {
      pos: [HEAD_C[0] + Math.cos(orbit) * r, HEAD_C[1] + 0.12, HEAD_C[2] + Math.sin(orbit) * r + 0.4],
      target: [HEAD_C[0], HEAD_C[1] - 0.1, HEAD_C[2]],
      fov: 30,
    };
  } else {
    // advice : ça recommence… il hésite à se pincer le nez.
    const t = ramp(f, 4, dur * 0.7);
    pose = mixPose(drive, { ...tickle(f), handR: lerpV(WHEEL_R, [-0.05, 0.95, 0.42], ramp(f, dur * 0.45, dur)) }, t);
    cam = {
      pos: keysV(f, [[0, [3.2, 2.55, 3.4]], [dur, [2.1, 2.35, 2.0]]]),
      target: [HEAD_C[0] + 0.1, HEAD_C[1] - 0.25, HEAD_C[2]],
      fov: 34,
    };
  }

  return (
    <>
      <Cam pos={[cam.pos[0] + sh[0], cam.pos[1] + sh[1] + bob * 0.5, cam.pos[2] + sh[2]]} target={cam.target} fov={cam.fov} roll={cam.roll ?? 0} />
      <color attach="background" args={['#7cc4f2']} />
      <fog attach="fog" args={['#a9dcf7', 14, 46]} />
      <StudioLights key_={[3.5, 7, 4.5]} keyIntensity={2.7} sky="#d8efff" ground="#7a9a6a" target={[0, 1, 0]} shadowSize={4} />
      <Cyclorama top="#3a9ee6" bottom="#bfe6fb" floor="#86c06c" radius={40} y={-0.02} />
      <Hills offset={road} />
      <Road offset={road} />
      <Car wheelSpin={-road / 0.38} position={[0, bob, 0]}>
        <Character pose={pose} position={DRIVER} rotation={[0, Math.PI / 2, 0]} />
      </Car>
    </>
  );
};
