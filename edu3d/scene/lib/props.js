// Modèles 3D procéduraux : moteur « glass-box », support, voiture, cadrans, accessoires, flux lumineux.
import * as THREE from 'three';
import { PAL, mat, rbox, cyl, shadowAll } from './garage.js';
import { rng, clamp, lerp } from './core.js';

const steel = () => mat('#C9CED6', { metalness: 0.75, roughness: 0.28 });
const dark = () => mat('#26262B', { roughness: 0.6 });

function glowSprite(color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return new THREE.SpriteMaterial({ map: t, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
}

// ======================= SUPPORT MOTEUR (tubes rose-rouge de la référence) =======================
export function makeStand() {
  const g = new THREE.Group();
  const m = mat(PAL.stand, { roughness: 0.45 });
  const tube = (a, b, r = 0.045) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const mesh = cyl(r, r, len, m, 14);
    mesh.position.copy(A).add(B).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    g.add(mesh);
  };
  const y0 = 0.12, W = 0.85, L = 0.95;
  // cadre au sol
  tube([-L, y0, -W], [L, y0, -W]); tube([-L, y0, W], [L, y0, W]); tube([-L, y0, -W], [-L, y0, W]); tube([L, y0, -W], [L, y0, W]);
  // montants
  for (const x of [-0.55, 0.55]) {
    tube([x, y0, -W], [x, 0.86, -0.15]); tube([x, y0, W], [x, 0.86, 0.15]);
    tube([x, 0.86, -0.18], [x, 0.86, 0.18]);
  }
  // roulettes
  for (const x of [-L, L]) for (const z of [-W, W]) {
    const w = cyl(0.06, 0.06, 0.05, dark(), 14); w.rotation.x = Math.PI / 2; w.position.set(x, 0.06, z); g.add(w);
  }
  // patins noirs sous le bloc
  for (const x of [-0.55, 0.55]) { const p = rbox(0.18, 0.1, 0.3, 0.02, dark()); p.position.set(x, 0.92, 0); g.add(p); }
  return g;
}

// ======================= MOTEUR 4 CYLINDRES =======================
export function makeEngine() {
  const g = new THREE.Group();
  const parts = {};
  const blockM = mat('#7F8896', { roughness: 0.5, metalness: 0.15, transparent: true, opacity: 1 });
  const block = rbox(1.7, 0.95, 0.85, 0.06, blockM); g.add(block);
  const headM = mat('#AEB4BD', { roughness: 0.4, metalness: 0.4, transparent: true });
  const head = rbox(1.74, 0.12, 0.88, 0.03, headM); head.position.y = 0.53; g.add(head);
  const coverM = mat('#D8473C', { roughness: 0.45, transparent: true });
  const cover = rbox(1.56, 0.2, 0.58, 0.06, coverM); cover.position.y = 0.69; g.add(cover);
  const capM = mat('#1E1E22', { transparent: true });
  const caps = [];
  for (let i = 0; i < 4; i++) { const c = rbox(0.16, 0.08, 0.12, 0.02, capM); c.position.set(-0.6 + i * 0.4, 0.82, 0); g.add(c); caps.push(c); }
  const panM = mat('#2B2B31', { roughness: 0.55, transparent: true });
  const pan = rbox(1.6, 0.3, 0.76, 0.06, panM); pan.position.y = -0.62; g.add(pan);
  // orifices d'échappement (face avant +z)
  const portM = steel();
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.03, 10, 20), portM);
    p.position.set(-0.6 + i * 0.4, 0.3, 0.44); g.add(p);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 18), dark()); hole.position.set(-0.6 + i * 0.4, 0.3, 0.435); g.add(hole);
  }
  // poulie + volant
  const fly = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 36), mat('#3A3A40', { roughness: 0.5, metalness: 0.4 }));
  fly.rotation.z = Math.PI / 2; fly.position.set(0.9, -0.2, 0); fly.castShadow = true; g.add(fly);
  const teeth = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 6, 48), mat('#55555C', { metalness: 0.5 }));
  teeth.rotation.y = Math.PI / 2; teeth.position.copy(fly.position); g.add(teeth);
  const pulley = cyl(0.12, 0.12, 0.08, steel(), 20); pulley.rotation.z = Math.PI / 2; pulley.position.set(-0.9, -0.2, 0); g.add(pulley);

  // ----- Organes internes (révélés en mode « verre ») -----
  const inner = new THREE.Group(); g.add(inner);
  const xs = [-0.6, -0.2, 0.2, 0.6];
  const linerM = new THREE.MeshStandardMaterial({ color: '#DDEBFF', transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const pistonM = mat('#D5D9DF', { metalness: 0.8, roughness: 0.25 });
  const ringM = mat('#55585E', { metalness: 0.5 });
  const rodM = mat('#B8BEC7', { metalness: 0.7, roughness: 0.3 });
  const pistons = [], rods = [], flames = [], liners = [];
  for (let i = 0; i < 4; i++) {
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.72, 28, 1, true), linerM);
    liner.position.set(xs[i], 0.1, 0); inner.add(liner); liners.push(liner);
    const p = new THREE.Group();
    const body = cyl(0.155, 0.155, 0.17, pistonM, 28); p.add(body);
    for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.156, 0.007, 6, 28), ringM); r.rotation.x = Math.PI / 2; r.position.y = 0.055 - k * 0.03; p.add(r); }
    p.position.set(xs[i], 0.1, 0); inner.add(p); pistons.push(p);
    const rod = rbox(0.05, 0.42, 0.05, 0.015, rodM); inner.add(rod); rods.push(rod);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), new THREE.MeshBasicMaterial({ color: '#FF9A3C', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    fl.position.set(xs[i], 0.36, 0); fl.scale.setScalar(0.001); inner.add(fl); flames.push(fl);
  }
  const crank = cyl(0.04, 0.04, 1.75, rodM, 12); crank.rotation.z = Math.PI / 2; crank.position.y = -0.38; inner.add(crank);
  const throws = [];
  for (let i = 0; i < 4; i++) { const th = rbox(0.05, 0.16, 0.08, 0.015, rodM); th.position.set(xs[i], -0.38, 0); inner.add(th); throws.push(th); }
  // huile dans le carter
  const oilM = new THREE.MeshStandardMaterial({ color: '#F2B43A', emissive: '#7A4A00', emissiveIntensity: 0.25, roughness: 0.25, transparent: true, opacity: 0.95 });
  const oil = rbox(1.48, 0.14, 0.64, 0.04, oilM); oil.position.y = -0.68; inner.add(oil);
  inner.visible = false;

  // ----- Givre : stalactites + coque blanche -----
  const frost = new THREE.Group(); g.add(frost);
  const iceM = new THREE.MeshStandardMaterial({ color: '#E8F4FF', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 });
  const R = rng(3);
  for (let i = 0; i < 16; i++) {
    const ic = new THREE.Mesh(new THREE.ConeGeometry(0.035 + R() * 0.02, 0.12 + R() * 0.16, 7), iceM);
    ic.rotation.x = Math.PI; const side = i % 2 ? 1 : -1;
    ic.position.set(-0.78 + (i >> 1) * 0.22 + R() * 0.05, 0.46 - (ic.geometry.parameters.height / 2), side * 0.45);
    frost.add(ic);
  }
  const shellM = new THREE.MeshStandardMaterial({ color: '#F4FAFF', roughness: 0.9, transparent: true, opacity: 0.0, depthWrite: false });
  const shell = rbox(1.76, 1.02, 0.9, 0.07, shellM); frost.add(shell);
  const shellTop = rbox(1.6, 0.24, 0.62, 0.07, shellM); shellTop.position.y = 0.69; frost.add(shellTop);

  // ----- Échauffement : halo -----
  const heatGlow = new THREE.Sprite(glowSprite('#FF6A2A')); heatGlow.scale.set(3.6, 3.0, 1); heatGlow.material.opacity = 0; g.add(heatGlow);

  Object.assign(parts, { block, blockM, head, headM, cover, coverM, caps, capM, pan, panM, inner, pistons, rods, throws, flames, liners, crank, oil, oilM, frost, shellM, heatGlow, fly });
  g.userData = parts;
  shadowAll(block); shadowAll(cover);

  const baseCol = new THREE.Color('#7F8896'), iceCol = new THREE.Color('#A9C8E4'), hotCol = new THREE.Color('#E8613E');
  const coverBase = new THREE.Color('#D8473C');
  /** heat : -1 gelé … 0 normal … 1 brûlant (illustration) */
  g.setHeat = (h) => {
    const c = h < 0 ? baseCol.clone().lerp(iceCol, -h) : baseCol.clone().lerp(hotCol, h);
    blockM.color.copy(c);
    blockM.emissive = new THREE.Color('#FF4A10'); blockM.emissiveIntensity = Math.max(0, h) * 0.55;
    coverM.color.copy(h < 0 ? coverBase.clone().lerp(new THREE.Color('#C9B7C8'), -h * 0.7) : coverBase);
    shellM.opacity = Math.max(0, -h) * 0.32;
    frost.children.forEach((c2, i) => { if (c2.geometry.type === 'ConeGeometry') c2.scale.setScalar(clamp(-h * 1.2 - (i % 4) * 0.05, 0.001, 1)); });
    heatGlow.material.opacity = Math.max(0, h) * 0.55;
  };
  /** glass : 0 opaque … 1 transparent (vue en coupe) */
  g.setGlass = (k) => {
    blockM.opacity = lerp(1, 0.2, k); headM.opacity = lerp(1, 0.25, k); coverM.opacity = lerp(1, 0.3, k); panM.opacity = lerp(1, 0.28, k);
    capM.opacity = lerp(1, 0.3, k);
    blockM.depthWrite = k < 0.05; headM.depthWrite = k < 0.05; coverM.depthWrite = k < 0.05; panM.depthWrite = k < 0.05;
    block.castShadow = k < 0.5;
    inner.visible = k > 0.02;
  };
  /** angle vilebrequin (rad) + intensité des combustions 0..1 */
  g.setCrank = (theta, burn = 1) => {
    const phases = [0, Math.PI, Math.PI, 0];
    for (let i = 0; i < 4; i++) {
      const a = theta + phases[i];
      const y = 0.1 + Math.cos(a) * 0.11;
      pistons[i].position.y = y;
      const cy = -0.38 + Math.cos(a) * 0.08, cz = Math.sin(a) * 0.08;
      throws[i].position.set(xs[i], (cy - 0.38) / 2, cz / 2);
      const top = new THREE.Vector3(xs[i], y - 0.06, 0), bot = new THREE.Vector3(xs[i], cy, cz);
      rods[i].position.copy(top).add(bot).multiplyScalar(0.5);
      rods[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize());
      rods[i].scale.y = top.distanceTo(bot) / 0.42;
      // combustion juste après le point mort haut, un cylindre sur deux tours (ordre 1-3-4-2)
      const cyc = ((a + [0, 3 * Math.PI, Math.PI, 2 * Math.PI][i]) % (4 * Math.PI) + 4 * Math.PI) % (4 * Math.PI);
      const f = cyc < 1.2 ? Math.sin(cyc / 1.2 * Math.PI) : 0;
      flames[i].scale.setScalar(Math.max(0.001, f * burn));
      flames[i].position.y = y + 0.2;
      flames[i].material.opacity = 0.85 * f * burn;
    }
    fly.rotation.x = theta;
    crank.rotation.x = theta;
  };
  return g;
}

