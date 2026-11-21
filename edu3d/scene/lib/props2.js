// Modèles supplémentaires : feu tricolore, clé, histogramme 3D, labo, démarreur, batterie, barrière, portefeuille, étiquettes.
import * as THREE from 'three';
import { mat, rbox, cyl, shadowAll } from './garage.js';
import { clamp, lerp } from './core.js';

/** Étiquette texte (canvas) redessinable, toujours lisible. */
export function makeLabel(w = 1.2, h = 0.4, { bg = null, color = '#2A2A30', font = 900, px = 110 } = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  let last = null;
  mesh.setText = (txt, col = color) => {
    const key = txt + col;
    if (key === last) return;
    last = key;
    const x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    if (bg) { x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, c.width - 8, c.height - 8, c.height * 0.3); x.fill(); }
    x.font = `${font} ${px}px MontserratBlack`; x.textAlign = 'center'; x.textBaseline = 'middle';
    let s = px; while (x.measureText(txt).width > c.width * 0.9 && s > 20) { s -= 4; x.font = `${font} ${s}px MontserratBlack`; }
    x.fillStyle = col; x.fillText(txt, c.width / 2, c.height / 2 + 4);
    tex.needsUpdate = true;
  };
  return mesh;
}

// ======================= FEU TRICOLORE =======================
export function makeTrafficLight() {
  const g = new THREE.Group();
  const pole = cyl(0.06, 0.06, 2.0, mat('#3A3D45', { metalness: 0.4, roughness: 0.5 }), 14); pole.position.y = 1.0; g.add(pole);
  const base = cyl(0.22, 0.26, 0.08, mat('#3A3D45'), 18); base.position.y = 0.04; g.add(base);
  const box = rbox(0.42, 1.05, 0.32, 0.08, mat('#2A2C33', { roughness: 0.5 })); box.position.y = 2.45; g.add(box);
  const lamps = [];
  const cols = ['#FF2B2B', '#FFB21E', '#2BD96B'];
  cols.forEach((c, i) => {
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 20, 1, true, -Math.PI / 2, Math.PI), mat('#1C1D22', { side: THREE.DoubleSide }));
    visor.rotation.x = Math.PI / 2; visor.position.set(0, 2.78 - i * 0.32 + 0.05, 0.2); g.add(visor);
    const m = new THREE.MeshStandardMaterial({ color: '#333', emissive: c, emissiveIntensity: 0 });
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), m);
    lamp.position.set(0, 2.78 - i * 0.32, 0.165); g.add(lamp); lamps.push({ m, c });
  });
  g.setLight = (idx) => lamps.forEach((l, i) => { l.m.emissiveIntensity = i === idx ? 2.4 : 0; l.m.color.set(i === idx ? l.c : '#333'); });
  g.setLight(0);
  return shadowAll(g);
}

// ======================= CLÉ DE VOITURE =======================
export function makeKey() {
  const g = new THREE.Group();
  const head = rbox(0.34, 0.5, 0.12, 0.1, mat('#22242A', { roughness: 0.45 })); head.position.y = 0.25; g.add(head);
  const btn = cyl(0.06, 0.06, 0.03, mat('#E2473D'), 18); btn.rotation.x = Math.PI / 2; btn.position.set(0, 0.32, 0.065); g.add(btn);
  const blade = rbox(0.1, 0.5, 0.04, 0.02, mat('#D6DAE0', { metalness: 0.85, roughness: 0.25 })); blade.position.y = -0.25; g.add(blade);
  return shadowAll(g);
}

