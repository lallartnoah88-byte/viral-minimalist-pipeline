// Décor : garage stylisé (palette de la référence) + extérieur enneigé à l'aube.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './core.js';

export const PAL = {
  wall: '#E9DCD0', wallLow: '#DCCABB', beam: '#7C2F25', roof: '#9A3E2C', tileA: '#E7B9A0', tileB: '#E2B096', grout: '#F2D2BF',
  stand: '#EC6E6A', red: '#E2473D', wood: '#C98A52', peg: '#D8A878', blue: '#2F5BD6', tire: '#1D1D22', navy: '#23305E',
  snow: '#EEF3FB', snowShadow: '#C9D6EC', road: '#8D97A8', pine: '#2F6B55',
};

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.0, ...o });

export function rbox(w, h, d, r = 0.04, m) {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
export function cyl(rt, rb, h, m, seg = 28) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
export function shadowAll(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return obj;
}

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

export const GARAGE = { x0: -8, x1: 8, z0: -6, z1: 5, h: 4.0, doorX0: -4.6, doorX1: 6.9, doorH: 3.3 };

export function buildGarage(scene) {
  const G = GARAGE;
  const root = new THREE.Group();
  scene.add(root);
  const R = rng(5);

  // --- Ciel d'aube d'hiver (dégradé violet → rose) ---
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: `varying vec3 vP; void main(){ float y = clamp(vP.y,0.0,1.0);
        vec3 top = vec3(0.39,0.37,0.72); vec3 mid = vec3(0.86,0.62,0.78); vec3 low = vec3(1.0,0.80,0.74);
        vec3 c = mix(low, mid, smoothstep(0.0,0.12,y)); c = mix(c, top, smoothstep(0.12,0.55,y));
        gl_FragColor = vec4(pow(c, vec3(2.2)),1.0); }`,
    }),
  );
  scene.add(sky);

  // --- Sol extérieur enneigé + route ---
  const snow = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(PAL.snow, { roughness: 0.95 }));
  snow.rotation.x = -Math.PI / 2; snow.position.y = -0.02; snow.receiveShadow = true;
  root.add(snow);
  const roadTex = canvasTex(256, 1024, (c, w, h) => {
    c.fillStyle = PAL.road; c.fillRect(0, 0, w, h);
    c.fillStyle = '#F4F1EA';
    for (let y = 0; y < h; y += 256) c.fillRect(w / 2 - 6, y + 40, 12, 140);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 0, 14, h); c.fillRect(w - 14, 0, 14, h);
  }, [1, 30]);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 300), mat('#ffffff', { map: roadTex, roughness: 0.6 }));
  road.rotation.x = -Math.PI / 2; road.position.set(1.15, -0.005, G.z1 + 150); road.receiveShadow = true;
  root.add(road);
  // talus de neige le long de la route
  for (let i = 0; i < 60; i++) {
    for (const side of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat(PAL.snow, { roughness: 1 }));
      b.scale.set(1.4 + R() * 1.2, 0.35 + R() * 0.35, 2.2 + R());
      b.position.set(1.15 + side * (5.6 + R() * 0.8), 0, G.z1 + 7 + i * 4.8 + R() * 2);
      b.receiveShadow = true; root.add(b);
    }
  }
  // sapins stylisés
  const pineM = mat(PAL.pine, { roughness: 0.9 }), trunkM = mat('#6B4532'), capM = mat('#FFFFFF', { roughness: 1 });
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1;
    const x = 1.15 + side * (9 + R() * 40), z = G.z1 + 4 + R() * 220 - (R() < 0.3 ? 60 : 0);
    if (Math.abs(x) < 12 && z < G.z1 + 2) continue;
    const s = 0.8 + R() * 1.1;
    const tr = new THREE.Group();
    const trunk = cyl(0.15, 0.2, 0.8, trunkM, 8); trunk.position.y = 0.4; tr.add(trunk);
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.3 - k * 0.33, 1.4, 9), pineM);
      c.position.y = 1.2 + k * 0.85; c.castShadow = true; tr.add(c);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.75 - k * 0.2, 0.5, 9), capM);
      cap.position.y = 1.75 + k * 0.85; tr.add(cap);
    }
    tr.scale.setScalar(s); tr.position.set(x, 0, z); tr.rotation.y = R() * 6;
    root.add(tr);
  }

  // --- Sol carrelé du garage ---
  const tiles = canvasTex(512, 512, (c, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      c.fillStyle = (i + j) % 2 ? PAL.tileA : PAL.tileB; c.fillRect(i * s, j * s, s, s);
    }
    c.strokeStyle = PAL.grout; c.lineWidth = 5;
    for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); }
  }, [(G.x1 - G.x0) / 4, (G.z1 - G.z0) / 4]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(G.x1 - G.x0, G.z1 - G.z0), mat('#ffffff', { map: tiles, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((G.x0 + G.x1) / 2, 0.001, (G.z0 + G.z1) / 2); floor.receiveShadow = true;
  root.add(floor);
  // seuil béton
  const sill = rbox(G.x1 - G.x0 + 0.4, 0.06, 1.2, 0.02, mat('#D8D2CC'));
  sill.position.set(0, 0.0, G.z1 + 0.6); root.add(sill);

  // --- Murs ---
  const wallM = mat(PAL.wall, { roughness: 0.92 });
  const back = rbox(G.x1 - G.x0, G.h, 0.2, 0.01, wallM); back.position.set(0, G.h / 2, G.z0 - 0.1); root.add(back);
  for (const x of [G.x0 - 0.1, G.x1 + 0.1]) {
    const s = rbox(0.2, G.h, G.z1 - G.z0, 0.01, wallM); s.position.set(x, G.h / 2, (G.z0 + G.z1) / 2); root.add(s);
  }
  // plinthes
  const baseM = mat(PAL.wallLow);
  const bb = rbox(G.x1 - G.x0, 0.18, 0.05, 0.01, baseM); bb.position.set(0, 0.09, G.z0 + 0.02); root.add(bb);
  // façade avant avec grande ouverture
  const faceM = mat('#E3D3C6', { roughness: 0.9 });
  const fl = rbox(G.doorX0 - G.x0 + 0.2, G.h, 0.3, 0.02, faceM); fl.position.set((G.x0 + G.doorX0) / 2 - 0.1, G.h / 2, G.z1); root.add(fl);
  const fr = rbox(G.x1 - G.doorX1 + 0.2, G.h, 0.3, 0.02, faceM); fr.position.set((G.x1 + G.doorX1) / 2 + 0.1, G.h / 2, G.z1); root.add(fr);
  const lint = rbox(G.doorX1 - G.doorX0, G.h - G.doorH, 0.3, 0.02, faceM); lint.position.set((G.doorX0 + G.doorX1) / 2, (G.h + G.doorH) / 2, G.z1); root.add(lint);
  // encadrement de porte rouge brique
  const trimM = mat(PAL.beam);
  const lt = rbox(G.doorX1 - G.doorX0 + 0.4, 0.22, 0.4, 0.03, trimM); lt.position.set((G.doorX0 + G.doorX1) / 2, G.doorH + 0.11, G.z1 + 0.05); root.add(lt);

  // --- Toit à deux pans (intérieur bois, extérieur tuiles) ---
  const roofM = mat(PAL.roof, { roughness: 0.8 }), roofIn = mat('#A64C35', { roughness: 0.85 });
  const span = (G.x1 - G.x0) / 2 + 0.9, pitch = 0.42, len = G.z1 - G.z0 + 1.2;
  for (const side of [-1, 1]) {
    const slope = new THREE.Group();
    const outer = rbox(span / Math.cos(pitch), 0.22, len, 0.03, roofM); outer.position.y = 0.11; slope.add(outer);
    const inner = rbox(span / Math.cos(pitch) - 0.4, 0.05, len - 0.4, 0.01, roofIn); inner.position.y = -0.03; slope.add(inner);
    slope.rotation.z = -side * pitch;
    slope.position.set(side * span / 2, G.h + Math.tan(pitch) * span / 2, (G.z0 + G.z1) / 2);
    root.add(slope);
  }
  // pignon avant (triangle)
  const tri = new THREE.Shape();
  tri.moveTo(G.x0 - 0.2, 0); tri.lineTo(G.x1 + 0.2, 0); tri.lineTo(0, Math.tan(pitch) * span); tri.lineTo(G.x0 - 0.2, 0);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }), faceM);
  gable.position.set(0, G.h, G.z1 - 0.15); gable.castShadow = true; root.add(gable);
  const gableB = gable.clone(); gableB.position.z = G.z0 - 0.3; root.add(gableB);
  // poutres
  for (let i = 0; i < 4; i++) {
    const beam = rbox(G.x1 - G.x0, 0.22, 0.26, 0.02, trimM);
    beam.position.set(0, G.h - 0.12, G.z0 + 0.6 + i * 3.2); root.add(beam);
  }
  const ridge = rbox(0.3, 0.3, len, 0.02, trimM); ridge.position.set(0, G.h + Math.tan(pitch) * span - 0.2, (G.z0 + G.z1) / 2); root.add(ridge);
  // bande haute foncée sur les murs
  const band = rbox(G.x1 - G.x0, 0.35, 0.05, 0.01, trimM); band.position.set(0, G.h - 0.17, G.z0 + 0.03); root.add(band);

  // --- Néons ---
  const neonM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#FFF6EA', emissiveIntensity: 2.2 });
  const housingM = mat('#C9C4C0');
  for (let i = 0; i < 4; i++) {
    for (const x of [-3.2, 3.2]) {
      const g = new THREE.Group();
      const hsg = rbox(2.0, 0.08, 0.3, 0.02, housingM); g.add(hsg);
      const tube = rbox(1.9, 0.05, 0.2, 0.02, neonM); tube.position.y = -0.05; tube.castShadow = false; g.add(tube);
      g.position.set(x, G.h - 0.45, G.z0 + 1.2 + i * 3.0);
      root.add(g);
    }
  }

  // --- Panneau perforé + outils ---
  const peg = rbox(2.8, 1.6, 0.06, 0.02, mat(PAL.peg)); peg.position.set(-4.6, 2.35, G.z0 + 0.05); root.add(peg);
  const navyM = mat(PAL.navy), redM = mat(PAL.red), steelM = mat('#B9BEC6', { metalness: 0.6, roughness: 0.35 });
  const plate = rbox(0.9, 0.22, 0.04, 0.01, navyM); plate.position.set(-4.3, 2.75, G.z0 + 0.1); root.add(plate);
  for (let i = 0; i < 4; i++) {
    const sd = new THREE.Group();
    const h = cyl(0.035, 0.035, 0.22, i % 2 ? redM : navyM, 10); h.position.y = 0.1; sd.add(h);
    const sh = cyl(0.012, 0.012, 0.28, steelM, 8); sh.position.y = -0.14; sd.add(sh);
    sd.position.set(-5.6 + i * 0.22, 2.15, G.z0 + 0.12); root.add(sd);
  }
  const hammer = new THREE.Group();
  const hh = rbox(0.05, 0.5, 0.05, 0.015, mat(PAL.wood)); hh.position.y = -0.1; hammer.add(hh);
  const hd = rbox(0.22, 0.08, 0.08, 0.02, redM); hd.position.y = 0.17; hammer.add(hd);
  hammer.position.set(-3.6, 2.1, G.z0 + 0.12); root.add(hammer);

  // --- Établi rouge + boîte à outils ---
  const bench = new THREE.Group();
  const top = rbox(2.6, 0.1, 0.9, 0.02, mat(PAL.wood)); top.position.y = 0.95; bench.add(top);
  const cab = rbox(1.1, 0.88, 0.8, 0.03, redM); cab.position.set(-0.7, 0.46, 0); bench.add(cab);
  for (let k = 0; k < 3; k++) {
    const dr = rbox(0.95, 0.22, 0.03, 0.01, mat('#EF5A50')); dr.position.set(-0.7, 0.22 + k * 0.28, 0.41); bench.add(dr);
    const hnd = rbox(0.3, 0.03, 0.03, 0.01, steelM); hnd.position.set(-0.7, 0.26 + k * 0.28, 0.44); bench.add(hnd);
  }
  const leg = rbox(0.08, 0.9, 0.8, 0.01, mat('#3A3A40')); leg.position.set(1.2, 0.45, 0); bench.add(leg);
  const tbox = rbox(0.8, 0.32, 0.4, 0.04, redM); tbox.position.set(-0.6, 1.16, -0.1); bench.add(tbox);
  const tlid = rbox(0.82, 0.06, 0.42, 0.02, mat('#C73A31')); tlid.position.set(-0.6, 1.34, -0.1); bench.add(tlid);
  bench.position.set(-4.7, 0, G.z0 + 0.6); root.add(shadowAll(bench));

  // --- Bidons bleus + pneus ---
  const barrelM = mat(PAL.blue, { roughness: 0.5 });
  const barrels = [[-6.8, -4.6], [-6.0, -5.1], [6.7, -5.0]];
  for (const [x, z] of barrels) {
    for (let k = 0; k < 2; k++) {
      const b = cyl(0.42, 0.42, 0.62, barrelM, 24); b.position.set(x, 0.31 + k * 0.64, z); root.add(b);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 24), barrelM); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.6 + k * 0.64, z); root.add(rim);
    }
  }
  const tireM = mat(PAL.tire, { roughness: 0.85 });
  for (const [x, z, n] of [[-1.8, -5.2, 3], [5.3, -5.1, 4]]) {
    for (let k = 0; k < n; k++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.17, 12, 28), tireM);
      t.rotation.x = Math.PI / 2; t.position.set(x, 0.17 + k * 0.33, z); t.castShadow = t.receiveShadow = true; root.add(t);
    }
  }

  // --- Enseigne néon « abonne-toi <3 » (clin d'œil au « follow plz <3 » de la référence) ---
  const signTex = canvasTex(512, 160, (c, w, h) => {
    c.fillStyle = '#1B1620'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#FF5C8A'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
    c.font = '900 64px MontserratBlack'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#FF4F88'; c.shadowBlur = 24; c.fillStyle = '#FFD1E0';
    c.fillText('abonne-toi <3', w / 2, h / 2 + 4);
  });
  const signM = new THREE.MeshStandardMaterial({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 1.25 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.06), [mat('#1B1620'), mat('#1B1620'), mat('#1B1620'), mat('#1B1620'), signM, mat('#1B1620')]);
  sign.position.set(1.2, 2.9, G.z0 + 0.06); root.add(sign);
  const sign2 = sign.clone(); sign2.position.set(4.6, G.doorH + 0.55, G.z1 + 0.2); sign2.scale.setScalar(1.25); root.add(sign2);

  // --- Lumières ---
  const hemi = new THREE.HemisphereLight('#FFEBDD', '#B08070', 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFD2AE', 2.6);
  sun.position.set(-9, 14, 16);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.PointLight('#FFE6CF', 18, 16, 1.6); fill.position.set(0, 3.4, -1); scene.add(fill);
  scene.fog = new THREE.Fog('#E8C9CF', 45, 190);

  return { root, sun, sign, sign2 };
}

/** Flocons tombant à l'extérieur (déterministes) */
export function buildSnowfall(scene, n = 900) {
  const R = rng(91);
  const base = [];
  for (let i = 0; i < n; i++) base.push([1 + (R() - 0.5) * 60, R() * 18, GARAGE.z1 + 2 + R() * 70, R() * 6.28, 0.6 + R() * 0.8]);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
  const c = sprite.getContext('2d'); const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 32);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(sprite), transparent: true, depthWrite: false }));
  scene.add(pts);
  return (t) => {
    for (let i = 0; i < n; i++) {
      const [x, y, z, ph, sp] = base[i];
      pos[i * 3] = x + Math.sin(t * 0.8 + ph) * 0.4;
      pos[i * 3 + 1] = ((y - t * sp) % 18 + 18) % 18;
      pos[i * 3 + 2] = z + Math.cos(t * 0.6 + ph) * 0.3;
    }
    geo.attributes.position.needsUpdate = true;
  };
}