// ======================= VOITURE DE SPORT BLEUE =======================
export function makeCar() {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: PAL.blue, roughness: 0.28, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const body = rbox(1.95, 0.5, 4.3, 0.2, paint); body.position.y = 0.55; g.add(body);
  const hood = rbox(1.85, 0.12, 1.5, 0.06, paint); hood.position.set(0, 0.82, 1.25); g.add(hood);
  const cabin = rbox(1.6, 0.48, 1.9, 0.22, paint); cabin.position.set(0, 1.0, -0.45); g.add(cabin);
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#1C2440', roughness: 0.1, metalness: 0.3, clearcoat: 1 });
  const side = rbox(1.63, 0.3, 1.5, 0.12, glassM); side.position.set(0, 1.04, -0.5); g.add(side);
  // pare-brise séparé (pour le givre)
  const ws = new THREE.Group();
  const wsGlass = rbox(1.46, 0.06, 0.78, 0.03, glassM); ws.add(wsGlass);
  const frostCanvas = document.createElement('canvas'); frostCanvas.width = 256; frostCanvas.height = 128;
  const frostTex = new THREE.CanvasTexture(frostCanvas); frostTex.colorSpace = THREE.SRGBColorSpace;
  const frostM = new THREE.MeshStandardMaterial({ map: frostTex, transparent: true, roughness: 1, depthWrite: false });
  const frostPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.76), frostM);
  frostPlane.rotation.x = -Math.PI / 2; frostPlane.position.y = 0.035; ws.add(frostPlane);
  ws.position.set(0, 1.02, 0.55); ws.rotation.x = 0.95; g.add(ws);
  const R = rng(12);
  const crystals = Array.from({ length: 160 }, () => [R(), R(), 2 + R() * 9, R() * 3.14]);
  g.setFrost = (amount, clearY = 1) => {
    // amount : opacité du givre ; clearY : part encore givrée en partant du haut (désembuage par le bas)
    const c = frostCanvas.getContext('2d');
    c.clearRect(0, 0, 256, 128);
    if (amount <= 0.001) { frostTex.needsUpdate = true; return; }
    c.globalAlpha = amount;
    c.fillStyle = 'rgba(236,246,255,0.92)';
    c.fillRect(0, 0, 256, 128 * clearY);
    c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 1.5;
    for (const [x, y, r, a] of crystals) {
      if (y > clearY) continue;
      c.save(); c.translate(x * 256, y * 128); c.rotate(a);
      for (let k = 0; k < 3; k++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.stroke(); }
      c.restore();
    }
    c.globalAlpha = 1; frostTex.needsUpdate = true;
  };
  g.setFrost(0);
  // roues
  const wheels = [];
  const tireM = mat(PAL.tire, { roughness: 0.8 }), rimM = steel();
  for (const [x, z] of [[-0.98, 1.35], [0.98, 1.35], [-0.98, -1.35], [0.98, -1.35]]) {
    const w = new THREE.Group();
    const tire = cyl(0.38, 0.38, 0.3, tireM, 28); tire.rotation.z = Math.PI / 2; w.add(tire);
    const rim = cyl(0.24, 0.24, 0.31, rimM, 20); rim.rotation.z = Math.PI / 2; w.add(rim);
    for (let k = 0; k < 5; k++) { const sp = rbox(0.33, 0.04, 0.06, 0.01, dark()); sp.position.x = Math.sign(x) * 0.16; sp.rotation.x = k * 1.2566; w.add(sp); }
    w.position.set(x, 0.38, z); g.add(w); wheels.push(w);
  }
  // phares / feux
  const headM = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFF5D8', emissiveIntensity: 0.2 });
  for (const x of [-0.65, 0.65]) {
    const h = rbox(0.42, 0.12, 0.06, 0.03, headM); h.position.set(x, 0.66, 2.15); g.add(h);
    const t = rbox(0.42, 0.1, 0.06, 0.03, new THREE.MeshStandardMaterial({ color: '#FF3B3B', emissive: '#FF2020', emissiveIntensity: 0.6 })); t.position.set(x, 0.68, -2.15); g.add(t);
  }
  const beam = new THREE.Sprite(glowSprite('#FFF3D0')); beam.scale.set(2.6, 1.0, 1); beam.position.set(0, 0.66, 2.3); beam.material.opacity = 0; g.add(beam);
  const exhaust = cyl(0.06, 0.06, 0.2, steel(), 12); exhaust.rotation.x = Math.PI / 2; exhaust.position.set(0.55, 0.32, -2.2); g.add(exhaust);
  g.userData = { wheels, headM, beam, ws, exhaustPos: new THREE.Vector3(0.55, 0.32, -2.35) };
  g.setLights = (k) => { headM.emissiveIntensity = 0.2 + k * 2.2; beam.material.opacity = k * 0.8; };
  g.spinWheels = (a) => wheels.forEach((w) => { w.rotation.x = a; });
  return shadowAll(g);
}