// ======================= HISTOGRAMME 3D : ralenti vs redémarrage =======================
export function makeBarChart() {
  const g = new THREE.Group();
  const plinth = rbox(1.6, 0.12, 0.7, 0.04, mat('#F4EEE8')); plinth.position.y = 0.06; g.add(plinth);
  const mA = mat('#FF8A3C', { roughness: 0.4 }), mB = mat('#3B7BFF', { roughness: 0.4 });
  const A = rbox(0.42, 1, 0.42, 0.06, mA), B = rbox(0.42, 1, 0.42, 0.06, mB);
  A.position.x = -0.35; B.position.x = 0.35; g.add(A); g.add(B);
  const lblA = makeLabel(0.74, 0.24, { color: '#2A2A30', px: 120 }); lblA.position.set(-0.35, 0.22, 0.37); lblA.setText('RALENTI'); g.add(lblA);
  const lblB = makeLabel(0.74, 0.24, { color: '#2A2A30', px: 120 }); lblB.position.set(0.35, 0.22, 0.37); lblB.setText('DÉMARRAGE'); g.add(lblB);
  // ligne de seuil « 10 s »
  const line = rbox(1.5, 0.025, 0.025, 0.01, new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFFFFF', emissiveIntensity: 0.6, transparent: true }));
  line.position.z = 0.24; g.add(line);
  shadowAll(g);
  g.userData = { mA, mB, line };
  const set = (bar, h) => { bar.scale.y = Math.max(0.001, h); bar.position.y = 0.12 + Math.max(0.001, h) / 2; };
  /** hA, hB : hauteurs en m ; seuil : hauteur de la ligne (0 = cachée) */
  g.setBars = (hA, hB, seuil = 0) => {
    set(A, hA); set(B, hB);
    line.visible = seuil > 0.01; line.position.y = 0.12 + seuil;
  };
  return g;
}

// ======================= ERLENMEYER (laboratoire) =======================
export function makeFlask() {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: '#E8F4FF', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.45, depthWrite: false });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.38, 0.55, 32, 1, true), glass); body.position.y = 0.3; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 24, 1, true), glass); neck.position.y = 0.72; g.add(neck);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 24), glass); lip.rotation.x = Math.PI / 2; lip.position.y = 0.87; g.add(lip);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.3, 32), new THREE.MeshStandardMaterial({ color: '#3CE08A', emissive: '#18A055', emissiveIntensity: 0.5, transparent: true, opacity: 0.85 }));
  liquid.position.y = 0.17; g.add(liquid);
  const bubbles = [];
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat('#B9FFD8', { emissive: '#3CE08A', emissiveIntensity: 0.4 })); g.add(b); bubbles.push(b); }
  g.bubble = (t) => bubbles.forEach((b, i) => {
    const u = ((t * 0.7 + i / bubbles.length) % 1);
    b.position.set(Math.sin(i * 2.3) * 0.12 * (1 - u), 0.1 + u * 0.85, Math.cos(i * 1.7) * 0.08 * (1 - u));
    b.scale.setScalar(0.6 + u * 0.8);
  });
  return g;
}

// ======================= DÉMARREUR =======================
export function makeStarter() {
  const g = new THREE.Group();
  const body = cyl(0.11, 0.11, 0.42, mat('#3E4148', { metalness: 0.5, roughness: 0.4 }), 24); body.rotation.z = Math.PI / 2; g.add(body);
  const sol = cyl(0.06, 0.06, 0.3, mat('#C9CED6', { metalness: 0.8, roughness: 0.25 }), 18); sol.rotation.z = Math.PI / 2; sol.position.set(0.02, 0.15, 0); g.add(sol);
  const pinion = new THREE.Group();
  const p = cyl(0.06, 0.06, 0.08, mat('#C9CED6', { metalness: 0.8, roughness: 0.25 }), 12); p.rotation.z = Math.PI / 2; pinion.add(p);
  for (let k = 0; k < 8; k++) { const tooth = rbox(0.08, 0.03, 0.03, 0.005, mat('#9DA3AD', { metalness: 0.8 })); const a = k / 8 * Math.PI * 2; tooth.position.set(0, Math.cos(a) * 0.07, Math.sin(a) * 0.07); tooth.rotation.x = a; pinion.add(tooth); }
  pinion.position.x = 0.26; g.add(pinion);
  // bagues de renfort (apparaissent sur « renforcé »)
  const rings = [];
  const gold = mat('#FFC72C', { metalness: 0.7, roughness: 0.3, emissive: '#7A5200', emissiveIntensity: 0.3 });
  for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 10, 28), gold); r.rotation.y = Math.PI / 2; r.position.x = -0.15 + k * 0.15; g.add(r); rings.push(r); }
  g.userData = { pinion, rings };
  g.setArmor = (k) => rings.forEach((r, i) => r.scale.setScalar(Math.max(0.001, clamp(k * 3 - i))));
  g.spin = (a) => { pinion.rotation.x = a; };
  return shadowAll(g);
}

