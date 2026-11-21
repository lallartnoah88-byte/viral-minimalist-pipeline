// Vidéo 05 — « Charger son téléphone toute la nuit abîme-t-il la batterie ? » — style NÉON SYNTHWAVE (bloom).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CameraRig, life, prog, smooth, easeInOut, easeOut, drop, lerp, clamp, rng } from '../lib/core.js';
import { neonMat, neonEdges, neonTube, makeBloomRenderer } from '../lib/styles.js';
import { BeadFlow } from '../lib/props.js';

const PINK = '#FF2BD6', CYAN = '#22E8FF', YEL = '#FFE14D', GREEN = '#39FF88', RED = '#FF3344', ORANGE = '#FF8A2B', VIOLET = '#9B5CFF';

/** pictogramme néon dessiné sur canvas (traits lumineux), affiché sur un plan additif */
function neonIcon(draw, size = 1, res = 512) {
  const c = document.createElement('canvas'); c.width = c.height = res;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: new THREE.Color(1.25, 1.25, 1.25) }));
  let last = null;
  m.redraw = (...args) => {
    const key = JSON.stringify(args);
    if (key === last) return; last = key;
    ctx.clearRect(0, 0, res, res);
    ctx.save(); ctx.translate(res / 2, res / 2); ctx.lineCap = ctx.lineJoin = 'round';
    draw(ctx, res, ...args);
    ctx.restore(); tex.needsUpdate = true;
  };
  m.redraw();
  return m;
}
const glow = (ctx, col, lw) => { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.shadowBlur = 0; };