// ======================= CADRAN (température ou compte-tours) =======================
export function makeGauge(kind = 'temp') {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 16, 48), mat('#E2473D', { roughness: 0.35 }));
  g.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), mat('#FFFDF8', { roughness: 0.6 }));
  g.add(face);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.08, 40), mat('#2A2A30'));
  back.rotation.x = Math.PI / 2; back.position.z = -0.045; g.add(back);
  const A0 = Math.PI * 1.25, A1 = -Math.PI * 0.25; // 225° → -45°
  const seg = 24;
  for (let i = 0; i < seg; i++) {
    const u = i / seg;
    let col;
    if (kind === 'temp') col = new THREE.Color().setHSL(lerp(0.6, 0.0, u), 0.85, 0.55);
    else col = new THREE.Color(u < 0.55 ? '#3CC46B' : u < 0.8 ? '#F5B83A' : '#E6403A');
    const a0 = lerp(A0, A1, u), a1 = lerp(A0, A1, u + 1 / seg) + 0.005;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.44, 4, 1, a1, a0 - a1), new THREE.MeshBasicMaterial({ color: col }));
    ring.position.z = 0.005; g.add(ring);
  }
  // pictogramme (canvas)
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#2A2A30'; x.font = '900 56px MontserratBlack'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(kind === 'temp' ? '°C' : 'tr/min', 128, 64);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  lbl.position.set(0, -0.22, 0.01); g.add(lbl);
  const needle = new THREE.Group();
  const nd = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.4, 0.02), mat('#E2473D', { emissive: '#600', emissiveIntensity: 0.3 }));
  nd.position.y = 0.17; needle.add(nd);
  needle.position.z = 0.03; g.add(needle);
  const hub = cyl(0.06, 0.06, 0.05, mat('#2A2A30'), 20); hub.rotation.x = Math.PI / 2; hub.position.z = 0.04; g.add(hub);
  g.setValue = (v) => { needle.rotation.z = lerp(A0, A1, clamp(v)) - Math.PI / 2; };
  g.setValue(0);
  return shadowAll(g);
}