// ======================= BATTERIE =======================
export function makeBattery() {
  const g = new THREE.Group();
  const body = rbox(0.6, 0.4, 0.34, 0.04, mat('#2A2C33', { roughness: 0.5 })); body.position.y = 0.2; g.add(body);
  const lid = rbox(0.62, 0.06, 0.36, 0.02, mat('#3B7BFF')); lid.position.y = 0.42; g.add(lid);
  const plus = cyl(0.04, 0.04, 0.07, mat('#E2473D'), 14); plus.position.set(0.2, 0.48, 0); g.add(plus);
  const minus = cyl(0.04, 0.04, 0.07, mat('#1A1A1E'), 14); minus.position.set(-0.2, 0.48, 0); g.add(minus);
  const sh = new THREE.Shape();
  [[0.03, 0.13], [-0.07, -0.01], [-0.005, -0.01], [-0.035, -0.13], [0.07, 0.02], [0.005, 0.02], [0.03, 0.13]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const bolt = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), mat('#FFC72C', { emissive: '#7A5200', emissiveIntensity: 0.4 }));
  bolt.position.set(0, 0.22, 0.17); g.add(bolt);
  return shadowAll(g);
}

// ======================= BARRIÈRE DE PASSAGE À NIVEAU =======================
export function makeBarrier(len = 4.2) {
  const g = new THREE.Group();
  const post = rbox(0.3, 1.1, 0.3, 0.05, mat('#F4F1EA')); post.position.y = 0.55; g.add(post);
  const sign = new THREE.Group();
  for (const s of [1, -1]) { const b = rbox(0.9, 0.12, 0.03, 0.02, mat('#E2473D')); b.rotation.z = s * 0.6; sign.add(b); }
  sign.position.set(0, 1.85, 0.05); g.add(sign);
  const signPole = cyl(0.04, 0.04, 0.8, mat('#9DA3AD'), 10); signPole.position.y = 1.45; g.add(signPole);
  const arm = new THREE.Group(); arm.position.y = 1.0; g.add(arm);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const seg = rbox(len / n, 0.12, 0.1, 0.02, mat(i % 2 ? '#F4F1EA' : '#E2473D'));
    seg.position.x = -(i + 0.5) * len / n; arm.add(seg);
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshStandardMaterial({ color: '#FF3030', emissive: '#FF2020', emissiveIntensity: 0 }));
  lamp.position.set(-len + 0.1, 0.12, 0); arm.add(lamp);
  g.setArm = (k, blink = 0) => { arm.rotation.z = lerp(-(Math.PI / 2 - 0.05), 0, k); lamp.material.emissiveIntensity = blink; };
  return shadowAll(g);
}

// ======================= PORTEFEUILLE + PIÈCES =======================
export function makeWallet() {
  const g = new THREE.Group();
  const body = rbox(0.7, 0.46, 0.12, 0.06, mat('#8A5A3C', { roughness: 0.7 })); g.add(body);
  const flap = rbox(0.7, 0.2, 0.13, 0.05, mat('#7A4C31')); flap.position.set(0, 0.12, 0.01); g.add(flap);
  const snap = cyl(0.04, 0.04, 0.02, mat('#FFC72C', { metalness: 0.8, roughness: 0.3 }), 14); snap.rotation.x = Math.PI / 2; snap.position.set(0, 0.06, 0.08); g.add(snap);
  const coins = [];
  for (let i = 0; i < 6; i++) {
    const c = cyl(0.1, 0.1, 0.025, mat('#FFC72C', { metalness: 0.85, roughness: 0.25, emissive: '#6B4A00', emissiveIntensity: 0.25 }), 24);
    c.rotation.x = Math.PI / 2; g.add(c); coins.push(c);
  }
  g.coins = (x) => coins.forEach((c, i) => {
    const u = clamp(x - i * 0.12);
    c.visible = u > 0 && u < 1;
    const a = i * 1.05;
    c.position.set(Math.sin(a) * 0.5 * u, 0.25 + Math.sin(u * Math.PI) * 0.9, 0.1);
    c.rotation.y = u * 12;
  });
  return shadowAll(g);
}

// ======================= PICTO STOP-START (A dans une flèche circulaire) =======================
export function makeStopStartIcon() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  let last = null;
  mesh.setColor = (col) => {
    if (col === last) return; last = col;
    const x = c.getContext('2d');
    x.clearRect(0, 0, 256, 256);
    x.fillStyle = '#1E2026'; x.beginPath(); x.arc(128, 128, 126, 0, Math.PI * 2); x.fill();
    x.strokeStyle = col; x.lineWidth = 16; x.beginPath(); x.arc(128, 128, 84, -Math.PI * 0.35, Math.PI * 1.35); x.stroke();
    x.fillStyle = col; x.beginPath(); x.moveTo(184, 50); x.lineTo(214, 98); x.lineTo(160, 96); x.closePath(); x.fill();
    x.font = '900 104px MontserratBlack'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('A', 128, 136);
    tex.needsUpdate = true;
  };
  mesh.setColor('#FFFFFF');
  return mesh;
}