export async function build(scene, camera, C, renderer) {
  const w = C.w;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.environment = null;
  scene.background = new THREE.Color('#05020C');
  scene.fog = new THREE.Fog('#05020C', 18, 70);

  // ---------- Décor synthwave ----------
  const grid = new THREE.Group(); scene.add(grid);
  const gm = new THREE.LineBasicMaterial({ color: new THREE.Color(PINK).multiplyScalar(0.9), toneMapped: false });
  const gpts = [];
  for (let i = -20; i <= 20; i++) { gpts.push(i * 2, 0, -80, i * 2, 0, 12); }
  for (let j = 0; j <= 46; j++) { gpts.push(-40, 0, 12 - j * 2, 40, 0, 12 - j * 2); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gpts, 3));
  grid.add(new THREE.LineSegments(gg, gm));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: '#0A0418' }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.01; scene.add(floor);
  // soleil rétro rayé
  const sunC = document.createElement('canvas'); sunC.width = sunC.height = 512;
  { const x = sunC.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#FFE14D'); gr.addColorStop(0.55, '#FF5FA2'); gr.addColorStop(1, '#B026FF');
    x.fillStyle = gr; x.beginPath(); x.arc(256, 256, 250, 0, Math.PI * 2); x.fill();
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 7; i++) x.fillRect(0, 300 + i * 30, 512, 6 + i * 2.5); }
  const sunTex = new THREE.CanvasTexture(sunC); sunTex.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, toneMapped: false, color: new THREE.Color(0.95, 0.95, 0.95), fog: false }));
  sun.position.set(0, 2, -70); scene.add(sun);
  // montagnes filaires
  const mg = new THREE.PlaneGeometry(140, 24, 40, 8); const R = rng(17);
  const pa = mg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); const k = (y + 12) / 24; pa.setZ(i, k > 0.05 ? R() * 7 * (1 - Math.abs(pa.getX(i)) / 160) * k : 0); }
  mg.computeVertexNormals();
  const mount = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: new THREE.Color(VIOLET).multiplyScalar(1.2), wireframe: true, toneMapped: false }));
  mount.rotation.x = -Math.PI / 2; mount.position.set(0, 0, -55); scene.add(mount);
  const starPts = []; for (let i = 0; i < 300; i++) starPts.push((R() - 0.5) * 160, 6 + R() * 50, -60 - R() * 20);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.25, toneMapped: false, fog: false })));

  // ---------- Téléphone néon ----------
  const phone = new THREE.Group(); phone.position.set(0, 2.3, 0); scene.add(phone);
  const bodyGeo = new RoundedBoxGeometry(1.3, 2.6, 0.14, 4, 0.16);
  phone.add(new THREE.Mesh(bodyGeo, new THREE.MeshBasicMaterial({ color: '#07060F' })));
  // contour du téléphone : tube néon le long d'un rectangle arrondi
  const rr = (ww, hh, r, z) => { const pts = []; const cs = [[ww / 2 - r, hh / 2 - r, 0], [-ww / 2 + r, hh / 2 - r, Math.PI / 2], [-ww / 2 + r, -hh / 2 + r, Math.PI], [ww / 2 - r, -hh / 2 + r, Math.PI * 1.5]];
    for (const [cx, cy, a0] of cs) for (let k = 0; k <= 8; k++) { const a = a0 + k / 8 * Math.PI / 2; pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.025, 8, true), neonMat(CYAN, 1.6)); };
  phone.add(rr(1.3, 2.6, 0.16, 0.08));
  const notch = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.25, 4, 8), neonMat(CYAN, 1.2)); notch.rotation.z = Math.PI / 2; notch.position.set(0, 1.12, 0.08); phone.add(notch);
  const screen = neonIcon((ctx, r, pct = 100, col = GREEN, crack = 0) => {
    // pictogramme batterie + pourcentage
    glow(ctx, col, 10);
    ctx.strokeRect(-110, -170, 220, 120); ctx.fillRect(110, -135, 18, 50);
    ctx.globalAlpha = 0.85; ctx.fillRect(-98, -158, 196 * pct / 100, 96); ctx.globalAlpha = 1;
    ctx.font = '900 110px MontserratBlack'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(pct)}%`, 0, 60);
    if (crack > 0) { glow(ctx, RED, 14); ctx.globalAlpha = crack; ctx.beginPath(); ctx.moveTo(-150, -200); ctx.lineTo(150, 160); ctx.moveTo(150, -200); ctx.lineTo(-150, 160); ctx.stroke(); }
  }, 1.15);
  screen.position.z = 0.08; phone.add(screen);
  // prise + câble + électrons
  const plug = new THREE.Group(); scene.add(plug);
  const plugGeo = new THREE.BoxGeometry(0.34, 0.5, 0.2);
  plug.add(new THREE.Mesh(plugGeo, new THREE.MeshBasicMaterial({ color: '#07060F' }))); plug.add(neonEdges(plugGeo, YEL, 3, 30));
  const cableBase = [[0, 0.75, 0.0], [0.0, 0.35, 0.2], [0.6, 0.1, 0.6], [1.8, 0.1, 0.8], [3.2, 0.1, 0.2], [4.2, 0.1, -0.8]];
  const cable = neonTube(cableBase, YEL, 0.025, 1.2); scene.add(cable);
  const elec = new BeadFlow(scene, cableBase, { color: '#FFF27A', n: 26, r: 0.035, halo: 0.1 });

  // ---------- Grande batterie ----------
  const bat = new THREE.Group(); bat.position.set(2.5, 2.2, -0.7); bat.scale.setScalar(0.75); scene.add(bat);
  const batGeo = new THREE.BoxGeometry(1.1, 2.4, 0.9);
  bat.add(new THREE.Mesh(batGeo, new THREE.MeshBasicMaterial({ color: '#07060F', transparent: true, opacity: 0.7 })));
  bat.add(neonEdges(batGeo, CYAN, 2, 30));
  const capGeo = new THREE.BoxGeometry(0.45, 0.18, 0.4); const cap = neonEdges(capGeo, CYAN, 3, 30); cap.position.y = 1.29; bat.add(cap);
  const fillM = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.55, toneMapped: false });
  const segs = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.17, 0.66), fillM); m.position.y = -1.0 + i * 0.22; bat.add(m); return m; });
  const mark80 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 0.03), neonMat(PINK, 3)); mark80.position.y = -1.1 + 2.2 * 0.8; bat.add(mark80);
  const batLbl = neonIcon((ctx, r, txt = '100%', col = GREEN) => { glow(ctx, col, 6); ctx.font = '900 150px MontserratBlack'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 0); }, 1.4);
  batLbl.position.set(0, 1.85, 0.3); bat.add(batLbl);
  const setBat = (pct, col) => {
    const k = clamp(pct / 100); segs.forEach((m, i) => { const f = clamp(k * 10 - i); m.visible = f > 0.02; m.scale.y = Math.max(0.001, f); }); fillM.color.set(col).multiplyScalar(1.1);
    batLbl.redraw(`${Math.round(pct)}%`, col);
  };

  // ---------- Pictogrammes néon ----------
  const moon = neonIcon((ctx) => { glow(ctx, YEL, 12); ctx.beginPath(); ctx.arc(0, 0, 150, 0.6, Math.PI * 2 - 0.6); ctx.arc(70, 0, 120, Math.PI * 2 - 0.95, 0.95, true); ctx.closePath(); ctx.stroke(); glow(ctx, '#FFFFFF', 6); [[-170, -150], [160, -170], [190, 120]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.stroke(); }); }, 1.4); scene.add(moon);
  const skull = neonIcon((ctx) => { glow(ctx, RED, 12); ctx.beginPath(); ctx.arc(0, -40, 120, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(70, 120); ctx.lineTo(-70, 120); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(-50, -30, 32, 0, 7); ctx.arc(50, -30, 32, 0, 7); ctx.fill(); [-30, 0, 30].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 120); ctx.stroke(); }); }, 1.2); scene.add(skull);
  const therm = neonIcon((ctx, r, lvl = 0.3) => { glow(ctx, '#FFFFFF', 10); ctx.beginPath(); ctx.arc(0, 150, 55, -1.1, Math.PI + 1.1); ctx.lineTo(-28, -170); ctx.arc(0, -170, 28, Math.PI, 0); ctx.closePath(); ctx.stroke(); const col = lvl > 0.6 ? RED : ORANGE; glow(ctx, col, 8); ctx.beginPath(); ctx.arc(0, 150, 36, 0, 7); ctx.fill(); ctx.fillRect(-12, 150 - 300 * lvl, 24, 300 * lvl); }, 1.4); scene.add(therm);
  const clock = neonIcon((ctx, r, a = 0, col = VIOLET, ring = 0) => { glow(ctx, col, 12); ctx.beginPath(); ctx.arc(0, 20, 150, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(Math.sin(a) * 110, 20 - Math.cos(a) * 110); ctx.moveTo(0, 20); ctx.lineTo(Math.sin(a / 12) * 70, 20 - Math.cos(a / 12) * 70); ctx.stroke(); if (ring > 0) { ctx.beginPath(); ctx.arc(-110, -130, 45, Math.PI, 0); ctx.arc(110, -130, 45, Math.PI, 0); ctx.stroke(); glow(ctx, YEL, 6); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 20, 190 + i * 25 + ring * 20, -2.4, -0.7); ctx.stroke(); } } }, 1.5); scene.add(clock);
  const shield = neonIcon((ctx) => { glow(ctx, GREEN, 12); ctx.beginPath(); ctx.moveTo(0, -180); ctx.lineTo(150, -120); ctx.quadraticCurveTo(150, 90, 0, 190); ctx.quadraticCurveTo(-150, 90, -150, -120); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-10, 55); ctx.lineTo(75, -55); ctx.stroke(); }, 1.3); scene.add(shield);
  const pillow = neonIcon((ctx) => { glow(ctx, '#FFFFFF', 12); ctx.beginPath(); ctx.moveTo(-210, -90); ctx.quadraticCurveTo(0, -140, 210, -90); ctx.quadraticCurveTo(240, 0, 210, 90); ctx.quadraticCurveTo(0, 140, -210, 90); ctx.quadraticCurveTo(-240, 0, -210, -90); ctx.stroke(); }, 2.4); scene.add(pillow);
  const flame = neonIcon((ctx) => { glow(ctx, ORANGE, 12); ctx.beginPath(); ctx.moveTo(0, -190); ctx.bezierCurveTo(120, -60, 150, 60, 0, 170); ctx.bezierCurveTo(-150, 60, -110, -40, -30, -90); ctx.bezierCurveTo(-30, -20, 10, 0, 0, -190); ctx.stroke(); }, 1.3); scene.add(flame);
  const xMark = neonIcon((ctx) => { glow(ctx, RED, 18); ctx.beginPath(); ctx.moveTo(-170, -170); ctx.lineTo(170, 170); ctx.moveTo(170, -170); ctx.lineTo(-170, 170); ctx.stroke(); }, 1.6); scene.add(xMark);
  const heart = neonIcon((ctx) => { glow(ctx, PINK, 12); ctx.beginPath(); ctx.moveTo(0, 150); ctx.bezierCurveTo(-260, -20, -120, -220, 0, -80); ctx.bezierCurveTo(120, -220, 260, -20, 0, 150); ctx.stroke(); }, 1.4); scene.add(heart);
  const heatWaves = Array.from({ length: 6 }, (_, i) => { const h = neonIcon((ctx) => { glow(ctx, ORANGE, 8); ctx.beginPath(); for (let y = 160; y > -160; y -= 8) ctx.lineTo(Math.sin(y / 30) * 30, y); ctx.stroke(); }, 0.8); scene.add(h); return h; });
  const confetti = Array.from({ length: 80 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), neonMat([PINK, CYAN, YEL, GREEN, VIOLET][i % 5], 2.5)); m.visible = false; scene.add(m); return m; });
  const cR = rng(8); const cS = confetti.map(() => [cR() * 2 - 1, cR(), cR() * 2 - 1, cR() * 6]);

  // ---------- Caméra ----------
  const keys = [
    { t: 0, pos: [0.6, 3.0, 6.0], look: [0.3, 2.0, 0], fov: 38 },
    { t: w('hook1', 5), pos: [-0.6, 3.2, 6.6], look: [-0.4, 2.4, 0], fov: 38 },
    { t: w('hook1', 12), pos: [0.0, 3.6, 7.6], look: [0.0, 2.8, -1], fov: 40 },
    { t: w('hook2', 2), pos: [0.2, 2.6, 5.6], look: [0.2, 2.3, 0], fov: 38 },
    { t: C.seg('s1') + 0.4, pos: [2.0, 2.7, 5.8], look: [1.6, 2.2, -0.2], fov: 38 },
    { t: C.seg('s2'), pos: [2.6, 2.5, 4.9], look: [2.4, 2.3, -0.4], fov: 38 },
    { t: w('s3', 6), pos: [3.2, 2.6, 5.4], look: [3.0, 2.4, -0.4], fov: 38 },
    { t: w('s3', 15), pos: [1.8, 2.8, 5.8], look: [1.7, 2.4, -0.4], fov: 38 },
    { t: w('s4', 10), pos: [1.0, 2.9, 6.2], look: [1.1, 2.5, -0.4], fov: 38 },
    { t: w('s4', 16), pos: [2.4, 2.6, 5.2], look: [2.3, 2.3, -0.4], fov: 38 },
    { t: C.segEnd('s4'), pos: [1.0, 2.7, 6.0], look: [1.0, 2.4, -0.4], fov: 38 },
    { t: w('s5', 9), pos: [0.2, 2.8, 5.4], look: [0.1, 2.3, 0], fov: 38 },
    { t: w('s5', 14), pos: [0.6, 2.9, 5.8], look: [0.5, 2.4, 0], fov: 38 },
    { t: w('end1', 1), pos: [1.3, 3.6, 8.6], look: [1.2, 2.5, -1], fov: 40 },
    { t: C.duration, pos: [1.3, 3.9, 9.4], look: [1.2, 2.6, -1], fov: 40 },
  ];
  const rig = new CameraRig(camera, keys);
  rig.addShake(w('hook1', 15), 0.08, 0.5); rig.addShake(w('hook2', 2), 0.06, 0.4); rig.addShake(w('s5', 9), 0.05, 0.4);

  // ---------- Bruitages ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  S(0.0, 'hum', 0.8); S(w('hook1', 0) + 0.15, 'click', 1); S(w('hook1', 0) + 0.2, 'zap', 0.9); S(w('hook1', 3), 'whoosh', 0.6); S(w('hook1', 4), 'sparkle', 0.6);
  S(w('hook1', 8), 'rise', 0.8); S(w('hook1', 10), 'ding', 0.6); S(w('hook1', 12), 'whoosh_long', 0.6);
  S(w('hook1', 15), 'zap', 1); S(w('hook1', 15), 'thud', 0.9);
  S(w('hook2', 2), 'scratch', 1); S(w('hook2', 4), 'zap', 0.6);
  S(C.seg('s1'), 'whoosh', 0.7); S(w('s1', 2), 'ding', 0.8); S(w('s1', 5), 'click', 0.9);
  S(w('s2', 3), 'zap', 0.6); S(w('s2', 5), 'tick', 0.7); S(w('s2', 9), 'click', 0.7);
  S(w('s3', 6), 'fire', 0.8); S(w('s3', 6), 'pop'); S(w('s3', 9), 'pop'); S(w('s3', 9), 'clock', 0.8);
  S(w('s4', 9), 'pop'); S(w('s4', 9) + 0.2, 'sparkle', 0.7); S(w('s4', 14), 'beep', 0.6); S(w('s4', 20), 'bell', 0.8); S(w('s4', 22), 'rise', 0.7);
  S(w('s5', 7), 'fall', 0.8); S(w('s5', 9), 'thud', 0.9); S(w('s5', 9) + 0.25, 'stamp', 0.9); S(w('s5', 13), 'fire', 0.6); S(w('s5', 14), 'stamp', 0.9);
  S(w('end1', 0), 'confetti', 1); S(w('end1', 0), 'zap', 0.5); S(w('end1', -1), 'ding', 0.9);

  const faceCam = (o) => o.quaternion.copy(camera.quaternion);
  const show = (o, s, k = 1) => { o.visible = s > 0.001; o.scale.setScalar(Math.max(0.001, s * k)); };

  // niveau de charge du téléphone au fil de l'histoire
  const pctAt = (t) => {
    if (t < w('hook1', 0) + 0.3) return 64;
    if (t < w('hook1', 8)) return lerp(64, 96, prog(t, w('hook1', 0) + 0.3, w('hook1', 8) - w('hook1', 0)));
    if (t < C.seg('s2')) return lerp(96, 100, prog(t, w('hook1', 8), 0.4));
    if (t < w('s2', 7)) return lerp(100, 95, prog(t, C.seg('s2'), w('s2', 7) - C.seg('s2')));
    if (t < C.seg('s3')) return lerp(95, 100, prog(t, w('s2', 7), 0.6));
    if (t < w('s4', 11)) return 100;
    if (t < w('s4', 17)) return lerp(55, 80, smooth(prog(t, w('s4', 11) - 0.3, 0.9)));
    if (t < w('s4', 20)) return 80;
    return lerp(80, 100, smooth(prog(t, w('s4', 20), 1.0)));
  };

  function update(t) {
    grid.position.z = (t * 1.2) % 2;
    sun.position.y = lerp(-9, 4, smooth(prog(t, w('hook1', 11), 1.4))); // lever de soleil sur « jusqu'au matin »

    // prise qui se branche
    const ins = easeOut(prog(t, w('hook1', 0), 0.35));
    plug.position.set(0, lerp(-0.2, 0.92, ins), 0); plug.scale.setScalar(1);
    const killed = t > w('hook1', 15) - 0.05 && t < w('hook2', 2) + 0.1;
    const flick = killed ? (Math.sin(t * 60) > 0 ? 1 : 0.4) : 1;
    phone.position.y = 2.3; phone.rotation.y = Math.sin(t * 0.6) * 0.12;
    // niveau de charge
    const pct = pctAt(t);
    const hot = smooth(prog(t, w('s3', 6) - 0.2, 0.6)) * (1 - smooth(prog(t, C.seg('s4'), 0.6))) + (t > w('s5', 9) && t < C.seg('end1') ? 1 : 0);
    const col = killed ? RED : hot > 0.5 ? ORANGE : pct >= 99.5 ? GREEN : pct > 79 ? CYAN : YEL;
    screen.redraw(killed ? 3 : Math.round(pct), col, killed ? 1 : 0);
    screen.material.color.setScalar(2.2 * flick);
    setBat(killed ? 3 : pct, col);
    // électrons : circulent pendant la charge, s'arrêtent quand c'est plein
    const charging = t > w('hook1', 0) + 0.3 && (pct < 99.5 || (t > w('s2', 3) && t < C.seg('s3')) || (t > w('s4', 20)));
    const charging2 = charging && !(t > w('s1', 5) && t < w('s2', 3)) && !(t > w('s4', 11) && t < w('s4', 17) + 0.3 && pct >= 79.5 && t > w('s4', 17));
    elec.update({ fill: 1, offset: -t * 0.5, alpha: charging2 ? 1 : 0, scale: 1 });

    // icônes
    const sm = life(t, w('hook1', 3) - 0.05, w('hook1', 11)); show(moon, sm); moon.position.set(-1.6, 3.9, -0.5); faceCam(moon);
    const sk = life(t, w('hook1', 15), w('hook2', 2)); show(skull, sk); skull.position.set(1.4, 3.7, 0.2); faceCam(skull);
    const sT = life(t, w('s3', 6) - 0.1, C.seg('s4')); show(therm, sT); therm.position.set(3.9, 2.7, 0); faceCam(therm); therm.redraw(Math.round(lerp(0.3, 0.9, smooth(prog(t, w('s3', 6), 1.2))) * 20) / 20);
    heatWaves.forEach((h, i) => { const u = ((t * 0.6) + i / 6) % 1; const on = hot > 0.5; h.visible = on; h.position.set(2.1 + (i % 3) * 0.5, 3.0 + u * 1.6, 0.3); h.material.opacity = Math.sin(u * Math.PI); faceCam(h); });
    const sC = life(t, w('s3', 9), C.segEnd('s4')); show(clock, sC); clock.position.set(t < C.seg('s4') ? 1.25 : 1.0, 3.75, 0.2); faceCam(clock);
    const ring = t > w('s4', 20) - 0.1 && t < C.segEnd('s4') ? Math.abs(Math.sin(t * 18)) : 0;
    clock.redraw(Math.round((t < C.seg('s4') ? t * 2.5 : lerp(0, Math.PI * 2 * 0.9, prog(t, w('s4', 11), w('s4', 20) - w('s4', 11)))) * 20) / 20, ring > 0 ? YEL : VIOLET, Math.round(ring * 4) / 4);
    const sS = life(t, w('s4', 9) - 0.1, w('s4', 17)); show(shield, sS); shield.position.set(-0.4, 3.9, 0.3); faceCam(shield);
    const sP = life(t, w('s5', 7) - 0.05, C.segEnd('s5') + 0.2); show(pillow, sP); pillow.position.set(0, 2.3 + drop(t, w('s5', 7), 0.4) * 2.5, 0.35); faceCam(pillow);
    const sF = life(t, w('s5', 13) - 0.05, C.segEnd('s5') + 0.2); show(flame, sF); flame.position.set(1.6, 2.5, 0.4); faceCam(flame);
    const sX = Math.max(life(t, w('s5', 9) + 0.25, w('s5', 12), 0.3), life(t, w('s5', 14), C.segEnd('s5') + 0.2, 0.3));
    show(xMark, sX); xMark.position.copy(t < w('s5', 13) ? V(0, 2.3, 0.5) : V(1.6, 2.5, 0.5)); faceCam(xMark);
    const sH = life(t, w('end1', 2), C.duration); show(heart, sH * (1 + 0.1 * Math.sin(t * 8))); heart.position.set(2.6, 4.2, -0.2); faceCam(heart);
    confetti.forEach((m, i) => { const x = t - w('end1', 0); m.visible = x > 0 && x < 3.5; if (!m.visible) return; const [a, b, c, r] = cS[i]; m.position.set(1.2 + a * 3.2 * (1 - Math.exp(-x * 2)), 1.5 + (4 + b * 3) * (1 - Math.exp(-x * 2)) / 2 - 1.1 * x * x / (1 + x), c * 1.5); m.rotation.set(x * 4 + r, x * 3, r); });

    rig.update(t);
  }
  const render = await makeBloomRenderer(renderer, scene, camera, { strength: 0.7, radius: 0.35, threshold: 0.7 });
  return { update, sfx, render };
}