// ======================= HORLOGE =======================
export function makeClock() {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 16, 48), mat('#2A2A30')); g.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), mat('#FFFDF8')); g.add(face);
  for (let i = 0; i < 12; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(0.03, i % 3 ? 0.06 : 0.11, 0.01), mat('#2A2A30'));
    const a = i / 12 * Math.PI * 2; tk.position.set(Math.sin(a) * 0.45, Math.cos(a) * 0.45, 0.01); tk.rotation.z = -a; g.add(tk);
  }
  const mk = (len, w, col) => { const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), mat(col)); b.position.y = len / 2 - 0.04; p.add(b); p.position.z = 0.03; g.add(p); return p; };
  const hour = mk(0.28, 0.05, '#2A2A30'), minute = mk(0.42, 0.035, '#E2473D');
  g.setTime = (minutes) => { minute.rotation.z = -minutes / 60 * Math.PI * 2; hour.rotation.z = -minutes / 720 * Math.PI * 2 - 1.2; };
  return shadowAll(g);
}

// ======================= BIDON D'ESSENCE (rouge, croix noire comme la référence) =======================
export function makeJerrycan() {
  const g = new THREE.Group();
  const red = mat('#E8524A', { roughness: 0.45 });
  const body = rbox(0.55, 0.7, 0.24, 0.07, red); g.add(body);
  const xm = mat('#7A1E1A');
  for (const s of [1, -1]) { const b = rbox(0.06, 0.62, 0.02, 0.01, xm); b.rotation.z = s * 0.62; b.position.z = 0.125; g.add(b); }
  const handle = rbox(0.3, 0.07, 0.08, 0.03, red); handle.position.set(-0.08, 0.4, 0); g.add(handle);
  const spout = cyl(0.04, 0.05, 0.16, mat('#2A2A30'), 12); spout.position.set(0.2, 0.42, 0); spout.rotation.z = -0.6; g.add(spout);
  return shadowAll(g);
}

