// Vidéo 04 — « Avale-t-on vraiment des araignées en dormant ? » — style DIORAMA ISOMÉTRIQUE (caméra orthographique, low-poly).
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { W, H, life, prog, smooth, easeInOut, easeOut, drop, lerp, clamp, keyTrack, rng } from '../lib/core.js';
import { makeCharacter } from '../lib/character.js';
import { makeLabel } from '../lib/props2.js';
import { Sparkles } from '../lib/props.js';

const LP = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85, ...o });
function box(w, h, d, c, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP(c, o)); m.castShadow = m.receiveShadow = true; return m; }

function makeSpider() {
  const g = new THREE.Group();
  const black = LP('#1E1A24'), red = LP('#E2473D');
  const abd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), black); abd.scale.set(1, 0.85, 1.2); abd.position.z = -0.2; g.add(abd);
  const mark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), red); mark.position.set(0, 0.12, -0.22); g.add(mark);
  const ceph = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), black); ceph.position.z = 0.02; g.add(ceph);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), LP('#FFFFFF')); e.position.set(s * 0.04, 0.06, 0.1); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), black); p.position.set(s * 0.04, 0.065, 0.125); g.add(p); }
  const legs = [];
  const tipM = new THREE.MeshStandardMaterial({ color: '#1E1A24', emissive: '#FFD23C', emissiveIntensity: 0 });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.07, 0, 0.06 - i * 0.06); hip.rotation.y = s * (-0.9 + i * 0.55); g.add(hip);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), black); a.rotation.z = s * -1.0; a.position.set(s * 0.085, 0.05, 0); hip.add(a);
    const knee = new THREE.Group(); knee.position.set(s * 0.17, 0.1, 0); hip.add(knee);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.008, 0.24, 5), black); b.rotation.z = s * 0.45; b.position.set(s * 0.05, -0.11, 0); knee.add(b);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), tipM); tip.position.set(s * 0.1, -0.22, 0); knee.add(tip);
    legs.push({ hip, knee, s, i });
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.walk = (ph, amt = 1) => legs.forEach(({ hip, s, i }) => { const p = ph + (i % 2) * Math.PI + (s > 0 ? Math.PI : 0); hip.rotation.x = Math.sin(p) * 0.25 * amt; hip.position.y = Math.max(0, Math.cos(p)) * 0.02 * amt; });
  g.userData.tipM = tipM;
  return g;
}

