// Vidéo 03 — « Retenir un éternuement, c'est dangereux ? » — style PÂTE À MODELER (stop-motion 12 i/s).
import * as THREE from 'three';
import { CameraRig, life, prog, smooth, easeOut, drop, lerp, clamp, rng } from '../lib/core.js';
import { clayMat, claySetStep } from '../lib/styles.js';
import { makeCharacter } from '../lib/character.js';
import { makeLabel } from '../lib/props2.js';

const STEP = 12; // images par seconde de l'animation « stop-motion »

class ClayBeads {
  constructor(scene, points, color, n = 14, r = 0.055) {
    this.curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 16, 12), clayMat(color), n);
    this.mesh.castShadow = true; this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.n = n; this.d = new THREE.Object3D();
  }
  update({ fill = 1, offset = 0, on = true, squash = 0 } = {}) {
    for (let i = 0; i < this.n; i++) {
      let u = (i / this.n + offset) % 1; if (u < 0) u += 1;
      const vis = on && u <= fill;
      // « squash » : les billes s'accumulent en haut quand la sortie est bouchée
      const uu = squash > 0 ? lerp(u, 0.82 + u * 0.18, squash) : u;
      this.d.position.copy(this.curve.getPointAt(Math.min(0.999, uu)));
      this.d.scale.setScalar(vis ? 1 : 0.0001); this.d.updateMatrix();
      this.mesh.setMatrixAt(i, this.d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export function build(scene, camera, C) {
  const w = C.w;
  scene.environment = null;
  scene.background = new THREE.Color('#F6CFAE');
  const M = (c) => clayMat(c);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- Plateau : cyclorama courbe ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), clayMat('#F2B48A'));
  floor.rotation.x = -Math.PI / 2; floor.position.z = 1; floor.receiveShadow = true; scene.add(floor);
  const cove = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 30, 32, 1, true, Math.PI, Math.PI / 2), clayMat('#F6C49C', { side: THREE.BackSide }));
  cove.rotation.z = Math.PI / 2; cove.position.set(0, 3, -3); cove.receiveShadow = true; scene.add(cove);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), clayMat('#F7CDA6'));
  wall.position.set(0, 9.9, -6); wall.receiveShadow = true; scene.add(wall);
  // galets décoratifs
  const R = rng(9);
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.12 + R() * 0.18, 18, 14), M(['#7FC8A9', '#F28C8C', '#8FB8F2', '#F7D57A'][i % 4]));
    s.scale.y = 0.55; s.position.set(-4 + R() * 8, 0.05, -2.2 + R() * 1.4); s.castShadow = true; scene.add(s);
  }

  // ---------- Lumières studio douces ----------
  scene.add(new THREE.HemisphereLight('#FFF3E6', '#C98A6A', 1.4));
  const key = new THREE.DirectionalLight('#FFF1DE', 2.6);
  key.position.set(-4, 7, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  key.shadow.radius = 6; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#FFD2E0', 1.0); rim.position.set(5, 4, -4); scene.add(rim);

  // ---------- Personnage ----------
  const hero = makeCharacter(M, { skin: '#F4C7A1', shirt: '#F25C54', pants: '#3D5A98', hair: '#4A2F25' });
  hero.userData.parts.head.scale.setScalar(1.35);
  hero.position.set(-1.1, 0, 0); hero.rotation.y = 0.35; scene.add(hero);

  // ---------- Schéma des voies respiratoires (en pâte) ----------
  const D = new THREE.Group(); D.position.set(1.25, 0, -0.2); scene.add(D);
  const pink = '#F59BA8', pinkD = '#E07A8C';
  const lungs = [-1, 1].map((s) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 22), M(pink)); l.scale.set(0.8, 1.15, 0.6); l.position.set(s * 0.42, 0.75, 0); l.castShadow = true; D.add(l); return l; });
  const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.0, 24), M('#F7B9C2')); trachea.position.set(0, 1.55, 0); trachea.castShadow = true; D.add(trachea);
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 10, 24), M('#FBD3D9')); r.rotation.x = Math.PI / 2; r.position.set(0, 1.15 + i * 0.16, 0); D.add(r); }
  // gorge (cavité) puis deux sorties : nez et bouche
  const throat = new THREE.Mesh(new THREE.SphereGeometry(0.26, 26, 20), M(pinkD)); throat.position.set(0, 2.2, 0); throat.castShadow = true; D.add(throat);
  const outN = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 18), M('#F7B9C2')); outN.position.set(-0.3, 2.55, 0); outN.rotation.z = 0.7; D.add(outN);
  const outM = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 18), M('#F7B9C2')); outM.position.set(0.3, 2.55, 0); outM.rotation.z = -0.7; D.add(outM);
  const lblN = makeLabel(0.6, 0.2, { color: '#7A3B2E', px: 120 }); lblN.setText('NEZ'); lblN.position.set(-0.68, 2.95, 0.05); D.add(lblN);
  const lblM = makeLabel(0.7, 0.2, { color: '#7A3B2E', px: 120 }); lblM.setText('BOUCHE'); lblM.position.set(0.7, 2.95, 0.05); D.add(lblM);
  // bouchons
  const corkN = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.16, 18), M('#C98A4B')); D.add(corkN);
  const corkM = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.16, 18), M('#C98A4B')); D.add(corkM);
  // ballon de pression dans la gorge
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 26, 20), M('#F04A4A')); balloon.position.set(0, 2.2, 0.05); D.add(balloon);
  // fissures (pâte sombre en zigzag)
  const crack = (pts, z = 0.27) => {
    const g = new THREE.Group();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(pts[i][0], pts[i][1], z), b = new THREE.Vector3(pts[i + 1][0], pts[i + 1][1], z);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, a.distanceTo(b), 8), M('#5A1E22'));
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.add(m);
    }
    D.add(g); return g;
  };
  const crackThroat = crack([[-0.1, 2.32], [0.0, 2.24], [-0.05, 2.16], [0.07, 2.08]], 0.26);
  const crackTrach = crack([[-0.05, 1.75], [0.04, 1.66], [-0.03, 1.58], [0.05, 1.5]], 0.12);
  // manomètre en pâte
  const gauge = new THREE.Group(); gauge.position.set(-0.72, 1.95, 0.1); D.add(gauge);
  const gFace = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 32), M('#FFF6EA')); gFace.rotation.x = Math.PI / 2; gauge.add(gFace);
  const gRim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 12, 32), M('#3D5A98')); gauge.add(gRim);
  const gRed = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 24, Math.PI * 0.5), M('#F04A4A')); gRed.position.z = 0.045; gRed.rotation.z = -0.3; gauge.add(gRed);
  const needle = new THREE.Group(); needle.position.z = 0.06; gauge.add(needle);
  const nd = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.03), M('#2B2B33')); nd.position.y = 0.11; needle.add(nd);
  // « ×20 »
  const x20 = makeLabel(0.9, 0.45, { bg: '#FFF6EA', color: '#F04A4A', px: 230 }); x20.setText('×20'); x20.position.set(0.55, 1.6, 0.45); D.add(x20);
  const cross = new THREE.Group(); cross.position.set(-0.72, 1.3, 0.1); D.add(cross);
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 28), M('#FFFFFF')); cb.rotation.x = Math.PI / 2; cross.add(cb);
  for (const r of [0, Math.PI / 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.06), M('#F04A4A')); b.position.z = 0.05; b.rotation.z = r; cross.add(b); }
  // oreille + tympan
  const ear = new THREE.Group(); ear.position.set(-1.0, 2.9, 0.2); D.add(ear);
  const pinna = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 14, 28, Math.PI * 1.6), M('#F4C7A1')); pinna.rotation.z = -0.5; ear.add(pinna);
  const canal = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 18), M('#E8A98A')); canal.rotation.x = Math.PI / 2; canal.position.z = -0.1; ear.add(canal);
  const drum = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), M('#F59BA8')); drum.scale.z = 0.3; drum.position.z = 0.04; ear.add(drum);

  // air
  const air = new ClayBeads(scene, [[1.25, 0.8, 0.1], [1.25, 1.2, 0.12], [1.25, 1.7, 0.14], [1.25, 2.15, 0.15], [0.85, 2.75, 0.1], [0.45, 3.3, 0.05]], '#BFE3FF', 16, 0.05);
  const air2 = new ClayBeads(scene, [[1.25, 0.8, 0.1], [1.25, 1.2, 0.12], [1.25, 1.7, 0.14], [1.25, 2.15, 0.15], [1.65, 2.75, 0.1], [2.05, 3.3, 0.05]], '#BFE3FF', 16, 0.05);
  // gouttelettes de l'éternuement dans le coude
  const drops = new ClayBeads(scene, [[-1.05, 1.9, 0.45], [-1.0, 1.92, 0.7], [-0.92, 1.95, 0.85]], '#9AD8F5', 10, 0.04);
  // confettis en pâte
  const confM = ['#F25C54', '#7FC8A9', '#8FB8F2', '#F7D57A', '#C58FF2'].map((c) => M(c));
  const conf = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), confM[i % 5]); m.scale.set(1.4, 0.5, 1); m.visible = false; scene.add(m); return m; });
  const cR = rng(5); const cS = conf.map(() => [cR() * 2 - 1, cR(), cR() * 2 - 1]);

  // ---------- Caméra (bouge aussi par pas de 1/12 s) ----------
  const camK = [
    { t: 0, pos: [-0.35, 2.0, 4.6], look: [-1.1, 1.55, 0], fov: 30 },
    { t: w('hook1', 8), pos: [-0.6, 2.0, 3.9], look: [-1.1, 1.7, 0], fov: 30 },
    { t: w('hook2', 0) + 0.1, pos: [-0.7, 2.0, 4.0], look: [-1.0, 1.7, 0], fov: 30 },
    { t: w('hook2', 3), pos: [1.3, 2.1, 7.6], look: [1.25, 1.9, -0.2], fov: 30 },
    { t: w('s2', 6), pos: [1.15, 2.3, 7.2], look: [1.25, 2.05, -0.2], fov: 30 },
    { t: w('s3', 6), pos: [1.4, 2.2, 6.8], look: [1.3, 2.0, -0.2], fov: 30 },
    { t: w('s4', 8), pos: [1.3, 2.3, 4.6], look: [1.25, 2.15, -0.2], fov: 30 },
    { t: w('s4', 16), pos: [1.3, 1.85, 4.5], look: [1.25, 1.75, -0.2], fov: 30 },
    { t: w('s5', 6), pos: [0.45, 2.85, 4.2], look: [0.3, 2.8, 0], fov: 30 },
    { t: w('s5', -1) + 0.3, pos: [0.35, 2.9, 3.9], look: [0.25, 2.85, 0], fov: 30 },
    { t: w('s6', 2), pos: [-0.4, 1.95, 4.4], look: [-1.0, 1.65, 0], fov: 30 },
    { t: w('s6', -1), pos: [-0.55, 2.0, 4.0], look: [-1.05, 1.7, 0], fov: 30 },
    { t: w('end1', 1), pos: [-0.75, 2.2, 6.0], look: [-0.8, 1.55, -0.2], fov: 30 },
    { t: C.duration, pos: [-0.7, 2.25, 6.4], look: [-0.8, 1.55, -0.2], fov: 30 },
  ];
  const rig = new CameraRig(camera, camK);
  rig.addShake(w('hook1', 8) + 0.1, 0.03, 0.4);
  rig.addShake(w('hook2', 8), 0.06, 0.45);
  rig.addShake(w('s4', 8), 0.05, 0.4);
  rig.addShake(w('s4', 17), 0.05, 0.4);
  rig.addShake(w('s6', 3) + 0.45, 0.04, 0.35);

  // ---------- Bruitages ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  S(w('hook1', 1), 'squish', 0.9); S(w('hook1', 4), 'squish', 0.9); S(w('hook1', 8), 'muffle', 1); S(w('hook1', 12), 'sparkle', 0.6);
  S(w('hook2', 0), 'scratch', 0.9); S(w('hook2', 2), 'whoosh', 0.8); S(w('hook2', 8), 'thud', 1);
  S(w('s1', 2), 'whoosh_long', 0.9); S(w('s1', 6), 'squish', 0.7);
  S(w('s2', 2), 'pop', 1); S(w('s2', 4), 'pop', 1); S(w('s2', 7), 'inflate', 0.9);
  S(w('s3', 1), 'pop'); S(w('s3', 6), 'inflate', 1); S(w('s3', 10), 'pop', 1); S(w('s3', 10), 'tick', 0.8);
  S(w('s4', 8), 'rip', 1); S(w('s4', 17), 'rip', 1);
  S(w('s5', 0) + 0.2, 'whoosh', 0.7); S(w('s5', 7), 'pop'); S(w('s5', 9), 'boing', 0.9);
  S(w('s6', 0), 'whoosh', 0.7); S(w('s6', 3) + 0.45, 'achoo', 1); S(w('s6', -1), 'squish', 0.6);
  S(w('end1', 0), 'confetti', 1); S(w('end1', -1), 'ding', 0.9);

  const faceCam = (o) => o.quaternion.copy(camera.quaternion);
  const tA = w('hook1', 8), tSneezeEnd = w('hook1', 10);

  function update(tReal) {
    const t = Math.floor(tReal * STEP) / STEP; // pas de stop-motion
    claySetStep(Math.floor(tReal * 6));

    // ----- personnage -----
    const pinch = smooth(prog(t, w('hook1', 0) + 0.1, 0.35)) * (1 - smooth(prog(t, w('hook2', 2), 0.4)));
    const cover = smooth(prog(t, w('hook1', 3) + 0.1, 0.35)) * (1 - smooth(prog(t, w('hook2', 2), 0.4)));
    const blocked = t > tA && t < tA + 0.6 ? Math.sin(prog(t, tA, 0.6) * Math.PI) : 0;
    const elbow = smooth(prog(t, w('s6', 3) - 0.1, 0.35)) * (1 - smooth(prog(t, w('end1', 0), 0.4)));
    const achoo = t > w('s6', 3) + 0.4 && t < w('s6', 3) + 0.9 ? Math.sin(prog(t, w('s6', 3) + 0.4, 0.5) * Math.PI) : 0;
    const cheer = smooth(prog(t, w('end1', 0), 0.4));
    hero.pose({
      arms: [{ x: -2.6 * cheer, z: lerp(0.12, 0.5, cheer), el: -0.15 + cheer * 1.3 }, { x: -2.6 * cheer, z: lerp(0.12, 0.5, cheer), el: -0.15 + cheer * 1.6 }],
      head: { x: blocked * 0.25 + achoo * 0.4 - cheer * 0.1, y: 0, z: 0 },
      lean: blocked * 0.12 + achoo * 0.15,
      bob: cheer * Math.abs(Math.sin(t * 9)) * 0.06,
    });
    // mains guidées par cinématique inverse : pince le nez (droite), couvre la bouche (gauche), coude devant le visage
    hero.reach(1, hero.worldOf('nose').add(V(0, 0, 0.07)), V(-0.4, -1, 0.4), pinch);
    hero.reach(0, hero.worldOf('mouth').add(V(0, -0.02, 0.1)), V(0.6, -1, 0.3), cover);
    const face = hero.worldOf('mouth');
    hero.reach(0, face.clone().add(new THREE.Vector3(0.16, 0.12, 0.2).applyAxisAngle(V(0, 1, 0), hero.rotation.y)), V(-0.1, 0.1, 1), elbow);
    hero.face({
      eyes: t > tA - 0.2 && t < tSneezeEnd ? 0.05 : achoo > 0.2 ? 0.05 : 1,
      mouth: cover > 0.5 ? 0 : cheer > 0.5 ? 0.55 : 0.2,
      cheeks: blocked > 0 ? 1.0 + blocked * 0.2 : cover > 0.5 ? 0.85 : 0,
      smile: t > w('hook1', 11) && t < w('hook2', 1) ? 0.6 : cheer,
    });
    // la tête gonfle un peu sous la pression (effet cartoon)
    hero.userData.parts.head.scale.setScalar(1.35 * (1 + blocked * 0.12));

    // ----- schéma -----
    const sq = smooth(prog(t, w('s1', 2), 0.5)) * (1 - smooth(prog(t, w('s2', 0), 0.6)));
    lungs.forEach((l) => l.scale.set(0.8 * (1 - sq * 0.15), 1.15 * (1 - sq * 0.12), 0.6));
    const tPlugN = w('s2', 2), tPlugM = w('s2', 4);
    const yN = drop(t, tPlugN, 0.35), yM = drop(t, tPlugM, 0.35);
    corkN.visible = t > tPlugN - 0.05; corkN.position.set(-0.47 - yN * 0.3, 2.75 + yN * 0.9, 0); corkN.rotation.z = 0.7;
    corkM.visible = t > tPlugM - 0.05; corkM.position.set(0.47 + yM * 0.3, 2.75 + yM * 0.9, 0); corkM.rotation.z = -0.7;
    const plugged = t > tPlugM + 0.2 && t < w('end1', 0);
    const pres = plugged ? smooth(prog(t, w('s2', 7), 1.2)) * 0.5 + smooth(prog(t, w('s3', 6), 1.0)) * 0.5 : 0;
    balloon.scale.setScalar(Math.max(0.001, pres * 1.25 + (t > w('hook2', 6) && t < w('s1', 0) ? 0.6 : 0)));
    needle.rotation.z = lerp(1.9, -1.4, pres) + Math.sin(t * 40) * 0.05 * pres;
    const flowOn = t > w('s1', 2) - 0.1 && t < C.seg('s3');
    air.update({ fill: smooth(prog(t, w('s1', 2), 0.7)), offset: t * (plugged ? 0.25 : 1.1), on: flowOn, squash: plugged ? smooth(prog(t, tPlugM, 0.8)) : 0 });
    air2.update({ fill: smooth(prog(t, w('s1', 2), 0.7)), offset: t * (plugged ? 0.25 : 1.1) + 0.5, on: flowOn, squash: plugged ? smooth(prog(t, tPlugM, 0.8)) : 0 });
    // choc sur la gorge (« a pris le choc »)
    const hit = t > w('hook2', 8) && t < w('hook2', 8) + 0.5 ? 1 : 0;
    throat.material.color.set(hit ? '#F04A4A' : pinkD);
    const sx = life(t, w('s3', 10) - 0.05, C.segEnd('s3') + 0.4);
    x20.visible = sx > 0.001; x20.scale.setScalar(Math.max(0.001, sx));
    const sc = life(t, w('s3', 1), w('s3', 6));
    cross.visible = sc > 0.001; cross.scale.setScalar(Math.max(0.001, sc));
    crackThroat.visible = t > w('s4', 8) && t < w('end1', 0);
    crackThroat.scale.setScalar(Math.max(0.001, easeOut(prog(t, w('s4', 8), 0.25))));
    crackTrach.visible = t > w('s4', 17) && t < w('end1', 0);
    crackTrach.scale.setScalar(Math.max(0.001, easeOut(prog(t, w('s4', 17), 0.25))));
    const se = life(t, w('s5', 6), w('s6', 2));
    ear.visible = se > 0.001; ear.scale.setScalar(Math.max(0.001, se * 0.9));
    const bulge = t > w('s5', 9) ? 1 + Math.sin(prog(t, w('s5', 9), 0.6) * Math.PI) * 1.2 : 1;
    drum.scale.set(1, 1, 0.3 * bulge);
    [lblN, lblM, x20].forEach(faceCam);

    // éternuement dans le coude
    const tAch = w('s6', 3) + 0.45;
    // gouttelettes projetées dans la manche
    const m0 = hero.worldOf('mouth'), e0 = hero.worldOf('elbow0');
    drops.curve.points[0].copy(m0); drops.curve.points[1].copy(m0.clone().lerp(e0, 0.5).add(V(0, 0.03, 0.05))); drops.curve.points[2].copy(e0.add(V(0, 0, 0.05)));
    drops.curve.updateArcLengths();
    drops.update({ fill: 1, offset: prog(t, tAch, 0.5), on: t > tAch && t < tAch + 0.5 });

    // confettis
    conf.forEach((m, i) => {
      const x = t - w('end1', 0);
      m.visible = x > 0 && x < 3.5;
      if (!m.visible) return;
      const [a, b, c] = cS[i];
      m.position.set(a * 2.4 * (1 - Math.exp(-x * 2)), 0.5 + (4 + b * 2) * (1 - Math.exp(-x * 2)) / 2 - 1.2 * x * x / (1 + x), 0.6 + c * 1.2 * (1 - Math.exp(-x * 2)));
      m.rotation.set(x * 5 + i, x * 3, i);
    });

    rig.update(t);
  }
  return { update, sfx };
}