// ======================= CALCULATEUR (ECU) =======================
export function makeECU() {
  const g = new THREE.Group();
  const box = rbox(0.6, 0.18, 0.42, 0.04, mat('#2C2F36', { roughness: 0.4, metalness: 0.3 })); g.add(box);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshStandardMaterial({ color: '#0E2A1A', emissive: '#2DFF8A', emissiveIntensity: 0.35 }));
  scr.rotation.x = -Math.PI / 2; scr.position.y = 0.092; g.add(scr);
  const c = document.createElement('canvas'); c.width = 256; c.height = 160;
  const x = c.getContext('2d'); x.fillStyle = '#7CFFB4'; x.font = '900 64px MontserratBlack'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ECU', 128, 84);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  t.rotation.x = -Math.PI / 2; t.position.y = 0.094; g.add(t);
  for (let i = 0; i < 6; i++) { const p = rbox(0.03, 0.05, 0.08, 0.005, mat('#D9B54A', { metalness: 0.8, roughness: 0.3 })); p.position.set(-0.2 + i * 0.08, 0, 0.24); g.add(p); }
  return shadowAll(g);
}

// ======================= FILTRE À AIR « années 70 » + carburateur =======================
export function makeAirCleaner() {
  const g = new THREE.Group();
  const chrome = mat('#E2E6EC', { metalness: 0.9, roughness: 0.18 });
  const carb = cyl(0.14, 0.17, 0.22, mat('#B9A27A', { metalness: 0.5, roughness: 0.4 }), 18); carb.position.y = 0.11; g.add(carb);
  const pot = cyl(0.48, 0.48, 0.16, chrome, 40); pot.position.y = 0.3; g.add(pot);
  const lid = cyl(0.5, 0.5, 0.03, chrome, 40); lid.position.y = 0.39; g.add(lid);
  const filt = cyl(0.46, 0.46, 0.1, mat('#E8D08A', { roughness: 0.9 }), 40); filt.position.y = 0.26; g.add(filt);
  const nut = new THREE.Group();
  const n1 = rbox(0.2, 0.06, 0.05, 0.02, chrome); nut.add(n1);
  const n2 = cyl(0.04, 0.04, 0.08, chrome, 10); n2.position.y = -0.03; nut.add(n2);
  nut.position.y = 0.45; g.add(nut);
  return shadowAll(g);
}