export async function build(scene, camera0, C) {
  const w = C.w;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.environment = null;
  scene.background = new THREE.Color('#1B1F44');
  const font = await new Promise((res) => new FontLoader().load('/node_modules/three/examples/fonts/helvetiker_bold.typeface.json', res));
  const text3d = (txt, size, color, depth = 0.25) => {
    const geo = new TextGeometry(txt, { font, size, depth, curveSegments: 4, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1 });
    geo.center();
    const m = new THREE.Mesh(geo, LP(color, { emissive: color, emissiveIntensity: 0.45 })); return m;
  };

  // ---------- Caméra orthographique (vue isométrique) ----------
  const VH = 9;
  const cam = new THREE.OrthographicCamera(-VH * W / H / 2, VH * W / H / 2, VH / 2, -VH / 2, 0.1, 200);

  // ---------- Diorama : chambre flottante ----------
  const room = new THREE.Group(); scene.add(room);
  const slab = box(6, 0.5, 6, '#8C5A3C'); slab.position.y = -0.25; room.add(slab);
  const floorTop = box(5.9, 0.06, 5.9, '#C88A5A'); floorTop.position.y = 0.03; room.add(floorTop);
  for (let i = 0; i < 7; i++) { const plank = box(0.02, 0.065, 5.9, '#A56E45'); plank.position.set(-2.95 + i * 0.84 + 0.42, 0.035, 0); room.add(plank); }
  const wallB = box(6, 4, 0.3, '#6F7FD6'); wallB.position.set(0, 2, -2.85); room.add(wallB);
  const wallL = box(0.3, 4, 6, '#5E6DC4'); wallL.position.set(-2.85, 2, 0); room.add(wallL);
  // fenêtre + lune
  const win = box(1.6, 1.3, 0.05, '#0E1230', { emissive: '#1A2260', emissiveIntensity: 0.6 }); win.position.set(0.9, 2.4, -2.68); room.add(win);
  const frameM = '#F3E9DC';
  for (const [x, y, ww, hh] of [[0.9, 3.08, 1.72, 0.08], [0.9, 1.72, 1.72, 0.08], [0.06, 2.4, 0.08, 1.4], [1.74, 2.4, 0.08, 1.4], [0.9, 2.4, 0.06, 1.3]]) { const f = box(ww, hh, 0.1, frameM); f.position.set(x, y, -2.65); room.add(f); }
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#FFE79A', emissiveIntensity: 1.2, flatShading: true })); moon.position.set(1.3, 2.7, -2.62); room.add(moon);
  const starsM = new THREE.MeshBasicMaterial({ color: '#FFF6D8' });
  const R = rng(4); const stars = [];
  for (let i = 0; i < 40; i++) { const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.04 + R() * 0.05, 0), starsM); st.position.set((R() - 0.5) * 30, (R() - 0.2) * 20, -15 - R() * 10); scene.add(st); stars.push(st); }
  // lit
  const bed = new THREE.Group(); bed.position.set(-1.1, 0, -0.6); room.add(bed);
  const frame = box(1.9, 0.45, 3.0, '#E9C79B'); frame.position.y = 0.3; bed.add(frame);
  const head = box(1.9, 1.3, 0.15, '#D9A877'); head.position.set(0, 0.7, -1.5); bed.add(head);
  const matt = box(1.8, 0.22, 2.85, '#FFFFFF'); matt.position.y = 0.63; bed.add(matt);
  const pillow = box(1.0, 0.2, 0.5, '#F6F2FF'); pillow.position.set(0, 0.82, -1.05); bed.add(pillow);
  const blanket = box(1.86, 0.18, 1.95, '#F28C8C'); blanket.position.set(0, 1.12, 0.45); bed.add(blanket);
  const fold = box(1.86, 0.2, 0.25, '#FFD1D1'); fold.position.set(0, 1.15, -0.5); bed.add(fold);
  // dormeur (personnage couché sur le dos)
  const sleeper = makeCharacter(LP, { skin: '#F4C7A1', shirt: '#7FC8A9', pants: '#3D5A98', hair: '#3A2A22' });
  sleeper.rotation.x = -Math.PI / 2; sleeper.position.set(0, 0.98, 0.42); sleeper.scale.setScalar(0.8); bed.add(sleeper);
  sleeper.pose({ arms: [{ z: 0.05 }, { z: 0.05 }] });
  // table de nuit + lampe
  const ns = box(0.7, 0.7, 0.6, '#B07A50'); ns.position.set(0.35, 0.35, -1.9); room.add(ns);
  const lampFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.4, 6), LP('#2E2E3A')); lampFoot.position.set(0.35, 0.9, -1.9); room.add(lampFoot);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 0.3, 6), LP('#FFE0A3', { emissive: '#FFB64A', emissiveIntensity: 0.9 })); shade.position.set(0.35, 1.2, -1.9); room.add(shade);
  const lampLight = new THREE.PointLight('#FFB85A', 6, 6, 1.6); lampLight.position.set(0.35, 1.25, -1.6); lampLight.castShadow = true; lampLight.shadow.mapSize.set(1024, 1024); room.add(lampLight);
  // tapis, plante, étagère
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.03, 8), LP('#F7D57A')); rug.position.set(1.3, 0.07, 1.2); rug.receiveShadow = true; room.add(rug);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.35, 6), LP('#E2734A')); pot.position.set(2.3, 0.24, -2.2); room.add(pot);
  for (let i = 0; i < 5; i++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 4), LP('#3FA56B')); lf.position.set(2.3 + Math.sin(i * 1.3) * 0.15, 0.7, -2.2 + Math.cos(i * 1.3) * 0.15); lf.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i * 2) * 0.4); room.add(lf); }
  const shelf = box(0.25, 0.08, 1.4, '#D9A877'); shelf.position.set(-2.62, 2.6, 1.2); room.add(shelf);
  for (let i = 0; i < 4; i++) { const bk = box(0.18, 0.4 + (i % 2) * 0.1, 0.12, ['#F25C54', '#8FB8F2', '#F7D57A', '#C58FF2'][i]); bk.position.set(-2.62, 2.85, 0.75 + i * 0.18); room.add(bk); }
  // poutre d'où descend l'araignée
  const beam = box(0.2, 0.2, 6, '#8C5A3C'); beam.position.set(-1.1, 4.1, 0); room.add(beam);

  // ---------- Lumières de nuit ----------
  scene.add(new THREE.HemisphereLight('#8E9CFF', '#3A2A4A', 1.2));
  const moonL = new THREE.DirectionalLight('#B9C6FF', 1.6); moonL.position.set(4, 9, 6); moonL.castShadow = true; moonL.shadow.mapSize.set(2048, 2048);
  Object.assign(moonL.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 }); moonL.shadow.radius = 3; scene.add(moonL);

  // ---------- Araignée + fil ----------
  const spider = makeSpider(); room.add(spider);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), new THREE.MeshBasicMaterial({ color: '#E8ECFF' })); room.add(thread);

  // ---------- Objets d'explication ----------
  const eight = text3d('8', 1.1, '#F7D57A'); room.add(eight);
  const perYear = text3d('/ an', 0.4, '#F7D57A', 0.12); room.add(perYear);
  const cross = new THREE.Group(); room.add(cross);
  for (const s of [1, -1]) { const b = box(2.2, 0.28, 0.2, '#F04A4A', { emissive: '#F04A4A', emissiveIntensity: 0.5 }); b.castShadow = false; b.rotation.z = s * 0.8; cross.add(b); }
  const board = new THREE.Group(); room.add(board);
  const clip = box(1.6, 1.1, 0.08, '#B07A50'); clip.castShadow = false; board.add(clip);
  const paper = box(1.4, 0.95, 0.02, '#FFFFFF'); paper.position.z = 0.05; board.add(paper);
  const l1 = makeLabel(1.3, 0.3, { color: '#2A2A30', px: 120 }); l1.position.set(0, 0.2, 0.07); board.add(l1); l1.setText('ÉTUDES : 0');
  const l2 = makeLabel(1.3, 0.3, { color: '#F04A4A', px: 120 }); l2.position.set(0, -0.2, 0.07); board.add(l2); l2.setText('CAS : 0');
  const warn = new THREE.Group(); room.add(warn);
  const triShape = new THREE.Shape(); triShape.moveTo(0, 0.55); triShape.lineTo(0.5, -0.32); triShape.lineTo(-0.5, -0.32); triShape.closePath();
  const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape, { depth: 0.12, bevelEnabled: false }), LP('#FFC72C', { emissive: '#FFC72C', emissiveIntensity: 0.4 })); tri.position.z = -0.06; warn.add(tri);
  const ex = text3d('!', 0.5, '#2A2A30', 0.06); ex.position.set(0, -0.02, 0.1); warn.add(ex);
  const heart = new THREE.Group(); room.add(heart);
  const hs = new THREE.Shape(); hs.moveTo(0, -0.3); hs.bezierCurveTo(-0.5, 0.05, -0.3, 0.42, 0, 0.18); hs.bezierCurveTo(0.3, 0.42, 0.5, 0.05, 0, -0.3);
  const hm = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 }), LP('#F04A4A', { emissive: '#801010', emissiveIntensity: 0.5 })); heart.add(hm);
  const zs = [0, 1, 2].map((i) => { const z = text3d('Z', 0.3 - i * 0.05, '#DDE3FF', 0.06); room.add(z); return z; });
  const breath = Array.from({ length: 6 }, () => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), LP('#FFD9A8', { transparent: true })); room.add(b); return b; });
  const rings = Array.from({ length: 4 }, () => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 4, 32), new THREE.MeshBasicMaterial({ color: '#9FE8FF', transparent: true })); r.rotation.x = Math.PI / 2; room.add(r); return r; });
  const die = new THREE.Group(); room.add(die);
  const dieBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), LP('#FFFFFF')); dieBody.castShadow = true; die.add(dieBody);
  const pipM = LP('#2A2A30');
  const pips = { 0: [[0, 0]], 1: [[-0.15, -0.15], [0.15, 0.15]], 2: [[-0.15, -0.15], [0, 0], [0.15, 0.15]], 3: [[-0.15, -0.15], [0.15, 0.15], [-0.15, 0.15], [0.15, -0.15]], 4: [[-0.15, -0.15], [0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [0, 0]], 5: [[-0.15, -0.15], [0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, 0], [0.15, 0]] };
  const faces = [[V(0, 0, 0.301), V(0, 0, 0)], [V(0, 0, -0.301), V(0, Math.PI, 0)], [V(0.301, 0, 0), V(0, Math.PI / 2, 0)], [V(-0.301, 0, 0), V(0, -Math.PI / 2, 0)], [V(0, 0.301, 0), V(-Math.PI / 2, 0, 0)], [V(0, -0.301, 0), V(Math.PI / 2, 0, 0)]];
  faces.forEach(([p, r], fi) => { const f = new THREE.Group(); f.position.copy(p); f.rotation.set(r.x, r.y, r.z); die.add(f); pips[fi].forEach(([x, y]) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10), pipM); d.rotation.x = Math.PI / 2; d.position.set(x, y, 0); f.add(d); }); });
  const spark = new Sparkles(scene, 18, '#FFF3B0');

  // ---------- Trajet de l'araignée ----------
  const tIn = w('hook1', 6) - 0.2, tTurn = w('s5', 3) - 0.2;
  const BED = (x, z) => V(bed.position.x + x, 1.0, bed.position.z + z);
  // descente sur le fil puis marche sur la couverture vers le visage, demi-tour, remontée
  const spiderPos = (t) => {
    if (t < tIn) return V(-1.1, 4.0, 1.4);
    if (t < tIn + 1.0) return V(-1.1, lerp(4.0, 1.0, easeOut(prog(t, tIn, 1.0))), 1.4);
    if (t < tTurn) { const k = easeInOut(prog(t, tIn + 1.0, tTurn - tIn - 1.0)); return BED(0.0, lerp(2.0, -0.3, Math.min(1, k * 1.25))).add(V(0, 0.25, 0)); }
    const k = easeInOut(prog(t, tTurn + 0.4, 1.4));
    if (k < 0.6) return BED(0.0, lerp(-0.3, 2.0, k / 0.6)).add(V(0, 0.25, 0));
    return V(-1.1, lerp(1.0, 4.2, (k - 0.6) / 0.4), 1.4);
  };

  // ---------- Caméra : orbite isométrique continue ----------
  const yaw = keyTrack([[0, 0.62], [C.duration, 1.05]], (x) => x);
  const zoom = keyTrack([[0, 1.15], [w('hook1', 6), 1.5], [w('hook2', 0), 1.25], [C.seg('s1'), 1.0], [C.seg('s2'), 1.9], [w('s3', 0), 1.35], [C.seg('s4'), 2.4], [w('s5', 3) + 0.6, 1.6], [C.seg('s6'), 1.2], [C.seg('end1'), 1.0], [C.duration, 0.95]]);
  const focus = keyTrack([[0, [-0.9, 1.4, -0.8]], [w('hook1', 6), [-1.1, 1.6, 0.4]], [w('hook1', 12), [-0.9, 2.2, 0.2]], [C.seg('s1'), [0.0, 2.0, 0.6]], [C.seg('s2'), [-1.1, 1.6, -0.3]], [w('s3', 0), [-1.0, 1.5, -1.0]], [C.seg('s4'), [-1.1, 1.3, -0.7]], [w('s5', 3) + 0.6, [-1.1, 1.8, 0.8]], [C.seg('s6'), [0.6, 1.6, 0.8]], [C.seg('end1'), [0, 1.6, 0]], [C.duration, [0, 1.6, 0]]]);
  const shakes = [[w('hook2', 3), 0.06], [w('s3', 13), 0.05]];

  // ---------- Bruitages ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  S(0.05, 'snore', 0.8); S(w('hook1', 2), 'pop', 0.7); S(tIn, 'slide', 0.8); S(tIn + 1.0, 'tick', 0.7); for (let i = 0; i < 5; i++) S(tIn + 1.2 + i * 0.22, 'tick', 0.5);
  S(w('hook1', 12), 'stamp', 1); S(w('hook1', 14), 'pop');
  S(w('hook2', 3), 'stamp', 1); S(w('hook2', 3), 'scratch', 0.8);
  S(w('s1', 4), 'pop'); S(w('s1', 5), 'tick', 0.7); S(w('s1', 12), 'tick', 0.7);
  S(w('s2', 0), 'whoosh', 0.7); S(w('s2', 7), 'pop'); S(w('s2', 7), 'beep', 0.5);
  S(w('s3', 1), 'whoosh', 0.6); S(w('s3', 7), 'heartbeat', 1); S(w('s3', 7) + 0.8, 'heartbeat', 0.8); S(w('s3', 9), 'snore', 1); S(w('s3', 13), 'boing', 0.6); S(w('s3', 13), 'hum', 0.8);
  S(C.seg('s4'), 'whoosh', 0.7); S(w('s4', 8), 'sparkle', 0.7);
  S(tTurn + 0.3, 'slide', 0.9); S(tTurn + 1.0, 'whoosh', 0.6);
  S(w('s6', 0), 'pop'); S(w('s6', 0) + 0.1, 'clank', 0.6); S(w('s6', 0) + 0.6, 'clank', 0.4); S(w('s6', 8), 'ding', 0.6);
  S(w('end1', 0), 'sparkle', 0.9); S(w('end1', 0), 'whoosh_long', 0.6); S(w('end1', -1), 'ding', 0.9);

  const faceCam = (o) => o.quaternion.copy(cam.quaternion);
  const show = (o, s, k = 1) => { o.visible = s > 0.001; o.scale.setScalar(Math.max(0.001, s * k)); };
  const tVib = w('s3', 13);

  function update(t) {
    // caméra
    const f = V(...focus(t));
    let sh = 0; for (const [t0, a] of shakes) { const x = (t - t0) / 0.4; if (x > 0 && x < 1) sh += a * (1 - x) * (1 - x); }
    const y = yaw(t) + Math.sin(t * 0.7) * 0.02, pitch = 0.58;
    cam.position.set(f.x + Math.sin(y) * Math.cos(pitch) * 30 + Math.sin(t * 90) * sh, f.y + Math.sin(pitch) * 30 + Math.cos(t * 70) * sh, f.z + Math.cos(y) * Math.cos(pitch) * 30);
    cam.lookAt(f); cam.zoom = zoom(t); cam.updateProjectionMatrix();

    // dormeur : respiration, bouche ouverte, sourire final
    const br = Math.sin(t * 2.2);
    sleeper.userData.parts.torso.scale.set(1, 1, 1 + br * 0.03);
    sleeper.face({ eyes: 0.02, mouth: t < C.seg('end1') ? 0.75 + br * 0.15 : 0.25, smile: t > C.seg('end1') ? 0.8 : 0 });
    const vib = t > tVib && t < C.seg('s5') ? Math.sin(t * 70) * 0.012 : 0;
    bed.position.x = -1.1 + vib;

    // araignée
    const p = spiderPos(t);
    spider.position.copy(p);
    const onThread = t < tIn + 1.0 || (t > tTurn + 0.4 && prog(t, tTurn + 0.4, 1.4) > 0.6);
    const facing = t < tTurn ? Math.PI : t < tTurn + 0.4 ? Math.PI + Math.PI * easeInOut(prog(t, tTurn, 0.4)) : 0;
    spider.rotation.set(onThread ? -Math.PI / 2 * (t < tIn + 1.0 ? 1 : -1) * 0 : 0, facing, 0);
    const moving = !onThread && (t > tIn + 1.0 && t < tTurn - 0.3 || t > tTurn + 0.4);
    spider.walk(t * 22, moving ? 1 : 0.2);
    spider.scale.setScalar(1.15);
    const top = 4.0;
    thread.visible = onThread && t > tIn - 0.05;
    thread.scale.y = Math.max(0.001, top - p.y); thread.position.set(p.x, (top + p.y) / 2 + 0.1, p.z);
    spider.userData.tipM.emissiveIntensity = t > w('s4', 5) - 0.2 && t < tTurn + 0.5 ? 1.5 + Math.sin(t * 20) * 0.5 : 0;

    // « 8 / an » puis grande croix rouge
    const s8 = life(t, w('hook1', 12) - 0.05, C.segEnd('hook2') + 0.6);
    show(eight, s8); eight.position.set(-1.1, 2.9, 0.6); faceCam(eight);
    show(perYear, s8); perYear.position.copy(eight.position).add(V(0.85, -0.35, 0).applyQuaternion(cam.quaternion)); faceCam(perYear);
    const sx = life(t, w('hook2', 3) - 0.02, C.segEnd('hook2') + 0.6, 0.3);
    show(cross, sx); cross.position.copy(eight.position).add(V(0, 0, 0.4).applyQuaternion(cam.quaternion)); faceCam(cross);
    // tableau « 0 étude / 0 cas »
    const sb = life(t, w('s1', 4) - 0.1, C.segEnd('s1') + 0.3);
    show(board, sb); board.position.set(0.2, 2.3, 1.1); faceCam(board);
    l2.visible = t > w('s1', 11) - 0.1;
    // danger !
    const sw = life(t, w('s2', 7) - 0.1, C.segEnd('s2') + 0.4);
    show(warn, sw * (1 + 0.08 * Math.sin(t * 12))); warn.position.copy(p).add(V(0, 0.75, 0)); faceCam(warn);
    // souffle, cœur, ronflements
    breath.forEach((b, i) => {
      const u = ((t - w('s3', 1)) * 0.9 + i / breath.length) % 1;
      const on = t > w('s3', 1) && t < C.seg('s4');
      b.visible = on; b.position.copy(BED(0, -1.05)).add(V(0, 0.4 + u * 0.8, u * 0.4)); b.scale.setScalar(on ? (0.5 + u) : 0.001); b.material.opacity = 1 - u;
    });
    const sHeart = life(t, w('s3', 7) - 0.1, C.seg('s4') + 0.2);
    const beat = 1 + 0.18 * Math.max(0, Math.sin(t * 7.5)) ** 8;
    show(heart, sHeart * beat, 0.8); heart.position.copy(BED(0.35, 0.1)).add(V(0, 0.5, 0)); faceCam(heart);
    zs.forEach((z, i) => {
      const u = ((t * 0.5) + i / 3) % 1;
      const on = (t > w('s3', 9) - 0.1 && t < C.seg('s4')) || t < w('hook1', 4) || t > C.seg('end1');
      z.visible = on; z.position.copy(BED(-0.2, -1.1)).add(V(0.2 + u * 0.5, 0.3 + u * 1.2, 0)); z.scale.setScalar(on ? Math.sin(u * Math.PI) + 0.001 : 0.001); faceCam(z);
    });
    // ondes de vibration sur le lit
    rings.forEach((r, i) => {
      const u = ((t - tVib) * 0.7 + i / rings.length) % 1;
      const on = t > tVib && t < tTurn + 0.6;
      r.visible = on; const rad = 0.2 + u * 2.4; r.scale.setScalar(rad); r.position.copy(BED(0, 0.2)).add(V(0, 0.2, 0)); r.material.opacity = (1 - u) * 0.9;
    });
    // dé : « pur accident »
    const sd = life(t, w('s6', 0) - 0.05, C.segEnd('s6') + 0.4);
    show(die, sd); const dy = drop(t, w('s6', 0), 0.55);
    die.position.set(1.3, 0.35 + dy * 2.4, 1.2); const roll = easeOut(prog(t, w('s6', 0), 1.1));
    die.rotation.set(roll * 7.2, roll * 3.1, roll * 4.4 + Math.PI / 2);
    // étoiles
    stars.forEach((s, i) => { s.scale.setScalar(0.7 + 0.5 * Math.sin(t * 2 + i)); });
    if (t > w('s4', 8) - 0.1 && t < w('s4', 8) + 1.1) spark.burst(t, w('s4', 8), p.clone(), 0.35, 1.0, 0.1);
    else if (t > w('end1', 0)) spark.burst(t, w('end1', 0), BED(0, -0.4).add(V(0, 0.9, 0)), 1.4, 1.6, 0.18);
    else spark.hide();
    shade.material.emissiveIntensity = t > C.seg('end1') ? lerp(0.9, 0.25, prog(t, w('end1', 2), 1)) : 0.9;
    lampLight.intensity = t > C.seg('end1') ? lerp(6, 1.5, prog(t, w('end1', 2), 1)) : 6;
  }
  return { update, sfx, camera: cam };
}
