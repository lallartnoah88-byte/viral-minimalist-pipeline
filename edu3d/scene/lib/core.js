// Noyau : moteur de rendu, temps déterministe, courbes d'animation, caméra, sous-titres.
import * as THREE from 'three';

export const W = 1080, H = 1920, FPS = 30;

// ---------- Aléatoire reproductible ----------
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Courbes ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
/** progression 0→1 entre t0 et t0+d */
export const prog = (t, t0, d) => clamp((t - t0) / d);
/** apparition « pop » avec dépassement (rebond élastique amorti) */
export function pop(t, t0, d = 0.45) {
  if (t <= t0) return 0;
  const x = (t - t0) / d;
  if (x >= 1.6) return 1;
  return 1 - Math.exp(-6 * x) * Math.cos(9 * x);
}
/** visible entre a et b, avec entrée pop et sortie rétrécissante */
export function life(t, a, b, inD = 0.45, outD = 0.25) {
  if (t < a || t > b + outD) return 0;
  const s = pop(t, a, inD);
  const o = t > b ? 1 - easeIn((t - b) / outD) : 1;
  return Math.max(0, s * o);
}
/** chute avec gravité + rebonds, renvoie la hauteur relative (1 = départ, 0 = posé) */
export function drop(t, t0, d = 0.6) {
  if (t <= t0) return 1;
  const x = (t - t0) / d;
  if (x < 1) return 1 - x * x;
  const b = x - 1;
  const h1 = 0.18 * (1 - Math.pow((b - 0.35) / 0.35, 2));
  if (b < 0.7) return Math.max(0, h1);
  const c = b - 0.7;
  const h2 = 0.05 * (1 - Math.pow((c - 0.18) / 0.18, 2));
  return c < 0.36 ? Math.max(0, h2) : 0;
}

// ---------- Pistes clés (valeurs scalaires ou vecteurs) ----------
export function keyTrack(keys, ease = easeInOut) {
  // keys : [[t, valeur], ...] trié ; valeur nombre ou tableau
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, va] = keys[i], [tb, vb] = keys[i + 1];
      if (t <= tb) {
        const k = ease((t - ta) / (tb - ta));
        return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
      }
    }
    return keys[keys.length - 1][1];
  };
}

// ---------- Caméra : spline Catmull-Rom centripète sur clés temporelles ----------
export class CameraRig {
  constructor(camera, keys) {
    // keys : [{t, pos:[x,y,z], look:[x,y,z], fov}]
    this.camera = camera;
    this.keys = keys;
    this.noise = rng(77);
    this.shakes = [];
  }
  addShake(t0, amp = 0.06, dur = 0.35) { this.shakes.push({ t0, amp, dur }); }
  sample(arr, t, field) {
    const k = this.keys;
    if (t <= k[0].t) return new THREE.Vector3(...k[0][field]);
    let i = 0;
    while (i < k.length - 2 && t > k[i + 1].t) i++;
    const a = k[Math.max(0, i - 1)], b = k[i], c = k[i + 1], d = k[Math.min(k.length - 1, i + 2)];
    const u = easeInOut(clamp((t - b.t) / (c.t - b.t)));
    const P = [a, b, c, d].map((q) => new THREE.Vector3(...q[field]));
    const curve = new THREE.CatmullRomCurve3(P, false, 'centripetal');
    // u est remappé sur le tronçon b→c (1/3 → 2/3 de la courbe à 4 points)
    return curve.getPoint(1 / 3 + u / 3);
  }
  update(t) {
    const pos = this.sample(null, t, 'pos');
    const look = this.sample(null, t, 'look');
    // dérive « caméra portée » très légère, jamais figée
    const n1 = Math.sin(t * 0.9) * 0.025 + Math.sin(t * 2.3 + 1.3) * 0.012;
    const n2 = Math.cos(t * 0.7 + 0.4) * 0.02 + Math.sin(t * 1.9) * 0.01;
    pos.x += n1; pos.y += n2;
    look.x += n2 * 0.5; look.y += n1 * 0.4;
    for (const s of this.shakes) {
      const x = (t - s.t0) / s.dur;
      if (x > 0 && x < 1) {
        const a = s.amp * (1 - x) * (1 - x);
        pos.x += Math.sin(t * 91) * a; pos.y += Math.cos(t * 77) * a; look.x += Math.sin(t * 63) * a * 0.6;
      }
    }
    let fov = 40;
    const k = this.keys;
    let i = 0;
    while (i < k.length - 2 && t > k[i + 1].t) i++;
    const u = easeInOut(clamp((t - k[i].t) / (k[i + 1].t - k[i].t)));
    fov = lerp(k[i].fov ?? 40, k[i + 1].fov ?? 40, t <= k[0].t ? 0 : u);
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }
}

// ---------- Sous-titres (calqués sur la référence : 1 mot, MAJUSCULES, blanc, contour noir, centre écran) ----------
export class Captions {
  constructor(words, opts = {}) {
    this.words = words.map((w) => ({ ...w, label: Captions.label(w.text) })).filter((w) => w.label);
    this.y = opts.y ?? H * 0.5;
    this.size = opts.size ?? 64;
  }
  static label(text) {
    // règles de la référence : un mot, majuscules, aucune ponctuation (apostrophes et traits d'union conservés)
    return text.replace(/[.,:;!?…«»"]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  }
  current(t) {
    let cur = null;
    for (const w of this.words) { if (w.start <= t + 0.03) cur = w; else break; }
    if (!cur) return null;
    // le mot reste affiché jusqu'au suivant, sauf pendant les silences longs
    const next = this.words[this.words.indexOf(cur) + 1];
    const hold = next ? Math.min(next.start, cur.end + 0.45) : cur.end + 0.6;
    return t <= hold ? cur : null;
  }
  draw(ctx, t) {
    const w = this.current(t);
    if (!w) return;
    const age = t - w.start;
    const s = 1 + 0.12 * Math.exp(-age * 18) * (age > 0 ? 1 : 0); // micro « pop » d'apparition
    ctx.save();
    ctx.translate(W / 2, this.y);
    ctx.scale(s, s);
    ctx.font = `900 ${this.size}px "MontserratBlack"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fs = this.size;
    const maxW = W * 0.86;
    const mw = ctx.measureText(w.label).width;
    if (mw > maxW) { fs = this.size * maxW / mw; ctx.font = `900 ${fs}px "MontserratBlack"`; }
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.lineWidth = fs * 0.13;
    ctx.strokeStyle = '#111';
    ctx.strokeText(w.label, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(w.label, 0, 0);
    ctx.restore();
  }
}

// ---------- Moteur de rendu ----------
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

/** Compose le rendu 3D + sous-titres sur un canvas 2D final */
export function createCompositor() {
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');
  return { out, ctx };
}

// ---------- Indices temporels depuis timings.json ----------
export function makeClock(timings) {
  const bySeg = {};
  for (const s of timings.segments) bySeg[s.id] = s;
  const words = {};
  for (const w of timings.words) (words[w.seg] ||= [])[w.i] = w;
  return {
    seg: (id) => bySeg[id].start,
    segEnd: (id) => bySeg[id].end,
    // mot n° i du segment (début) ; i négatif = depuis la fin
    w: (id, i) => { const a = words[id]; return a[i < 0 ? a.length + i : i].start; },
    wEnd: (id, i) => { const a = words[id]; return a[i < 0 ? a.length + i : i].end; },
    duration: timings.duration,
  };
}
