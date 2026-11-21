// Styles visuels : pâte à modeler, cel-shading (contours BD), néon (bloom), papier découpé.
import * as THREE from 'three';
import { rng } from './core.js';

function noiseCanvas(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ======================= PÂTE À MODELER =======================
let clayBump = null;
/** texture de relief : empreintes de doigts + petits creux */
function getClayBump() {
  if (clayBump) return clayBump;
  const R = rng(31);
  clayBump = noiseCanvas(512, (x, s) => {
    x.fillStyle = '#808080'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) { // empreintes : arcs concentriques
      const cx = R() * s, cy = R() * s, r0 = 10 + R() * 30, a = R() * 6.28;
      for (let k = 0; k < 6; k++) {
        x.strokeStyle = k % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
        x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, r0 + k * 3, a, a + 2.2); x.stroke();
      }
    }
    for (let i = 0; i < 1600; i++) { // grain
      const v = Math.floor(R() * 255);
      x.fillStyle = `rgba(${v},${v},${v},0.18)`; x.beginPath(); x.arc(R() * s, R() * s, 1 + R() * 3, 0, 6.28); x.fill();
    }
  });
  clayBump.repeat.set(2, 2);
  return clayBump;
}
const clayUniform = { value: 0 };
/** à appeler à chaque image « stop-motion » : change légèrement la forme (boil) */
export function claySetStep(step) { clayUniform.value = step; }
export function clayMat(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, bumpMap: getClayBump(), bumpScale: 1.2, ...o });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uStep = clayUniform;
    sh.vertexShader = 'uniform float uStep;\n' + sh.vertexShader.replace('#include <begin_vertex>', `
      vec3 transformed = vec3(position);
      float ph = uStep * 1.7;
      float wob = sin(position.x * 9.0 + ph) * sin(position.y * 7.0 + ph * 1.3) * sin(position.z * 8.0 + ph * 0.7);
      transformed += normal * wob * 0.012;`);
  };
  return m;
}

// ======================= CEL-SHADING + CONTOURS =======================
let toonGrad = null;
function getToonGradient() {
  if (toonGrad) return toonGrad;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  toonGrad = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  toonGrad.minFilter = toonGrad.magFilter = THREE.NearestFilter;
  toonGrad.needsUpdate = true;
  return toonGrad;
}
export function toonMat(color, o = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: getToonGradient(), ...o });
}
const outlineMatCache = new Map();
function outlineMat(width) {
  if (outlineMatCache.has(width)) return outlineMatCache.get(width);
  const m = new THREE.MeshBasicMaterial({ color: '#141418', side: THREE.BackSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${width.toFixed(4)};`);
  };
  outlineMatCache.set(width, m);
  return m;
}
/** ajoute un contour « BD » (coque inversée) à tous les maillages de l'objet */
export function addOutlines(obj, width = 0.025) {
  const meshes = [];
  obj.traverse((o) => { if (o.isMesh && !o.userData.noOutline && !o.userData.isOutline) meshes.push(o); });
  for (const m of meshes) {
    const ol = new THREE.Mesh(m.geometry, outlineMat(width));
    ol.userData.isOutline = true; ol.castShadow = false;
    m.add(ol);
  }
  return obj;
}

// ======================= NÉON =======================
export function neonMat(color, intensity = 2.5) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });
}
/** contour lumineux d'une géométrie (arêtes) */
export function neonEdges(geometry, color, intensity = 3, threshold = 20) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geometry, threshold), new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false }));
}
/** tube lumineux le long d'un tracé */
export function neonTube(points, color, r = 0.03, intensity = 3) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r, 8, false), neonMat(color, intensity));
}
export async function makeBloomRenderer(renderer, scene, camera, { strength = 1.1, radius = 0.55, threshold = 0.85 } = {}) {
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), strength, radius, threshold));
  composer.addPass(new OutputPass());
  return () => composer.render();
}

// ======================= PAPIER =======================
let paperTex = null;
function getPaperTex() {
  if (paperTex) return paperTex;
  const R = rng(57);
  paperTex = noiseCanvas(512, (x, s) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 2500; i++) { // fibres
      const v = 215 + Math.floor(R() * 40);
      x.strokeStyle = `rgba(${v},${v},${v - 6},0.35)`; x.lineWidth = 0.6 + R();
      const px = R() * s, py = R() * s, a = R() * 6.28, l = 3 + R() * 14;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
  });
  paperTex.colorSpace = THREE.SRGBColorSpace;
  paperTex.repeat.set(1.5, 1.5);
  return paperTex;
}
export function paperMat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, map: getPaperTex(), roughness: 1, metalness: 0, bumpMap: getPaperTex(), bumpScale: 0.6, ...o });
}
/** silhouette en papier épais (forme 2D extrudée), bord blanc légèrement débordant comme un découpage */
export function paperShape(shape, color, { depth = 0.03, border = true } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
  const m = new THREE.Mesh(geo, paperMat(color));
  m.castShadow = true; m.receiveShadow = true; g.add(m);
  if (border) {
    const b = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: depth * 0.6, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.025, bevelSegments: 1, curveSegments: 24 }), paperMat('#FBF7F0'));
    b.position.z = -depth * 0.45; b.castShadow = true; g.add(b);
  }
  return g;
}
export const shapes = {
  circle(r) { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); return s; },
  ellipse(rx, ry) { const s = new THREE.Shape(); s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0); return s; },
  rrect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  },
  poly(pts) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; },
  star(r1, r2, n = 5) { const p = []; for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n; const r = i % 2 ? r2 : r1; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return shapes.poly(p); },
  crescent(r) {
    // croissant de lune : arc extérieur puis arc intérieur décalé, parcouru en sens inverse
    const s = new THREE.Shape();
    s.absarc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7, false);
    s.absarc(r * 0.55, 0, r * 0.82, Math.PI * 1.42, Math.PI * 0.58, true);
    return s;
  },
};