export function makeInjector() {
  const g = new THREE.Group();
  const body = cyl(0.045, 0.035, 0.2, steel(), 14); g.add(body);
  const top = cyl(0.055, 0.055, 0.08, mat('#26262B'), 14); top.position.y = 0.13; g.add(top);
  const plug = rbox(0.1, 0.06, 0.08, 0.02, mat('#2F7BFF', { roughness: 0.4 })); plug.position.set(0.05, 0.16, 0); g.add(plug);
  const tip = cyl(0.015, 0.01, 0.05, steel(), 8); tip.position.y = -0.12; g.add(tip);
  return shadowAll(g);
}

// ======================= BOUCLE DE CEINTURE =======================
export function makeBuckle() {
  const g = new THREE.Group();
  const housing = rbox(0.5, 0.26, 0.16, 0.06, mat('#2A2A30', { roughness: 0.4 })); housing.position.x = 0.32; g.add(housing);
  const btn = rbox(0.14, 0.1, 0.05, 0.02, mat('#E2473D')); btn.position.set(0.32, 0, 0.08); g.add(btn);
  const strapM = mat('#3A3E4A', { roughness: 0.9 });
  const strapA = rbox(0.6, 0.18, 0.03, 0.01, strapM); strapA.position.x = 0.85; g.add(strapA);
  const tongue = new THREE.Group();
  const metal = rbox(0.36, 0.16, 0.03, 0.03, mat('#D5DAE2', { metalness: 0.9, roughness: 0.2 })); metal.position.x = -0.12; tongue.add(metal);
  const strapB = rbox(0.7, 0.18, 0.03, 0.01, strapM); strapB.position.x = -0.62; tongue.add(strapB);
  g.add(tongue);
  g.setClosed = (k) => { tongue.position.x = lerp(-0.6, 0.0, k); };
  return shadowAll(g);
}

