// Vidéo 07 — « Est-ce dangereux de réveiller un somnambule ? » — style CARTOON CEL-SHADING (aplats + contours BD).
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { CameraRig, life, prog, smooth, easeOut, easeInOut, drop, lerp, clamp, rng } from '../lib/core.js';
import { toonMat, addOutlines } from '../lib/styles.js';
import { makeCharacter } from '../lib/character.js';
import { makeLabel } from '../lib/props2.js';

export async function build(scene, camera, C) {
  const w = C.w;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.environment = null;
  scene.background = new THREE.Color('#2B2350');
  const T = (c, o) => toonMat(c, o);
  const box = (ww, hh, dd, c, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, dd), T(c)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m; };
  const font = await new Promise((res) => new FontLoader().load('/node_modules/three/examples/fonts/helvetiker_bold.typeface.json', res));
  const text3d = (txt, size, color) => { const g = new TextGeometry(txt, { font, size, depth: size * 0.25, curveSegments: 6, bevelEnabled: false }); g.center(); const m = new THREE.Mesh(g, T(color)); addOutlines(m, 0.02); return m; };
  const extr = (shape, depth, color) => { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 }), T(color)); m.geometry.center(); addOutlines(m, 0.02); return m; };

  // ---------- Décor : couloir de nuit, chambre à gauche, escalier à droite ----------
  const set = new THREE.Group(); scene.add(set);
  box(16, 0.2, 5, '#B9824F', 0, -0.1, 0, set);
  for (let i = 0; i < 12; i++) box(0.03, 0.21, 5, '#9C6A3E', -7.5 + i * 1.3, -0.09, 0, set);
  box(16, 4.2, 0.2, '#8C7FD6', 0, 2.1, -2.5, set);
  box(16, 0.25, 0.25, '#6A5DB8', 0, 0.12, -2.37, set);
  box(0.2, 4.2, 5, '#7A6DC6', -7.9, 2.1, 0, set);
  // fenêtre + lune
  box(1.6, 1.5, 0.05, '#1C1640', 1.5, 2.3, -2.38, set);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), new THREE.MeshBasicMaterial({ color: '#FFF0B8' })); moon.position.set(1.9, 2.65, -2.34); set.add(moon);
  for (const [x, y, ww, hh] of [[1.5, 3.08, 1.75, 0.12], [1.5, 1.52, 1.75, 0.12], [0.68, 2.3, 0.12, 1.6], [2.32, 2.3, 0.12, 1.6], [1.5, 2.3, 0.08, 1.5]]) box(ww, hh, 0.12, '#F3E9DC', x, y, -2.33, set);
  // cadres au mur
  box(0.9, 0.7, 0.06, '#F7D57A', -1.3, 2.6, -2.36, set); box(0.7, 0.5, 0.07, '#7FC8A9', -1.3, 2.6, -2.33, set);
  // chambre (gauche) : lit + veilleuse
  const bed = new THREE.Group(); bed.position.set(-5.6, 0, -0.8); scene.add(bed);
  box(2.0, 0.45, 3.0, '#E9C79B', 0, 0.3, 0, bed); box(1.9, 0.22, 2.85, '#FFFFFF', 0, 0.63, 0, bed); box(2.0, 1.3, 0.15, '#D9A877', 0, 0.75, -1.5, bed);
  box(1.0, 0.18, 0.5, '#F6F2FF', 0, 0.82, -1.05, bed);
  const blanket = box(1.96, 0.16, 1.9, '#F28C8C', 0, 0.82, 0.45, bed);
  box(0.6, 0.6, 0.5, '#B07A50', -1.6, 0.3, -1.6, scene);
  const nl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFD27A' })); nl.position.set(-7.2, 0.78, -2.2); scene.add(nl);
  box(0.12, 3.0, 0.3, '#5E4FA8', -3.3, 1.5, -2.3, set); // montant de porte
  // escalier (droite) qui descend
  const stairs = new THREE.Group(); stairs.position.set(4.6, 0, 0); scene.add(stairs);
  for (let i = 0; i < 6; i++) { const st = box(0.55, 0.2, 2.4, i % 2 ? '#C48A55' : '#B07A50', 0.3 + i * 0.55, -0.2 - i * 0.32, 0.3, stairs); }
  for (let i = 0; i < 7; i++) box(0.06, 0.9, 0.06, '#F3E9DC', 0.05 + i * 0.5, 0.45 - i * 0.3, -0.95, stairs);
  const rail = box(3.8, 0.1, 0.12, '#8C5A3C', 1.6, 0.9, -0.95, stairs); rail.rotation.z = -0.52;
  const hole = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 2.6), new THREE.MeshBasicMaterial({ color: '#15102E' })); hole.position.set(6.4, -0.02, 0.3); scene.add(hole);
  addOutlines(set, 0.02); addOutlines(bed, 0.02); addOutlines(stairs, 0.02);

  // ---------- Lumières (aplats : une lumière principale nette) ----------
  scene.add(new THREE.HemisphereLight('#C9C2FF', '#3A2F6A', 1.1));
  const key = new THREE.DirectionalLight('#FFF1E0', 2.4); key.position.set(-3, 8, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 7, bottom: -4, near: 1, far: 30 }); key.shadow.bias = -0.0006; scene.add(key);

  // ---------- Personnages ----------
  const walker = makeCharacter(T, { skin: '#F4C7A1', shirt: '#8FC4F2', pants: '#4F7FD6', hair: '#6B3A22', shoes: '#F3E9DC' });
  const capG = new THREE.Group(); capG.position.set(0.05, 0.22, -0.05); capG.rotation.z = -0.35; walker.userData.parts.head.add(capG);
  const capC = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 18), T('#4F7FD6')); capC.position.y = 0.2; capG.add(capC);
  const pomp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), T('#FFFFFF')); pomp.position.y = 0.5; capG.add(pomp);
  addOutlines(walker, 0.015); scene.add(walker);
  const you = makeCharacter(T, { skin: '#C98E6A', shirt: '#3CC4A0', pants: '#2F4A8A', hair: '#1E1A24' });
  addOutlines(you, 0.015); scene.add(you);

  // ---------- Pictogrammes cartoon ----------
  const hs = new THREE.Shape(); hs.moveTo(0, -0.45); hs.bezierCurveTo(-0.75, 0.05, -0.45, 0.62, 0, 0.28); hs.bezierCurveTo(0.45, 0.62, 0.75, 0.05, 0, -0.45);
  const heart = extr(hs, 0.2, '#F04A4A'); scene.add(heart);
  const bolt = extr(new THREE.Shape([V(0.05, 0.5), V(-0.2, 0.0), V(0.02, 0.0), V(-0.08, -0.5), V(0.25, 0.08), V(0.02, 0.08)].map((p) => new THREE.Vector2(p.x, p.y))), 0.1, '#FFE14D'); scene.add(bolt);
  const myth = text3d('MYTHE', 0.55, '#F04A4A'); scene.add(myth);
  const checkShape = new THREE.Shape([[-0.35, 0.0], [-0.12, -0.25], [0.38, 0.3], [0.28, 0.4], [-0.12, -0.05], [-0.25, 0.1]].map(([x, y]) => new THREE.Vector2(x, y)));
  const checks = [0, 1].map(() => { const c = extr(checkShape, 0.1, '#3CD17A'); scene.add(c); return c; });
  // cerveau : deux moitiés (avant endormie en bleu, arrière active en orange)
  const brain = new THREE.Group(); scene.add(brain);
  const lobe = (c, x) => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), T(c)); s.position.set(x + Math.sin(i * 1.7) * 0.14, Math.cos(i * 2.1) * 0.12, Math.sin(i) * 0.08); g.add(s); } addOutlines(g, 0.015); brain.add(g); return g; };
  const lobeA = lobe('#F5A5C0', -0.28), lobeB = lobe('#F5A5C0', 0.28);
  const brainM = [lobeA, lobeB].map((g) => g.children.filter((m) => m.isMesh && !m.userData.isOutline).map((m) => m.material));
  const qms = [0, 1, 2].map(() => { const q = text3d('?', 0.35, '#FFE14D'); scene.add(q); return q; });
  const zzz = [0, 1, 2].map((i) => { const z = text3d('Z', 0.26 - i * 0.04, '#DDE3FF'); scene.add(z); return z; });
  const bubble = new THREE.Group(); scene.add(bubble);
  const bs = new THREE.Shape(); bs.absellipse(0, 0, 0.85, 0.45, 0, Math.PI * 2, false, 0);
  const bub = extr(bs, 0.08, '#FFFFFF'); bubble.add(bub);
  const tail = extr(new THREE.Shape([new THREE.Vector2(-0.1, 0), new THREE.Vector2(0.15, 0), new THREE.Vector2(-0.25, -0.35)]), 0.08, '#FFFFFF'); tail.position.set(-0.3, -0.45, 0); bubble.add(tail);
  const chut = makeLabel(1.4, 0.5, { color: '#2B2350', px: 150 }); chut.setText('Chut… au lit'); chut.position.z = 0.06; bubble.add(chut);
  const warnShape = new THREE.Shape([new THREE.Vector2(0, 0.55), new THREE.Vector2(0.5, -0.32), new THREE.Vector2(-0.5, -0.32)]);
  const warn = new THREE.Group(); scene.add(warn); warn.add(extr(warnShape, 0.12, '#FFC72C')); const ex = text3d('!', 0.42, '#2B2350'); ex.position.z = 0.1; warn.add(ex);
  const hearts = [0, 1, 2].map(() => { const h = extr(hs, 0.1, '#FF7AA8'); h.scale.setScalar(0.35); scene.add(h); return h; });
  const motion = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); scene.add(m); return m; });
  const confM = ['#F04A4A', '#FFE14D', '#3CD17A', '#8FC4F2', '#FF7AA8'].map((c) => T(c));
  const conf = Array.from({ length: 70 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.01), confM[i % 5]); m.visible = false; scene.add(m); return m; });
  const cR = rng(77); const cS = conf.map(() => [cR() * 2 - 1, cR(), cR() * 2 - 1, cR() * 6]);

  // ---------- Trajectoires ----------
  const tGuide = w('s4', 6), tBed = w('s4', 10) + 0.3, tStairs = C.seg('s5'), tWake = w('s5', 11), tEnd = C.seg('end1');
  const walkerX = (t) => {
    if (t < C.seg('s4')) return lerp(-2.8, 1.6, prog(t, 0, C.seg('s4')));
    if (t < tGuide) return 1.6;
    if (t < tBed) return lerp(1.6, -3.4, easeInOut(prog(t, tGuide, tBed - tGuide)));
    if (t < tStairs) return -3.4;
    if (t < tWake) return lerp(2.4, 4.35, easeOut(prog(t, tStairs, tWake - tStairs)));
    return 4.35;
  };
  const youX = (t) => {
    if (t < w('s2', 3)) return -6.5;
    if (t < w('s2', 12)) return lerp(-6.5, -0.4, easeOut(prog(t, w('s2', 3), 1.4)));
    if (t < w('s2', 12) + 0.5) return lerp(-0.4, -0.9, prog(t, w('s2', 12), 0.3));
    if (t < tGuide) return lerp(-0.9, 0.9, smooth(prog(t, C.seg('s4'), 1.0)));
    if (t < tBed) return lerp(0.9, -2.7, easeInOut(prog(t, tGuide, tBed - tGuide)));
    if (t < tStairs) return -2.7;
    if (t < tWake) return lerp(1.2, 3.55, easeOut(prog(t, tStairs, tWake - tStairs)));
    return 3.55;
  };

  // ---------- Caméra ----------
  const keys = [
    { t: 0, pos: [-1.4, 2.0, 5.6], look: [-2.2, 1.4, 0], fov: 38 },
    { t: w('hook1', 11), pos: [-0.5, 2.2, 5.4], look: [-1.2, 1.7, 0], fov: 38 },
    { t: w('hook2', 4), pos: [-0.6, 2.3, 6.4], look: [-0.9, 1.9, 0], fov: 38 },
    { t: w('s1', 9), pos: [-0.1, 2.4, 6.2], look: [-0.4, 1.9, 0], fov: 38 },
    { t: w('s2', 6), pos: [0.0, 2.0, 5.4], look: [-0.2, 1.6, 0], fov: 38 },
    { t: w('s2', 12), pos: [0.3, 2.1, 6.4], look: [0.0, 1.6, 0], fov: 38 },
    { t: w('s3', 9), pos: [0.9, 2.6, 5.0], look: [0.8, 2.3, 0], fov: 38 },
    { t: C.segEnd('s3'), pos: [1.2, 2.2, 5.8], look: [1.0, 1.6, 0], fov: 38 },
    { t: tGuide, pos: [0.9, 2.1, 6.4], look: [0.6, 1.6, 0], fov: 38 },
    { t: tBed, pos: [-2.6, 2.2, 6.2], look: [-3.0, 1.4, 0], fov: 38 },
    { t: tStairs + 0.3, pos: [3.4, 2.2, 6.4], look: [3.6, 1.2, 0], fov: 38 },
    { t: w('s5', 10), pos: [4.0, 2.0, 5.6], look: [4.0, 1.3, 0], fov: 38 },
    { t: C.segEnd('s5'), pos: [3.9, 2.1, 5.2], look: [4.0, 1.5, 0], fov: 38 },
    { t: w('end1', 1), pos: [-4.3, 2.8, 5.0], look: [-5.0, 1.2, -0.6], fov: 38 },
    { t: C.duration, pos: [-4.4, 3.0, 5.4], look: [-5.0, 1.2, -0.6], fov: 38 },
  ];
  // recul général pour garder les pictogrammes flottants dans le cadre
  for (const k of keys) { k.look[1] += 0.35; k.pos = k.pos.map((v, i) => k.look[i] + (v - k.look[i]) * 1.4); }
  const rig = new CameraRig(camera, keys);
  rig.addShake(w('hook1', 13), 0.05, 0.4); rig.addShake(w('hook2', 4), 0.07, 0.4); rig.addShake(w('s2', 12), 0.04, 0.4);

  // ---------- Bruitages ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  for (let i = 0; i < 8; i++) S(0.2 + i * 0.6, 'tick', 0.35);
  S(0.1, 'snore', 0.6); S(w('hook1', 13), 'heartbeat', 1); S(w('hook1', 13) + 0.3, 'zap', 0.8);
  S(w('hook2', 4), 'stamp', 1); S(w('hook2', 4), 'scratch', 0.8);
  S(w('s1', 5), 'pop'); S(w('s1', 6), 'ding', 0.6); S(w('s1', 9), 'pop'); S(w('s1', 10), 'ding', 0.6);
  S(w('s2', 5), 'boing', 0.8); S(w('s2', 6), 'pop'); S(w('s2', 7), 'pop'); S(w('s2', 12), 'whoosh', 0.9); S(w('s2', 12) + 0.2, 'whoosh', 0.7);
  S(w('s3', 7), 'pop'); S(w('s3', 9), 'snore', 0.8); S(w('s3', 14), 'zap', 0.7);
  S(w('s4', 3), 'pop'); S(w('s4', 3) + 0.2, 'sparkle', 0.6); S(tGuide, 'slide', 0.6); S(tBed - 0.2, 'rustle', 0.8);
  S(tStairs, 'whoosh_long', 0.8); S(w('s5', 4), 'pop'); S(w('s5', 4), 'beep', 0.6); S(w('s5', 11), 'click', 0.7); S(tWake + 0.3, 'sparkle', 0.8);
  S(w('end1', 0), 'confetti', 1); S(w('end1', 2), 'snore', 0.8); S(w('end1', -1), 'ding', 0.9);

  const faceCam = (o) => o.quaternion.copy(camera.quaternion);
  const show = (o, s, k = 1) => { o.visible = s > 0.001; o.scale.setScalar(Math.max(0.001, s * k)); };

  function update(t) {
    // ----- somnambule -----
    const inBed = (t > tBed && t < tStairs) || t > tEnd;
    const wx = walkerX(t);
    const wMoving = !inBed && (t < C.seg('s4') || (t > tGuide && t < tBed) || (t > tStairs && t < tWake));
    const flail = t > w('s2', 12) - 0.1 && t < C.seg('s3') + 0.4 ? 1 : 0;
    const awake = (t > w('s2', 5) && t < C.seg('s3') + 0.4) || (t > tWake + 0.2 && t < tEnd);
    if (inBed) {
      walker.position.set(-5.6, 1.12, -0.35); walker.rotation.set(-Math.PI / 2, 0, 0); walker.scale.setScalar(0.85);
      walker.pose({ arms: [{ z: 0.1 }, { z: 0.1 }] }); walker.face({ eyes: 0.03, mouth: 0.15, smile: 0.5 });
    } else {
      walker.scale.setScalar(1); walker.rotation.set(0, wMoving ? (walkerX(t + 0.05) >= wx ? Math.PI / 2 - 0.55 : -Math.PI / 2 + 0.55) : 0.2, 0);
      walker.position.set(wx, 0, 0.3);
      const ph = t * 5.5;
      if (flail) walker.pose({ arms: [{ x: -2.4 + Math.sin(t * 22) * 0.9, z: 0.6 }, { x: -2.0 + Math.cos(t * 19) * 0.9, z: 0.6 }], legs: [Math.sin(t * 18) * 0.3, -Math.sin(t * 18) * 0.3], head: { z: Math.sin(t * 15) * 0.15 } });
      else walker.walkPose(ph, wMoving ? 0.6 : 0, { arms: awake ? [{ x: 0, z: 0.25 }, { x: 0, z: 0.25 }] : [{ x: -1.45, z: -0.05, el: 0 }, { x: -1.45, z: -0.05, el: 0 }], head: { x: awake ? 0 : 0.12 } });
      walker.face({ eyes: awake ? 1 : 0.04, mouth: awake ? 0.45 : 0.15 });
    }
    // ----- toi -----
    const yx = youX(t);
    you.visible = t > w('s2', 3) - 0.1;
    const yMoving = Math.abs(youX(t + 0.05) - yx) > 0.005;
    you.position.set(yx, 0, inBed && t < tStairs ? 0.9 : 0.9);
    you.rotation.y = yMoving ? (youX(t + 0.05) > yx ? Math.PI / 2 - 0.5 : -Math.PI / 2 + 0.5) : 0.35;
    if (t > w('s4', 3) && t < tBed) you.walkPose(t * 5.5, yMoving ? 0.6 : 0, { arms: [{ x: -0.3 }, { x: -1.3, z: -0.2, el: -0.3 }] });
    else if (t > w('s5', 11) - 0.2 && t < tEnd) you.walkPose(t * 5.5, yMoving ? 0.6 : 0, { arms: [{ x: 0 }, { x: -1.4, z: -0.1, el: -0.2 }] });
    else you.walkPose(t * 6, yMoving ? 0.8 : 0);
    you.face({ eyes: t > tEnd ? 0.1 : 1, mouth: t > w('s4', 3) && t < w('s4', 5) + 0.6 ? 0.5 + 0.3 * Math.sin(t * 20) : 0.25, smile: t > tEnd ? 0.8 : 0.3 });
    if (t > tEnd) { you.position.set(-4.1, 0, 1.0); you.rotation.y = -0.5; you.pose({ arms: [{ x: -2.8, z: 0.3, el: 0.6 }, { x: 0 }] }); }

    // ----- pictogrammes -----
    const headW = walker.position.clone().add(V(0, inBed ? 0.4 : 2.4, 0));
    const sH = life(t, w('hook1', 13) - 0.05, w('s1', 10) + 0.3);
    show(heart, sH * (1 + 0.15 * Math.max(0, Math.sin(t * 9)) ** 6), 0.9); heart.position.set(walker.position.x + 0.9, 2.7, 0.6); faceCam(heart);
    show(bolt, life(t, w('hook1', 13) + 0.2, w('hook2', 4)), 0.9); bolt.position.copy(heart.position).add(V(0.25, 0.1, 0.25)); faceCam(bolt);
    show(myth, life(t, w('hook2', 4) - 0.02, C.segEnd('hook2') + 0.4, 0.3), 0.75); myth.position.set(walker.position.x + 1.1, 2.3, 1.2); faceCam(myth); myth.rotateZ(0.18);
    checks.forEach((c, i) => { show(c, life(t, [w('s1', 6), w('s1', 10)][i] - 0.1, C.segEnd('s1') + 0.3), 1.1); c.position.copy(i ? headW.clone().add(V(0.9, 0.2, 0.6)) : heart.position.clone().add(V(0.55, -0.3, 0.3))); faceCam(c); });
    const sBr = life(t, w('s1', 9) - 0.1, C.segEnd('s1') + 0.3) + life(t, w('s3', 7) - 0.1, C.segEnd('s3') + 0.3);
    show(brain, Math.min(1, sBr), t > C.seg('s3') - 0.3 ? 1.5 : 0.9); brain.position.copy(t > C.seg('s3') - 0.3 ? headW.clone().add(V(0, 0.55, 0.4)) : headW.clone().add(V(-0.2, 0.25, 0.6))); faceCam(brain);
    const split = t > w('s3', 7) - 0.2 && t < C.segEnd('s3') + 0.3;
    brainM[0].forEach((m) => m.color.set(split ? '#6E8BFF' : '#F5A5C0'));
    brainM[1].forEach((m) => m.color.set(split && t > w('s3', 13) - 0.2 ? '#FF9A3C' : '#F5A5C0'));
    lobeB.position.y = split && t > w('s3', 13) - 0.2 ? Math.sin(t * 20) * 0.02 : 0;
    qms.forEach((q, i) => { const on = t > w('s2', 6) - 0.1 && t < w('s2', 12); q.visible = on; const a = t * 2.5 + i * 2.1; q.position.copy(headW).add(V(Math.cos(a) * 0.55, 0.2 + Math.sin(t * 4 + i) * 0.1, Math.sin(a) * 0.4 + 0.2)); q.scale.setScalar(on ? 1 : 0.001); faceCam(q); });
    zzz.forEach((z, i) => {
      const u = ((t * 0.55) + i / 3) % 1;
      const asleepWalking = t < w('s2', 5) || (t > tGuide && t < tStairs) || (t > tStairs && t < tWake) || t > tEnd || (t > w('s3', 7) && t < C.segEnd('s3'));
      const base = t > w('s3', 7) && t < C.segEnd('s3') + 0.3 ? brain.position.clone().add(V(-0.55, 0.2, 0)) : headW.clone().add(V(0.25, 0.1, 0));
      z.visible = asleepWalking; z.position.copy(base).add(V(u * 0.45, u * 0.8, 0)); z.scale.setScalar(asleepWalking ? Math.sin(u * Math.PI) + 0.001 : 0.001); faceCam(z);
    });
    motion.forEach((m, i) => { m.visible = flail > 0; m.position.copy(walker.position).add(V((i % 2 ? 1 : -1) * (0.7 + (i > 1 ? 0.2 : 0)), 1.9 + (i > 1 ? 0.3 : 0), 0.4)); m.rotation.z = (i % 2 ? -1 : 1) * 0.4; });
    const sBub = life(t, w('s4', 3) - 0.1, w('s4', 6) + 0.6); show(bubble, sBub, 0.85); bubble.position.set(you.position.x + 0.35, 2.9, 1.1); faceCam(bubble);
    const sW = life(t, w('s5', 4) - 0.1, w('s5', 11)); show(warn, sW * (1 + 0.06 * Math.sin(t * 14)), 0.9); warn.position.set(4.9, 2.6, 0.6); faceCam(warn);
    hearts.forEach((h, i) => { const u = ((t - tWake) * 0.8 + i / 3) % 1; const on = t > tWake + 0.2 && t < tEnd; h.visible = on; h.position.copy(walker.position).add(V(-0.3 + i * 0.3, 2.3 + u * 0.8, 0.3)); h.scale.setScalar(on ? 0.3 * Math.sin(u * Math.PI) + 0.001 : 0.001); faceCam(h); });
    conf.forEach((m, i) => { const x = t - w('end1', 0); m.visible = x > 0 && x < 3.5; if (!m.visible) return; const [a, b, c, r] = cS[i]; m.position.set(-5.0 + a * 2.6 * (1 - Math.exp(-x * 2)), 1.0 + (4 + b * 2.5) * (1 - Math.exp(-x * 2)) / 2 - 1.1 * x * x / (1 + x), 0.6 + c * 1.2); m.rotation.set(x * 5 + r, x * 3, r); });
    blanket.position.y = inBed ? 1.12 : 0.82;

    rig.update(t);
  }
  return { update, sfx };
}
