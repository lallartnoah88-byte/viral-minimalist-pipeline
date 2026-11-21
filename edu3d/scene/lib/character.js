// Personnage articulé générique (style piloté par une fabrique de matériaux M(couleur)).
import * as THREE from 'three';
import { lerp } from './core.js';

function capsule(r, len, m, seg = 14) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, seg), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
function sphere(r, m, seg = 28) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/**
 * Personnage ~1,7 m, pieds à y=0, regarde vers +z.
 * colors : { skin, shirt, pants, hair, shoes, eye }
 * Méthodes : pose({...}), walk(phase, amount), face({ eyes, mouth, cheeks })
 */
export function makeCharacter(M, colors = {}, opts = {}) {
  const C = { skin: '#F2C29B', shirt: '#3CC4A0', pants: '#2F4A8A', hair: '#3A2A22', shoes: '#22242A', ...colors };
  const g = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.92; g.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  const body = capsule(0.24, 0.42, M(C.shirt)); body.position.y = 0.33; body.scale.set(1, 1, 0.8); torso.add(body);
  const neck = new THREE.Group(); neck.position.y = 0.66; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.24; neck.add(head);
  const skull = sphere(0.25, M(C.skin)); head.add(skull);
  const hair = sphere(0.262, M(C.hair)); hair.scale.set(1, 0.62, 1); hair.position.set(0, 0.09, -0.03); head.add(hair);
  const nose = sphere(0.045, M(C.skin), 16); nose.position.set(0, -0.01, 0.25); nose.scale.set(1, 1, 1.2); head.add(nose);
  // yeux
  const eyeW = M('#FFFFFF'), eyeP = M('#1A1A20');
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.09, 0.05, 0.215); head.add(e);
    const white = sphere(0.05, eyeW, 18); white.scale.z = 0.6; e.add(white);
    const pupil = sphere(0.026, eyeP, 14); pupil.position.z = 0.03; e.add(pupil);
    const lid = sphere(0.053, M(C.skin), 18); lid.scale.set(1, 1, 0.62); lid.position.z = 0.002; e.add(lid);
    eyes.push({ e, lid, pupil });
  }
  // bouche (ellipse sombre déformable)
  const mouth = sphere(0.05, M('#5A1F22'), 18); mouth.position.set(0, -0.11, 0.22); mouth.scale.set(1, 0.25, 0.4); head.add(mouth);
  const cheeks = [-1, 1].map((s) => { const c = sphere(0.07, M(C.skin), 18); c.position.set(s * 0.15, -0.07, 0.15); c.scale.setScalar(0.001); head.add(c); return c; });

  // bras (épaule → coude → main)
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.29, 0.6, 0); torso.add(sh);
    const up = capsule(0.07, 0.24, M(C.shirt)); up.position.y = -0.16; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.33; sh.add(el);
    const fo = capsule(0.062, 0.22, M(C.skin)); fo.position.y = -0.14; el.add(fo);
    const hand = sphere(0.08, M(C.skin), 18); hand.position.y = -0.3; el.add(hand);
    return { sh, el, hand, s };
  });
  // jambes
  const legs = [-1, 1].map((s) => {
    const hp = new THREE.Group(); hp.position.set(s * 0.12, 0, 0); hips.add(hp);
    const leg = capsule(0.09, 0.62, M(C.pants)); leg.position.y = -0.4; hp.add(leg);
    const foot = capsule(0.075, 0.12, M(C.shoes)); foot.rotation.x = Math.PI / 2; foot.position.set(0, -0.84, 0.06); hp.add(foot);
    return { hp, s };
  });

  const P = { torso, neck, head, hips, arms, legs, eyes, mouth, cheeks, nose };
  g.userData.parts = P;

  /** pose : angles en radians. arms: [{x, z, el}] (gauche, droite) ; legs: [x, x] ; head: {x, y, z} ; lean */
  g.pose = (p = {}) => {
    const a = p.arms || [{}, {}];
    arms.forEach((A, i) => {
      const q = a[i] || {};
      A.sh.rotation.set(q.x ?? 0, q.y ?? 0, (q.z ?? 0.12) * A.s);
      A.el.rotation.set(q.el ?? -0.15, 0, 0);
    });
    const l = p.legs || [0, 0];
    legs.forEach((L, i) => { L.hp.rotation.x = l[i]; });
    const h = p.head || {};
    neck.rotation.set(h.x ?? 0, h.y ?? 0, h.z ?? 0);
    torso.rotation.set(p.lean ?? 0, p.twist ?? 0, p.tilt ?? 0);
    hips.position.y = 0.92 + (p.bob ?? 0);
  };
  /** expression : eyes 0 fermés … 1 ouverts ; mouth 0 fermée … 1 grande ouverte ; cheeks 0..1 (joues gonflées) */
  g.face = ({ eyes: eo = 1, mouth: mo = 0.2, cheeks: ck = 0, smile = 0 } = {}) => {
    eyes.forEach(({ lid }) => { lid.scale.y = lerp(1, 0.05, eo); lid.position.y = lerp(0, 0.05, eo); lid.visible = eo < 0.98; });
    mouth.scale.set(lerp(0.8, 1.2, mo) + smile * 0.5, lerp(0.15, 1.0, mo), 0.4);
    mouth.position.y = -0.11 + smile * 0.01;
    cheeks.forEach((c) => c.scale.setScalar(Math.max(0.001, ck)));
  };
  /**
   * Cinématique inverse à deux segments : amène la main du bras i (0 gauche, 1 droit) sur une cible monde.
   * hint : direction (repère du torse) vers laquelle pointe le coude ; blend 0..1 mélange avec la pose courante.
   */
  const L1 = 0.33, L2 = 0.3, DOWN = new THREE.Vector3(0, -1, 0);
  g.reach = (i, target, hint = new THREE.Vector3(0, -1, 0.3), blend = 1) => {
    if (blend <= 0.001) return;
    g.updateMatrixWorld(true);
    const A = arms[i];
    const T = torso.worldToLocal(target.clone());
    const S = A.sh.position.clone();
    let d = T.clone().sub(S); const dist = Math.min(d.length(), L1 + L2 - 0.001); d.normalize();
    const a1 = Math.acos(THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
    const h = hint.clone().normalize(); const perp = h.sub(d.clone().multiplyScalar(h.dot(d))).normalize();
    const u = d.clone().multiplyScalar(Math.cos(a1)).add(perp.multiplyScalar(Math.sin(a1)));
    const E = S.clone().add(u.clone().multiplyScalar(L1));
    const f = S.clone().add(d.clone().multiplyScalar(dist)).sub(E).normalize();
    const qS = new THREE.Quaternion().setFromUnitVectors(DOWN, u);
    const fLocal = f.clone().applyQuaternion(qS.clone().invert());
    const qE = new THREE.Quaternion().setFromUnitVectors(DOWN, fLocal);
    A.sh.quaternion.slerp(qS, blend);
    A.el.quaternion.slerp(qE, blend);
  };
  /** position monde d'une partie (nose, mouth, main i) */
  g.worldOf = (part) => { g.updateMatrixWorld(true); const o = part === 'hand0' ? arms[0].hand : part === 'hand1' ? arms[1].hand : part === 'elbow1' ? arms[1].el : part === 'elbow0' ? arms[0].el : P[part]; return o.getWorldPosition(new THREE.Vector3()); };
  /** cycle de marche ; amount 0..1 */
  g.walkPose = (ph, amount = 1, extra = {}) => {
    const s = Math.sin(ph) * 0.5 * amount;
    g.pose({
      legs: [s, -s],
      arms: extra.arms || [{ x: -s * 0.8 }, { x: s * 0.8 }],
      bob: Math.abs(Math.cos(ph)) * 0.03 * amount,
      head: extra.head, lean: extra.lean ?? 0.04 * amount,
    });
  };
  g.pose();
  g.face();
  return g;
}