// ======================= FLUX DE BILLES LUMINEUSES (signature visuelle de la référence) =======================
export class BeadFlow {
  constructor(scene, points, { color = '#FF9A55', n = 40, r = 0.035, halo = 0.16, closed = false } = {}) {
    this.curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
    this.n = n; this.closed = closed;
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.3, transparent: true });
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 12, 8), m, n);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.halos = [];
    const sm = glowSprite(color);
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(sm.clone()); s.scale.setScalar(halo); scene.add(s); this.halos.push(s); }
    this.m = m; this.dummy = new THREE.Object3D();
  }
  /** fill : part du trajet couverte (0..1), offset : défilement, alpha : opacité, scale : taille */
  update({ fill = 1, offset = 0, alpha = 1, scale = 1, colorMix = null } = {}) {
    const d = this.dummy;
    this.m.opacity = alpha;
    for (let i = 0; i < this.n; i++) {
      let u = (i / this.n + offset) % 1; if (u < 0) u += 1;
      const vis = u <= fill && alpha > 0.01;
      const p = this.curve.getPointAt(u);
      d.position.copy(p); d.scale.setScalar(vis ? scale : 0.0001); d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
      const h = this.halos[i]; h.position.copy(p); h.material.opacity = vis ? alpha * 0.7 : 0; h.visible = vis;
      if (colorMix) { h.material.color.copy(colorMix); }
    }
    if (colorMix) { this.m.color.copy(colorMix); this.m.emissive.copy(colorMix); }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ======================= PARTICULES : étincelles, fumée, confettis, gouttes =======================
export class Sparkles {
  constructor(scene, n = 14, color = '#FFFFFF') {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.translate(32, 32);
    x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 6 : 30; const a = i * Math.PI / 4; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
    const tex = new THREE.CanvasTexture(c);
    this.sp = Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false })); scene.add(s); s.visible = false; return s; });
    this.R = rng(n * 7 + 3);
    this.seeds = this.sp.map(() => [this.R() * 2 - 1, this.R() * 2 - 1, this.R() * 2 - 1, this.R()]);
  }
  /** éclat autour de center pendant [t0, t0+d] */
  burst(t, t0, center, radius = 0.8, d = 0.9, size = 0.16) {
    const x = (t - t0) / d;
    this.sp.forEach((s, i) => {
      const [a, b, c, ph] = this.seeds[i];
      const xi = x - ph * 0.3;
      if (xi <= 0 || xi >= 1) { s.visible = false; return; }
      s.visible = true;
      const k = Math.sin(xi * Math.PI);
      s.position.set(center.x + a * radius, center.y + b * radius * 0.7, center.z + c * radius * 0.5);
      s.scale.setScalar(size * k);
      s.material.rotation = xi * 3;
      s.material.opacity = k;
    });
  }
  hide() { this.sp.forEach((s) => { s.visible = false; }); }
}

export class Puffs {
  constructor(scene, n = 10, color = '#E9E4E0') {
    this.items = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, depthWrite: false })); m.visible = false; scene.add(m); return m; });
    const R = rng(n * 13 + 1);
    this.seeds = this.items.map(() => [R() * 2 - 1, R(), R() * 2 - 1, R()]);
  }
  /** nuage émis depuis origin dans la direction dir pendant [t0, t0+d] */
  emit(t, t0, origin, dir, { d = 1.2, spread = 0.4, size = 0.25, dist = 1.2 } = {}) {
    this.items.forEach((m, i) => {
      const [a, b, c, ph] = this.seeds[i];
      const x = (t - t0 - ph * d * 0.4) / d;
      if (x <= 0 || x >= 1) { m.visible = false; return; }
      m.visible = true;
      m.position.set(origin.x + dir.x * dist * x + a * spread * x, origin.y + dir.y * dist * x + b * spread * x + x * 0.3, origin.z + dir.z * dist * x + c * spread * x);
      m.scale.setScalar(size * (0.4 + x) * (0.7 + b * 0.6));
      m.material.opacity = (1 - x) * 0.85;
    });
  }
  hide() { this.items.forEach((m) => { m.visible = false; }); }
}

export class Confetti {
  constructor(scene, n = 160) {
    const cols = ['#FF5C8A', '#FFC72C', '#3CC46B', '#2F7BFF', '#FF7A3C', '#B66BFF', '#FFFFFF'];
    const geo = new THREE.PlaneGeometry(0.12, 0.07);
    this.items = Array.from({ length: n }, (_, i) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.6, emissive: cols[i % cols.length], emissiveIntensity: 0.2 })); m.visible = false; scene.add(m); return m; });
    const R = rng(4242);
    this.seeds = this.items.map(() => [R() * 2 - 1, R() * 2 - 1, 0.6 + R() * 0.8, R() * 6.28, R() * 6.28]);
  }
  update(t, t0, center, scale = 1) {
    this.items.forEach((m, i) => {
      const [a, c, v, r1, r2] = this.seeds[i];
      const x = t - t0;
      if (x <= 0 || x > 4) { m.visible = false; return; }
      m.visible = true;
      const vy = 7 * v * scale, g = 6 * scale;
      const drag = 1 - Math.exp(-x * 2.2);
      m.position.set(center.x + a * 3.2 * scale * drag + Math.sin(x * 3 + r1) * 0.15, center.y + vy * drag / 2.2 - g * x * 0.45 * x / (1 + x), center.z + c * 2.4 * scale * drag);
      m.rotation.set(x * 6 + r1, x * 4 + r2, x * 3);
      m.scale.setScalar(scale * 1.3);
    });
  }
}
