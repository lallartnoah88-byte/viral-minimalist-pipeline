// Vidéo 06 — « Manger avant de dormir fait-il grossir ? » — style PAPIER DÉCOUPÉ (couches, ombres portées, 12 i/s).
import * as THREE from 'three';
import { CameraRig, life, prog, smooth, easeOut, easeInOut, drop, lerp, clamp, rng } from '../lib/core.js';
import { paperMat, paperShape, shapes } from '../lib/styles.js';
import { makeLabel } from '../lib/props2.js';

const STEP = 12;

export function build(scene, camera, C) {
  const w = C.w;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.environment = null;
  scene.background = new THREE.Color('#1D2A4D');
  const P = (shape, color, x, y, z, parent, opts) => { const g = paperShape(shape, color, opts); g.position.set(x, y, z); (parent || scene).add(g); return g; };
  const label = (txt, color, x, y, z, parent, wdt = 1.6, hgt = 0.4, bg = '#FBF7F0', px = 120) => {
    const g = new THREE.Group(); g.position.set(x, y, z); (parent || scene).add(g);
    const strip = paperShape(shapes.rrect(wdt, hgt, 0.06), bg, { border: false }); g.add(strip);
    const l = makeLabel(wdt * 0.92, hgt * 0.8, { color, px }); l.setText(txt); l.position.z = 0.035; g.add(l);
    return g;
  };

  // ---------- Fond de nuit en papier (parallaxe) ----------
  const back = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), paperMat('#22305A')); back.position.set(12, 2, -2.2); back.receiveShadow = true; scene.add(back);
  const R = rng(21);
  for (let i = 0; i < 70; i++) P(shapes.star(0.09 + R() * 0.07, 0.04), '#FFE9A8', -6 + R() * 40, 2 + R() * 6, -2.1, null, { depth: 0.01, border: false });
  P(shapes.crescent(0.8), '#FFE08A', 2.5, 5.6, -2.0, null, { depth: 0.04 });
  for (let i = 0; i < 9; i++) { const c = new THREE.Group(); c.position.set(-4 + i * 4.6, 4.2 + (i % 3) * 0.8, -1.7); scene.add(c); [[0, 0, 0.5], [0.5, 0.15, 0.6], [1.05, 0, 0.45]].forEach(([x, y, r]) => P(shapes.circle(r), '#3A4A7A', x, y, 0, c, { depth: 0.02, border: false })); }
  // collines de premier plan
  for (let i = 0; i < 8; i++) P(shapes.ellipse(3.2, 1.1), i % 2 ? '#2F7A5E' : '#3E9370', -4 + i * 4.4, -2.65, 0.9, null, { depth: 0.04 });

  // ---------- Cartes (une par idée), alignées comme une frise ----------
  const cardAt = (x) => { const g = new THREE.Group(); g.position.set(x, 1.5, 0); scene.add(g); P(shapes.rrect(4.6, 6.4, 0.25), '#FBEFDD', 0, 0, 0, g, { depth: 0.04 }); return g; };
  const A = cardAt(0), B = cardAt(5.6), Cc = cardAt(11.2), D = cardAt(16.8), E = cardAt(22.4);

  // --- Carte A : burger de minuit, lit, graisse ---
  const plate = P(shapes.ellipse(1.15, 0.28), '#FFFFFF', 0, -1.6, 0.08, A);
  const burger = new THREE.Group(); burger.position.set(0, -1.15, 0.12); A.add(burger);
  P(shapes.rrect(1.5, 0.3, 0.14), '#E8A04E', 0, -0.25, 0, burger);
  P(shapes.rrect(1.6, 0.28, 0.12), '#6B3A22', 0, 0.0, 0.02, burger);
  P(shapes.poly([[-0.8, 0.1], [-0.6, 0.22], [-0.4, 0.1], [-0.2, 0.22], [0, 0.1], [0.2, 0.22], [0.4, 0.1], [0.6, 0.22], [0.8, 0.1], [0.8, 0.02], [-0.8, 0.02]]), '#6CC24A', 0, 0.1, 0.04, burger);
  P(shapes.poly([[-0.75, 0.2], [0.75, 0.2], [0.3, -0.05], [0, 0.18], [-0.35, -0.05]]), '#FFC93C', 0, 0.12, 0.03, burger);
  const topBun = new THREE.Shape(); topBun.absellipse(0, 0, 0.8, 0.5, 0, Math.PI, false); topBun.lineTo(-0.8, 0);
  P(topBun, '#F0AE55', 0, 0.36, 0.06, burger);
  for (let i = 0; i < 6; i++) P(shapes.ellipse(0.05, 0.025), '#FFF4D6', -0.45 + i * 0.18, 0.55 + Math.sin(i) * 0.08, 0.1, burger, { depth: 0.01, border: false });
  const clockA = new THREE.Group(); clockA.position.set(1.0, 2.2, 0.1); A.add(clockA);
  P(shapes.circle(0.7), '#FFFFFF', 0, 0, 0, clockA);
  P(shapes.circle(0.62), '#F6E7CF', 0, 0, 0.02, clockA, { border: false });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(shapes.rrect(0.05, 0.12, 0.02), '#2A2A30', Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0.05, clockA, { depth: 0.01, border: false }).rotation.z = -a; }
  const hHour = new THREE.Group(); hHour.position.z = 0.08; clockA.add(hHour); P(shapes.rrect(0.07, 0.38, 0.03), '#2A2A30', 0, 0.17, 0, hHour, { depth: 0.01, border: false });
  const hMin = new THREE.Group(); hMin.position.z = 0.1; clockA.add(hMin); P(shapes.rrect(0.05, 0.52, 0.02), '#E2473D', 0, 0.24, 0, hMin, { depth: 0.01, border: false });
  const bedA = new THREE.Group(); bedA.position.set(-0.3, 0.6, 0.1); A.add(bedA);
  P(shapes.rrect(2.6, 0.5, 0.1), '#B07A50', 0, -0.35, 0, bedA);
  P(shapes.rrect(0.25, 1.3, 0.08), '#8C5A3C', -1.25, 0.1, 0.01, bedA);
  P(shapes.rrect(0.6, 0.32, 0.12), '#FFFFFF', -0.85, 0.05, 0.04, bedA);
  const sleeper = new THREE.Group(); sleeper.position.set(-0.85, 0.22, 0.06); bedA.add(sleeper);
  P(shapes.circle(0.26), '#F4C7A1', 0, 0, 0.02, sleeper);
  P(shapes.ellipse(0.26, 0.12), '#3A2A22', -0.04, 0.17, 0.03, sleeper, { border: false });
  P(shapes.rrect(1.9, 0.42, 0.15), '#7FC8A9', 1.05, -0.08, 0.05, bedA);
  const fat = new THREE.Group(); fat.position.set(0, -1.1, 0.25); A.add(fat);
  P(shapes.ellipse(0.95, 0.75), '#FFE07A', 0, 0, 0, fat);
  P(shapes.circle(0.09), '#2A2A30', -0.3, 0.12, 0.05, fat, { border: false }); P(shapes.circle(0.09), '#2A2A30', 0.3, 0.12, 0.05, fat, { border: false });
  P(shapes.ellipse(0.2, 0.08), '#C0392B', 0, -0.22, 0.05, fat, { border: false });
  const qMark = label('?', '#E2473D', 1.45, -0.3, 0.3, A, 1.0, 1.2, '#FBF7F0', 420);

  // --- Carte B : le total compte ---
  label('TOTAL DE LA JOURNÉE', '#2A2A30', 0, 2.6, 0.08, B, 3.6, 0.45);
  const icons = [['#FFC93C', 'MATIN'], ['#F28C38', 'MIDI'], ['#6A7FDB', 'SOIR']];
  const meals = icons.map(([c, t], i) => { const g = new THREE.Group(); g.position.set(-1.4 + i * 1.4, 1.65, 0.08); B.add(g); P(shapes.circle(0.4), c, 0, 0, 0, g); const l = makeLabel(1.2, 0.3, { color: '#2A2A30', px: 110 }); l.setText(t); l.position.set(0, -0.6, 0.04); g.add(l); return g; });
  const jar = new THREE.Group(); jar.position.set(0, -1.2, 0.08); B.add(jar);
  P(shapes.rrect(2.0, 2.2, 0.2), '#DDEBF5', 0, 0, 0, jar);
  const blocks = []; const bc = ['#FFC93C', '#F28C38', '#6A7FDB'];
  for (let i = 0; i < 9; i++) blocks.push(P(shapes.rrect(0.5, 0.42, 0.06), bc[Math.floor(i / 3)], 0, 0, 0.05, jar));
  const noClock = new THREE.Group(); noClock.position.set(1.35, 0.2, 0.2); B.add(noClock);
  P(shapes.circle(0.42), '#FFFFFF', 0, 0, 0, noClock); P(shapes.rrect(0.05, 0.3, 0.02), '#2A2A30', 0, 0.12, 0.04, noClock, { border: false });
  for (const s of [1, -1]) P(shapes.rrect(1.0, 0.13, 0.04), '#E2473D', 0, 0, 0.08, noClock, { border: false }).rotation.z = s * 0.78;

  // --- Carte C : l'étude 2022 (mêmes repas, 4 h plus tard) ---
  label('HARVARD · 2022', '#2A2A30', 0, 2.6, 0.08, Cc, 3.2, 0.45);
  const rowY = [1.1, -0.6];
  const rowLbl = ['TÔT', 'TARD'];
  const rowPlates = rowY.map((y, r) => {
    P(shapes.rrect(3.9, 0.08, 0.03), '#2A2A30', 0, y - 0.45, 0.06, Cc, { border: false });
    const l = makeLabel(1.0, 0.3, { color: r ? '#E2473D' : '#2A8A5E', px: 120 }); l.setText(rowLbl[r]); l.position.set(-1.45, y + 0.5, 0.1); Cc.add(l);
    return [0, 1, 2].map((k) => { const g = new THREE.Group(); g.position.set(-1.3 + k * 1.0, y, 0.1); Cc.add(g); P(shapes.ellipse(0.38, 0.12), '#FFFFFF', 0, -0.2, 0, g); P(shapes.ellipse(0.26, 0.2), bc[k], 0, -0.05, 0.03, g); return g; });
  });
  const shiftLbl = label('+ 4 H', '#E2473D', 0.9, -1.9, 0.12, Cc, 1.4, 0.5, '#FFE0DA');

  // --- Carte D : effets mesurés + conclusion ---
  const effects = [['FAIM', '#F28CA8', '↑'], ['CALORIES BRÛLÉES', '#F28C38', '↓'], ['STOCKAGE', '#FFE07A', '↑']];
  const effG = effects.map(([t, c, arr], i) => {
    const g = new THREE.Group(); g.position.set(0, 1.9 - i * 1.35, 0.08); D.add(g);
    P(shapes.circle(0.48), c, -1.3, 0, 0, g);
    const l = makeLabel(2.3, 0.4, { color: '#2A2A30', px: 110 }); l.setText(t); l.position.set(0.3, 0.0, 0.04); g.add(l);
    const a = makeLabel(0.9, 0.9, { color: arr === '↑' ? '#E2473D' : '#2A8A5E', px: 400 }); a.setText(arr); a.position.set(1.85, 0.05, 0.04); g.add(a);
    return g;
  });
  const flameD = P(shapes.poly([[0, 0.38], [0.22, 0.05], [0.16, -0.25], [0, -0.32], [-0.16, -0.25], [-0.22, 0.05]]), '#FF5A2B', -1.3, 0.55, 0.15, D);
  const fatCells = [0, 1, 2].map((k) => P(shapes.circle(0.16), '#FFF2B0', -1.45 + k * 0.17, -0.8 + (k % 2) * 0.12, 0.15, D));
  const stomach = P(shapes.ellipse(0.32, 0.22), '#E0607E', -1.3, 1.9, 0.15, D);
  const plusLbl = label('+ MANGER  + STOCKER', '#E2473D', 0, -2.4, 0.12, D, 3.8, 0.5, '#FFE0DA');
  // --- Carte E : conseil + frigo qui dort ---
  const gapRow = new THREE.Group(); gapRow.position.set(0, 2.35, 0.08); E.add(gapRow);
  P(shapes.ellipse(0.45, 0.14), '#FFFFFF', -1.5, -0.15, 0, gapRow); P(shapes.ellipse(0.3, 0.22), '#F28C38', -1.5, 0.0, 0.03, gapRow);
  P(shapes.rrect(0.9, 0.35, 0.08), '#B07A50', 1.5, -0.1, 0, gapRow); P(shapes.rrect(0.3, 0.2, 0.06), '#FFFFFF', 1.25, 0.12, 0.03, gapRow);
  const bracket = P(shapes.rrect(2.0, 0.08, 0.03), '#2A2A30', 0, -0.55, 0.02, gapRow, { border: false });
  const gapLbl = makeLabel(2.6, 0.32, { color: '#2A2A30', px: 110 }); gapLbl.setText('QUELQUES HEURES'); gapLbl.position.set(0, -0.85, 0.05); gapRow.add(gapLbl);
  const fridge = new THREE.Group(); fridge.position.set(0, -1.35, 0.1); E.add(fridge);
  P(shapes.rrect(1.8, 2.6, 0.22), '#E8EEF5', 0, 0, 0, fridge);
  P(shapes.rrect(1.6, 0.05, 0.02), '#B9C3CF', 0, 0.45, 0.04, fridge, { border: false });
  P(shapes.rrect(0.08, 0.5, 0.03), '#9AA5B3', 0.65, 0.85, 0.05, fridge, { border: false }); P(shapes.rrect(0.08, 0.7, 0.03), '#9AA5B3', 0.65, -0.3, 0.05, fridge, { border: false });
  for (const s of [-1, 1]) P(shapes.rrect(0.32, 0.06, 0.03), '#2A2A30', s * 0.3, -0.1, 0.06, fridge, { border: false });
  P(shapes.ellipse(0.16, 0.06), '#C0392B', 0, -0.45, 0.06, fridge, { border: false });
  const cap = new THREE.Group(); cap.position.set(0.25, 1.45, 0.08); fridge.add(cap);
  P(shapes.poly([[-0.7, 0], [0.7, 0], [0.5, 0.55], [0.85, 0.95]]), '#6A7FDB', 0, 0, 0, cap); P(shapes.circle(0.14), '#FFFFFF', 0.85, 0.95, 0.03, cap);
  const zs = [0, 1, 2].map(() => { const l = makeLabel(0.5, 0.5, { color: '#FFFFFF', px: 300 }); l.setText('Z'); E.add(l); return l; });
  const sparkles = Array.from({ length: 10 }, (_, i) => P(shapes.star(0.18, 0.07), '#FFE08A', 0, 0, 0.5, E, { depth: 0.01, border: false }));

  // ---------- Lumières (ombres de papier bien visibles) ----------
  scene.add(new THREE.HemisphereLight('#FFF4E6', '#40507A', 1.5));
  const key = new THREE.DirectionalLight('#FFF0DC', 2.4); key.position.set(-5, 6, 9); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 }); key.shadow.radius = 3; key.shadow.bias = -0.0006;
  scene.add(key); scene.add(key.target);

  // ---------- Caméra : travelling le long de la frise ----------
  const at = (x, y = 1.5, z = 8.6) => ({ pos: [x + 0.2, y + 0.3, z + 4.6], look: [x, y, 0], fov: 36 });
  const keys = [
    { t: 0, ...at(0, 0.6, 7.2) },
    { t: w('hook1', 5), ...at(0.3, 2.3, 7.6) },
    { t: w('hook1', 8), ...at(-0.2, 1.8, 7.8) },
    { t: w('hook1', 13), ...at(0, 0.9, 7.6) },
    { t: C.segEnd('hook2'), ...at(0.1, 1.2, 8.4) },
    { t: w('s1', 4), ...at(5.6, 1.9, 8.6) },
    { t: C.segEnd('s1'), ...at(5.7, 1.2, 8.8) },
    { t: w('s2', 5), ...at(11.2, 1.8, 8.6) },
    { t: C.segEnd('s2'), ...at(11.3, 1.2, 8.8) },
    { t: w('s3', 4), ...at(16.8, 1.8, 8.6) },
    { t: C.segEnd('s4'), ...at(16.9, 1.2, 9.0) },
    { t: w('s5', 6), ...at(22.4, 2.6, 7.6) },
    { t: w('end1', 1), ...at(22.4, 0.7, 8.2) },
    { t: C.duration, ...at(22.45, 0.9, 8.8) },
  ];
  const rig = new CameraRig(camera, keys);
  rig.addShake(w('hook2', 0), 0.05, 0.4);

  // ---------- Bruitages ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  S(w('hook1', 0), 'rustle', 1); S(w('hook1', 3), 'slide', 0.7); S(w('hook1', 5), 'pop'); S(w('hook1', 5) + 0.2, 'clock', 0.7);
  S(w('hook1', 8), 'rustle', 0.8); S(w('hook1', 8) + 0.3, 'snore', 0.6); S(w('hook1', 13), 'squish', 0.9); S(w('hook1', 15), 'boing', 0.7);
  S(w('hook2', 0), 'rip', 1); S(w('hook2', 5), 'pop');
  S(C.seg('s1') - 0.2, 'whoosh', 0.8); for (let i = 0; i < 9; i++) S(w('s1', 7) + i * 0.15, 'tick', 0.6); S(w('s1', 13), 'stamp', 1);
  S(C.seg('s2') - 0.1, 'whoosh', 0.8); S(w('s2', 2), 'stamp', 0.8); S(w('s2', 11), 'pop'); S(w('s2', 13), 'slide', 0.9);
  S(C.seg('s3') - 0.1, 'whoosh', 0.8); S(w('s3', 6), 'squish', 0.9); S(w('s3', 7), 'pop'); S(w('s3', 11), 'fire', 0.5); S(w('s3', 13), 'pop'); S(w('s3', 17), 'inflate', 0.8); S(w('s3', 18), 'pop');
  S(w('s4', 10), 'stamp', 0.9); S(w('s4', 16), 'stamp', 0.9);
  S(C.seg('s5') - 0.1, 'whoosh', 0.8); S(w('s5', 3), 'slide', 0.7); S(w('s5', 8), 'pop'); S(w('s5', 11), 'pop');
  S(w('end1', 0), 'confetti', 0.8); S(w('end1', 0), 'rustle', 0.8); S(w('end1', 4), 'snore', 0.9); S(w('end1', -1), 'ding', 0.9);

  const show = (o, s, k = 1) => { o.visible = s > 0.001; o.scale.setScalar(Math.max(0.001, s * k)); };

  function update(tReal) {
    const t = Math.floor(tReal * STEP) / STEP;
    // carte A
    const sB = life(t, w('hook1', 0) - 0.05, w('hook1', 13), 0.4, 0.2);
    burger.visible = sB > 0.001; burger.position.y = -1.15 - (1 - easeOut(prog(t, w('hook1', 0), 0.4))) * 3; burger.scale.setScalar(Math.max(0.001, sB));
    plate.position.y = burger.position.y - 0.45;
    const sCk = life(t, w('hook1', 5) - 0.05, C.segEnd('hook2') + 0.4); show(clockA, sCk);
    const minutes = 23 * 60 + 40 + 20 * smooth(prog(t, w('hook1', 5), 0.8));
    hMin.rotation.z = -(minutes % 60) / 60 * Math.PI * 2; hHour.rotation.z = -((minutes / 60) % 12) / 12 * Math.PI * 2;
    const sBed = life(t, w('hook1', 8) - 0.05, C.segEnd('hook2') + 0.4); bedA.visible = sBed > 0.001; bedA.position.x = -0.3 - (1 - easeOut(prog(t, w('hook1', 8), 0.4))) * 4;
    sleeper.position.y = 0.22 + Math.sin(t * 3) * 0.02;
    const sF = life(t, w('hook1', 13), w('hook2', 0) + 0.25); show(fat, sF * (1 + 0.06 * Math.sin(t * 9)));
    fat.rotation.z = t > w('hook2', 0) ? 0.4 * prog(t, w('hook2', 0), 0.25) : 0;
    show(qMark, life(t, w('hook2', 5), C.segEnd('hook2') + 0.4));
    // carte B : les blocs de calories tombent dans le bocal
    meals.forEach((m, i) => show(m, life(t, w('s1', 7) + i * 0.12, C.segEnd('s1') + 0.3)));
    blocks.forEach((b, i) => {
      const t0 = w('s1', 7) + 0.2 + i * 0.15;
      const col = i % 3, row = Math.floor(i / 3);
      b.visible = t > t0;
      b.position.set(-0.6 + col * 0.6, -0.72 + row * 0.5 + drop(t, t0, 0.35) * 2.5, 0.05);
    });
    show(noClock, life(t, w('s1', 13) - 0.05, C.segEnd('s1') + 0.3, 0.3));
    // carte C : la rangée « TARD » glisse de 4 heures
    const slide = easeInOut(prog(t, w('s2', 13), 0.8));
    rowPlates[1].forEach((g, k) => { g.position.x = -1.3 + k * 1.0 + slide * 1.2; });
    rowPlates.flat().forEach((g, i) => show(g, life(t, w('s2', 9) + (i % 3) * 0.1, C.duration)));
    show(shiftLbl, life(t, w('s2', 14), C.duration));
    // carte D : effets
    effG.forEach((g, i) => show(g, life(t, [w('s3', 6), w('s3', 8), w('s3', 16)][i] - 0.1, C.duration)));
    stomach.scale.set(1 + 0.12 * Math.sin(t * 14) * (t > w('s3', 6) ? 1 : 0), 1, 1);
    flameD.scale.setScalar(lerp(1, 0.6, smooth(prog(t, w('s3', 11), 0.6))));
    fatCells.forEach((c, k) => c.scale.setScalar(lerp(1, 1.8, smooth(prog(t, w('s3', 17) + k * 0.1, 0.6)))));
    show(plusLbl, life(t, w('s4', 10) - 0.05, C.duration, 0.35));
    // carte E
    show(gapRow, life(t, w('s5', 3) - 0.1, C.duration));
    bracket.scale.x = Math.max(0.001, easeOut(prog(t, w('s5', 4), 0.8)));
    const sFr = life(t, w('end1', 0) - 0.1, C.duration, 0.5); show(fridge, sFr);
    zs.forEach((z, i) => { const u = ((t * 0.5) + i / 3) % 1; const on = t > w('end1', 3); z.visible = on; z.position.set(0.9 + u * 0.6, 0.6 + u * 1.2, 0.4); z.scale.setScalar(on ? Math.sin(u * Math.PI) * 1.1 + 0.001 : 0.001); });
    sparkles.forEach((s, i) => { const on = t > w('end1', 0); s.visible = on; const a = i / 10 * Math.PI * 2; const r = 1.6 + 0.3 * Math.sin(t * 2 + i); s.position.set(Math.cos(a) * r, -0.8 + Math.sin(a) * r * 1.2, 0.5); s.scale.setScalar(on ? 0.6 + 0.5 * Math.abs(Math.sin(t * 3 + i)) : 0.001); });
    // lumière qui suit la caméra (ombres toujours dans le cadre)
    key.position.set(camera.position.x - 5, 6, 9); key.target.position.set(camera.position.x, 1, 0);
    rig.update(t);
  }
  return { update, sfx };
}
