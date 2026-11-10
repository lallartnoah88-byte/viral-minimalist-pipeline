#!/usr/bin/env node
/*
 * generate_svgs.js
 * Génère les 100 icônes vectorielles minimalistes (5 dossiers x 20 icônes).
 * Aucune dépendance externe : uniquement fs/path de Node.js.
 *
 * Règles de format :
 *  - viewBox="0 0 240 240", width="240", height="240"
 *  - Chaque forme : fill="none" stroke="#FFFFFF" stroke-width="5"
 *    stroke-linecap="round" stroke-linejoin="round"
 *  - Géométrie centrée autour de (120,120) pour Trim Paths / stroke-dashoffset.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(
  ROOT,
  'DIST_PACK_TO_SELL',
  'ULTIMATE_MINIMALIST_ANIMATION_PACK',
  '01_Icones_Minimalistes_SVG'
);

const STYLE =
  'fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */
const n = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
const rad = (deg) => (deg * Math.PI) / 180;
const pt = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

const P = (d) => `<path ${STYLE} d="${d}"/>`;
const C = (cx, cy, r) => `<circle ${STYLE} cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`;
const R = (x, y, w, h, rx = 0) =>
  `<rect ${STYLE} x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rx)}"/>`;
const L = (x1, y1, x2, y2) =>
  `<line ${STYLE} x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const PL = (pts) => `<polyline ${STYLE} points="${pts.map((p) => `${n(p[0])},${n(p[1])}`).join(' ')}"/>`;
const PG = (pts) => P(`M${pts.map((p) => `${n(p[0])} ${n(p[1])}`).join(' L')} Z`);
const E = (cx, cy, rx, ry) =>
  P(`M${n(cx - rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 1 1 ${n(cx + rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 1 1 ${n(cx - rx)} ${n(cy)} Z`);

/** Arc de cercle (degrés, 0 = est, sens horaire écran). */
function arcD(cx, cy, r, a0, a1) {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${n(x0)} ${n(y0)} A${n(r)} ${n(r)} 0 ${large} ${sweep} ${n(x1)} ${n(y1)}`;
}
const A = (cx, cy, r, a0, a1) => P(arcD(cx, cy, r, a0, a1));

/** Pointe de flèche (deux ailes) au point (x,y), orientée selon angle (degrés). */
function head(x, y, angle, size = 14, spread = 32) {
  const a = pt(x, y, size, angle + 180 - spread);
  const b = pt(x, y, size, angle + 180 + spread);
  return PL([a, [x, y], b]);
}
/** Flèche complète de (x1,y1) vers (x2,y2). */
function arrow(x1, y1, x2, y2, size = 14) {
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return L(x1, y1, x2, y2) + head(x2, y2, ang, size);
}
/** Polygone régulier. */
function regular(cx, cy, r, sides, rot = -90) {
  const pts = [];
  for (let i = 0; i < sides; i++) pts.push(pt(cx, cy, r, rot + (360 / sides) * i));
  return pts;
}
/** Engrenage : polygone dentelé. */
function gear(cx, cy, rOut, rIn, teeth, rot = 0) {
  const pts = [];
  const step = 360 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = rot + i * step;
    pts.push(pt(cx, cy, rIn, a - step * 0.5));
    pts.push(pt(cx, cy, rIn, a - step * 0.22));
    pts.push(pt(cx, cy, rOut, a - step * 0.14));
    pts.push(pt(cx, cy, rOut, a + step * 0.14));
    pts.push(pt(cx, cy, rIn, a + step * 0.22));
  }
  return PG(pts);
}
/** Courbe échantillonnée y = f(x). */
function curve(f, x0, x1, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    pts.push([x, f(x)]);
  }
  return pts;
}
/** Avatar (tête + épaules), centré sur (cx, top). */
function avatar(cx, cy, s = 1) {
  const hr = 20 * s;
  const headY = cy - 30 * s;
  return (
    C(cx, headY, hr) +
    P(
      `M${n(cx - 46 * s)} ${n(cy + 52 * s)} C${n(cx - 46 * s)} ${n(cy + 8 * s)} ${n(cx - 24 * s)} ${n(cy - 2 * s)} ${n(cx)} ${n(cy - 2 * s)} C${n(cx + 24 * s)} ${n(cy - 2 * s)} ${n(cx + 46 * s)} ${n(cy + 8 * s)} ${n(cx + 46 * s)} ${n(cy + 52 * s)}`
    )
  );
}
/** Personnage filaire : tête + polylignes des membres. */
function stick(o) {
  let s = C(o.head[0], o.head[1], o.r || 12);
  s += PL([o.neck, o.hip]);
  s += PL([o.neck, o.lElbow, o.lHand]);
  s += PL([o.neck, o.rElbow, o.rHand]);
  s += PL([o.hip, o.lKnee, o.lFoot]);
  s += PL([o.hip, o.rKnee, o.rFoot]);
  return s;
}
/** Générateur pseudo-aléatoire déterministe (Mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Profil de tête tourné vers la droite. */
const HEAD_PROFILE =
  'M92 200 L92 168 C70 160 58 138 58 112 C58 72 88 44 126 44 C162 44 186 70 186 104 L198 132 L184 136 L186 156 C186 168 176 172 164 170 L150 168 L150 200';

/** Contour de cerveau (vue latérale stylisée, symétrique). */
const BRAIN_LEFT =
  'M120 58 C104 46 80 50 72 66 C54 66 42 82 46 100 C32 110 32 132 46 142 C42 160 56 176 74 174 C82 190 106 194 120 180';
const mirror = (d) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${n(240 - parseFloat(x))} ${y}`);
const BRAIN =
  P(BRAIN_LEFT) +
  P(mirror(BRAIN_LEFT)) +
  L(120, 58, 120, 180);

/** Coeur. */
const HEART =
  'M120 196 C96 176 44 142 44 96 C44 70 64 52 88 52 C102 52 114 60 120 72 C126 60 138 52 152 52 C176 52 196 70 196 96 C196 142 144 176 120 196 Z';

/** Nuage. */
const CLOUD =
  'M70 138 C48 138 40 112 58 100 C56 76 84 64 100 76 C110 54 146 52 156 78 C178 72 198 92 188 114 C204 122 198 140 180 138 Z';

/** Flamme. */
const FLAME =
  'M120 204 C84 204 64 178 66 148 C68 118 92 104 96 72 C110 86 114 100 112 116 C124 100 132 76 128 40 C162 64 178 104 176 142 C174 178 154 204 120 204 Z';
const FLAME_INNER = 'M120 186 C104 186 94 174 96 158 C98 142 112 134 114 118 C130 132 142 148 140 164 C138 178 132 186 120 186 Z';

/* ------------------------------------------------------------------ */
/* Catalogue des 100 icônes                                            */
/* ------------------------------------------------------------------ */
const ICONS = {
  '01_Psychologie_&_Cerveau': {
    '01_brain_outline.svg': () =>
      BRAIN +
      P('M78 92 C92 86 100 96 96 108') +
      P('M62 128 C76 120 90 128 88 142') +
      P('M162 92 C148 86 140 96 144 108') +
      P('M178 128 C164 120 150 128 152 142'),
    '02_brain_circuit.svg': () =>
      BRAIN +
      PL([[120, 92], [96, 92], [84, 104]]) + C(80, 108, 5) +
      PL([[120, 120], [70, 120]]) + C(64, 120, 5) +
      PL([[120, 148], [100, 148], [88, 160]]) + C(84, 164, 5) +
      PL([[120, 92], [144, 92], [156, 104]]) + C(160, 108, 5) +
      PL([[120, 120], [170, 120]]) + C(176, 120, 5) +
      PL([[120, 148], [140, 148], [152, 160]]) + C(156, 164, 5),
    '03_chaos_spiral.svg': () => {
      const pts = [];
      for (let i = 0; i <= 260; i++) {
        const t = (i / 260) * Math.PI * 9;
        const r = (3 + 3.0 * t) * (1 + 0.1 * Math.sin(7 * t + 1.3));
        pts.push([120 + r * Math.cos(t), 120 + r * Math.sin(t)]);
      }
      return PL(pts);
    },
    '04_clarity_line.svg': () => {
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const x = 26 + i * 1.25;
        const amp = 34 * Math.pow(1 - i / 80, 1.4);
        pts.push([x, 120 + amp * Math.sin(i * 0.95) * Math.cos(i * 0.31)]);
      }
      pts.push([206, 120]);
      return PL(pts) + C(212, 120, 6) + L(126, 104, 126, 136);
    },
    '05_all_seeing_eye.svg': () =>
      PG([[120, 34], [212, 196], [28, 196]]) +
      P('M70 148 Q120 98 170 148 Q120 198 70 148 Z') +
      C(120, 148, 16) + C(120, 148, 5) +
      L(120, 14, 120, 24) + L(76, 30, 82, 40) + L(164, 30, 158, 40),
    '06_focused_eye.svg': () =>
      P('M28 120 Q120 36 212 120 Q120 204 28 120 Z') +
      C(120, 120, 34) + C(120, 120, 12) +
      L(120, 22, 120, 52) + L(120, 188, 120, 218) + L(14, 120, 22, 120) + L(218, 120, 226, 120),
    '07_low_battery_10.svg': () =>
      R(40, 84, 148, 72, 12) + R(188, 104, 14, 32, 4) + R(52, 96, 14, 48, 3) +
      L(120, 104, 120, 124) + C(120, 136, 2),
    '08_full_battery.svg': () =>
      R(40, 84, 148, 72, 12) + R(188, 104, 14, 32, 4) +
      R(54, 98, 24, 44, 3) + R(86, 98, 24, 44, 3) + R(118, 98, 24, 44, 3) + R(150, 98, 24, 44, 3),
    '09_labyrinth_mind.svg': () =>
      A(120, 120, 92, 20, 340) + A(120, 120, 70, 200, 520) + A(120, 120, 48, 100, 420) +
      A(120, 120, 26, -60, 250) + L(120, 28, 120, 50) + L(190, 120, 212, 120) +
      L(50, 120, 72, 120) + C(120, 120, 5),
    '10_open_tabs_window.svg': () =>
      R(30, 64, 180, 136, 10) + L(30, 96, 210, 96) +
      P('M38 64 L44 44 L86 44 L92 64') + P('M92 64 L98 44 L140 44 L146 64') +
      P('M146 64 L152 44 L194 44 L200 64') +
      L(50, 120, 150, 120) + L(50, 142, 190, 142) + L(50, 164, 120, 164) + L(176, 80, 190, 80),
    '11_balance_scale.svg': () =>
      L(120, 40, 120, 196) + L(84, 196, 156, 196) + L(48, 64, 192, 64) + C(120, 40, 7) +
      PL([[48, 64], [26, 128], [70, 128], [48, 64]]) + P('M26 128 Q48 152 70 128') +
      PL([[192, 64], [170, 128], [214, 128], [192, 64]]) + P('M170 128 Q192 152 214 128'),
    '12_broken_chain.svg': () =>
      R(18, 96, 82, 48, 24) + R(140, 96, 82, 48, 24) +
      L(108, 84, 100, 72) + L(120, 82, 120, 66) + L(132, 84, 140, 72) +
      L(108, 156, 100, 168) + L(120, 158, 120, 174) + L(132, 156, 140, 168),
    '13_locked_padlock.svg': () =>
      R(58, 108, 124, 96, 14) + P('M80 108 L80 82 C80 56 98 40 120 40 C142 40 160 56 160 82 L160 108') +
      C(120, 146, 12) + L(120, 158, 120, 178),
    '14_unlocked_padlock.svg': () =>
      R(58, 108, 124, 96, 14) + P('M80 108 L80 66 C80 40 98 24 120 24 C142 24 160 40 160 66 L160 74') +
      C(120, 146, 12) + L(120, 158, 120, 178),
    '15_neural_network.svg': () => {
      const layers = [[60, 120, 180], [84, 120, 156], [60, 120, 180].map((y) => y)];
      const xs = [44, 120, 196];
      const ys = [[64, 120, 176], [84, 156], [64, 120, 176]];
      let s = '';
      for (const a of ys[0]) for (const b of ys[1]) s += L(xs[0] + 12, a, xs[1] - 12, b);
      for (const a of ys[1]) for (const b of ys[2]) s += L(xs[1] + 12, a, xs[2] - 12, b);
      ys.forEach((col, i) => col.forEach((y) => (s += C(xs[i], y, 12))));
      void layers;
      return s;
    },
    '16_thought_cloud_storm.svg': () =>
      P(CLOUD) + PL([[124, 140], [108, 170], [126, 170], [110, 204]]) +
      L(76, 156, 68, 176) + L(160, 156, 152, 176) + L(176, 156, 170, 170),
    '17_meditation_lotus.svg': () =>
      P('M120 70 C140 96 140 140 120 168 C100 140 100 96 120 70 Z') +
      P('M120 168 C96 156 72 128 74 98 C96 106 112 128 120 168') +
      P('M120 168 C144 156 168 128 166 98 C144 106 128 128 120 168') +
      P('M120 168 C86 170 48 152 34 126 C64 122 96 140 120 168') +
      P('M120 168 C154 170 192 152 206 126 C176 122 144 140 120 168') +
      L(40, 194, 200, 194),
    '18_dopamine_molecule_minimal.svg': () => {
      const hex = regular(96, 128, 40, 6, -90);
      return (
        PG(hex) +
        P(`M${n(hex[1][0] - 8)} ${n(hex[1][1] + 6)} L${n(hex[2][0] - 8)} ${n(hex[2][1] - 6)}`) +
        PL([hex[0], [96, 60]]) + C(96, 52, 7) +
        PL([hex[5], [44, 72]]) + C(38, 66, 7) +
        PL([hex[1], [166, 108], [196, 128], [196, 162]]) + C(196, 172, 9)
      );
    },
    '19_pendulum_swing.svg': () =>
      L(70, 36, 170, 36) + C(120, 44, 5) + L(120, 49, 164, 160) + C(172, 178, 18) +
      P(arcD(120, 44, 150, 60, 120)) + P(`M${n(pt(120, 44, 150, 60)[0])} ${n(pt(120, 44, 150, 60)[1])} l-4 -16`),
    '20_mirror_reflection.svg': () =>
      E(120, 100, 56, 74) + E(120, 100, 44, 62) + L(120, 174, 120, 214) + L(92, 214, 148, 214) +
      L(96, 70, 112, 54) + L(96, 92, 128, 60),
  },

  '02_Temps_&_Discipline': {
    '01_hourglass_flowing.svg': () =>
      L(60, 30, 180, 30) + L(60, 210, 180, 210) +
      P('M72 30 C72 80 112 100 112 120 C112 140 72 160 72 210') +
      P('M168 30 C168 80 128 100 128 120 C128 140 168 160 168 210') +
      P('M90 70 L150 70 C140 90 126 100 120 106 C114 100 100 90 90 70 Z') +
      L(120, 112, 120, 180) + P('M84 202 Q120 168 156 202'),
    '02_minimal_clock.svg': () => {
      let s = C(120, 120, 92) + L(120, 120, 120, 62) + L(120, 120, 160, 140) + C(120, 120, 5);
      for (let i = 0; i < 12; i++) {
        const [x0, y0] = pt(120, 120, 78, i * 30);
        const [x1, y1] = pt(120, 120, i % 3 === 0 ? 64 : 70, i * 30);
        s += L(x0, y0, x1, y1);
      }
      return s;
    },
    '03_fast_stopwatch.svg': () =>
      C(132, 132, 76) + R(118, 34, 28, 14, 4) + L(132, 48, 132, 56) + L(186, 70, 196, 60) +
      L(132, 132, 168, 92) + C(132, 132, 5) +
      L(14, 108, 44, 108) + L(8, 132, 40, 132) + L(14, 156, 44, 156),
    '04_calendar_grid.svg': () => {
      let s = R(34, 52, 172, 156, 14) + L(34, 92, 206, 92) + L(78, 36, 78, 66) + L(162, 36, 162, 66);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += R(52 + c * 38, 106 + r * 32, 20, 18, 3);
      return s;
    },
    '05_discipline_stairs.svg': () =>
      PL([[26, 206], [26, 176], [66, 176], [66, 146], [106, 146], [106, 116], [146, 116], [146, 86], [186, 86], [186, 56], [214, 56]]) +
      L(26, 206, 214, 206) + L(200, 56, 200, 18) + PG([[200, 18], [228, 28], [200, 38]]),
    '06_target_bullseye.svg': () => C(120, 120, 92) + C(120, 120, 62) + C(120, 120, 32) + C(120, 120, 6),
    '07_arrow_hitting_target.svg': () =>
      C(108, 132, 84) + C(108, 132, 54) + C(108, 132, 24) +
      L(108, 132, 208, 32) + head(108, 132, 135, 18) +
      L(208, 32, 212, 12) + L(208, 32, 228, 28) + L(196, 44, 200, 24) + L(196, 44, 216, 40),
    '08_scattered_arrows_12.svg': () => {
      let s = C(120, 120, 10);
      const rand = rng(1208);
      for (let i = 0; i < 12; i++) {
        const base = i * 30 + (rand() - 0.5) * 24;
        const dev = (rand() - 0.5) * 70;
        const r0 = 30 + rand() * 18;
        const len = 34 + rand() * 22;
        const [x0, y0] = pt(120, 120, r0, base);
        const [x1, y1] = [x0 + len * Math.cos(rad(base + dev)), y0 + len * Math.sin(rad(base + dev))];
        s += arrow(x0, y0, x1, y1, 10);
      }
      return s;
    },
    '09_compass_north.svg': () =>
      C(120, 120, 92) + PG([[120, 46], [136, 120], [120, 194], [104, 120]]) + L(104, 120, 136, 120) +
      C(120, 120, 5) + PL([[110, 30], [110, 10], [130, 30], [130, 10]]),
    '10_metronome_rhythm.svg': () =>
      PG([[92, 30], [148, 30], [186, 206], [54, 206]]) + L(66, 172, 174, 172) +
      L(120, 172, 156, 52) + R(138, 92, 24, 16, 3) + C(120, 172, 5),
    '11_habit_loop_circle.svg': () =>
      A(120, 120, 80, -60, 50) + head(...pt(120, 120, 80, 50), 140, 14) +
      A(120, 120, 80, 60, 170) + head(...pt(120, 120, 80, 170), 260, 14) +
      A(120, 120, 80, 180, 290) + head(...pt(120, 120, 80, 290), 20, 14) +
      C(...pt(120, 120, 80, -90), 10) + C(...pt(120, 120, 80, 30), 10) + C(...pt(120, 120, 80, 150), 10),
    '12_check_mark_shield.svg': () =>
      P('M120 22 L196 50 L196 110 C196 160 162 198 120 218 C78 198 44 160 44 110 L44 50 Z') +
      PL([[82, 120], [110, 148], [162, 92]]),
    '13_infinite_loop.svg': () =>
      P('M120 120 C96 84 34 84 34 120 C34 156 96 156 120 120 C144 84 206 84 206 120 C206 156 144 156 120 120 Z'),
    '14_progress_bar_99.svg': () =>
      R(24, 98, 192, 44, 22) + R(36, 110, 166, 20, 10) +
      L(24, 170, 24, 182) + L(216, 170, 216, 182) + L(24, 176, 216, 176) +
      C(170, 62, 7) + C(202, 82, 7) + L(206, 54, 166, 90),
    '15_Loading_spinner.svg': () => {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45 - 90;
        const [x0, y0] = pt(120, 120, 40, a);
        const [x1, y1] = pt(120, 120, 40 + 18 + i * 5, a);
        s += L(x0, y0, x1, y1);
      }
      return s;
    },
    '16_sunrise_horizon.svg': () => {
      let s = L(16, 150, 224, 150) + A(120, 150, 50, 180, 360);
      for (let i = 0; i < 7; i++) {
        const a = 180 + 15 + i * 25;
        const [x0, y0] = pt(120, 150, 66, a);
        const [x1, y1] = pt(120, 150, 90, a);
        s += L(x0, y0, x1, y1);
      }
      return s + L(54, 176, 186, 176) + L(86, 200, 154, 200);
    },
    '17_daily_tally_marks.svg': () => {
      let s = '';
      for (let g = 0; g < 2; g++) {
        const ox = 34 + g * 96;
        for (let i = 0; i < 4; i++) s += L(ox + i * 18, 70, ox + i * 18, 170);
        s += L(ox - 12, 150, ox + 66, 90);
      }
      return s + L(30, 196, 210, 196);
    },
    '18_anchor_stability.svg': () =>
      C(120, 44, 16) + L(120, 60, 120, 206) + L(84, 88, 156, 88) +
      P('M40 140 C44 180 80 206 120 206 C160 206 196 180 200 140') +
      PL([[24, 152], [40, 136], [58, 152]]) + PL([[182, 152], [200, 136], [216, 152]]),
    '19_funnel_focus.svg': () =>
      E(120, 50, 88, 18) + P('M32 50 L106 140 L106 184 L134 200 L134 140 L208 50') +
      C(76, 18, 4) + C(120, 12, 4) + C(164, 18, 4) + arrow(120, 206, 120, 230, 8),
    '20_milestone_flag.svg': () =>
      L(84, 32, 84, 196) + P('M84 36 C112 22 136 50 164 36 C176 30 186 32 194 36 L194 100 C186 96 176 94 164 100 C136 114 112 86 84 100') +
      P('M30 196 Q84 182 138 196 T210 204') + C(84, 196, 6),
  },

  '03_Business_&_Croissance': {
    '01_exponential_curve.svg': () =>
      PL([[30, 24], [30, 210], [216, 210]]) +
      PL(curve((x) => 204 - 170 * Math.pow((x - 36) / 172, 3.2), 36, 208, 50)) + C(208, 34, 6),
    '02_crash_chart.svg': () =>
      PL([[30, 24], [30, 210], [216, 210]]) +
      PL([[40, 180], [70, 150], [92, 160], [120, 110], [140, 120], [160, 64], [176, 150], [200, 190]]) +
      head(200, 190, 59, 16),
    '03_candlestick_chart.svg': () => {
      let s = PL([[24, 24], [24, 214], [216, 214]]);
      const c = [[48, 150, 186, 136, 196], [82, 120, 160, 104, 176], [116, 132, 168, 116, 184], [150, 80, 124, 60, 140], [184, 50, 96, 36, 112]];
      for (const [x, top, bot, wt, wb] of c) s += L(x, wt, x, top) + R(x - 11, top, 22, bot - top, 2) + L(x, bot, x, wb);
      return s;
    },
    '04_diamond_value.svg': () =>
      PG([[70, 56], [170, 56], [210, 98], [120, 206], [30, 98]]) + L(30, 98, 210, 98) +
      PL([[70, 56], [96, 98], [120, 56], [144, 98], [170, 56]]) + PL([[96, 98], [120, 206], [144, 98]]),
    '05_minimal_rocket.svg': () =>
      P('M120 18 C150 42 162 84 160 140 L80 140 C78 84 90 42 120 18 Z') + C(120, 84, 14) +
      P('M80 112 L52 150 L52 172 L82 150') + P('M160 112 L188 150 L188 172 L158 150') +
      L(100, 140, 100, 162) + L(140, 140, 140, 162) + P('M108 162 Q120 214 132 162'),
    '06_leverage_fulcrum.svg': () =>
      PG([[120, 150], [150, 200], [90, 200]]) + L(20, 200, 220, 200) + L(24, 120, 214, 178) +
      R(28, 82, 40, 34, 4) + arrow(206, 116, 206, 160, 12),
    '07_flywheel_gears.svg': () =>
      gear(92, 104, 62, 50, 12, 0) + C(92, 104, 20) + gear(172, 172, 42, 32, 9, 10) + C(172, 172, 12),
    '08_network_nodes.svg': () => {
      let s = '';
      const nodes = regular(120, 120, 82, 6, -90);
      for (let i = 0; i < 6; i++) {
        const [x, y] = nodes[i];
        const [x2, y2] = nodes[(i + 1) % 6];
        s += L(x, y, x2, y2);
        const dx = x - 120, dy = y - 120, d = Math.hypot(dx, dy);
        s += L(120 + (dx / d) * 22, 120 + (dy / d) * 22, x - (dx / d) * 12, y - (dy / d) * 12);
      }
      nodes.forEach(([x, y]) => (s += C(x, y, 12)));
      return s + C(120, 120, 22);
    },
    '09_magnet_attraction.svg': () =>
      P('M60 40 L60 116 C60 150 86 176 120 176 C154 176 180 150 180 116 L180 40 L144 40 L144 116 C144 130 134 140 120 140 C106 140 96 130 96 116 L96 40 Z') +
      L(60, 70, 96, 70) + L(144, 70, 180, 70) +
      A(120, 120, 98, 70, 110) + A(120, 120, 114, 76, 104) + C(120, 222, 5),
    '10_key_solution.svg': () =>
      C(72, 120, 40) + C(72, 120, 14) + L(112, 120, 214, 120) + L(176, 120, 176, 150) + L(204, 120, 204, 144),
    '11_crown_authority.svg': () =>
      PG([[34, 172], [26, 74], [78, 118], [120, 50], [162, 118], [214, 74], [206, 172]]) +
      L(34, 198, 206, 198) + C(26, 66, 7) + C(120, 42, 7) + C(214, 66, 7) + C(120, 140, 8),
    '12_pyramid_hierarchy.svg': () =>
      PG([[120, 26], [216, 206], [24, 206]]) + L(92, 78, 148, 78) + L(66, 126, 174, 126) + L(42, 172, 198, 172),
    '13_bridge_connection.svg': () =>
      L(14, 120, 226, 120) + P('M30 186 C60 120 180 120 210 186') + L(30, 100, 30, 200) + L(210, 100, 210, 200) +
      L(70, 136, 70, 120) + L(100, 126, 100, 120) + L(140, 126, 140, 120) + L(170, 136, 170, 120) +
      P('M14 210 Q40 200 66 210 T118 210 T170 210 T226 210'),
    '14_magnifying_glass.svg': () => C(102, 102, 64) + L(148, 148, 210, 210) + A(102, 102, 44, 200, 260),
    '15_lightning_bolt.svg': () => PG([[136, 18], [58, 132], [114, 132], [100, 222], [182, 104], [126, 104]]),
    '16_bar_chart_growth.svg': () =>
      PL([[24, 24], [24, 214], [216, 214]]) + R(44, 170, 24, 44) + R(82, 146, 24, 68) + R(120, 120, 24, 94) +
      R(158, 90, 24, 124) + arrow(44, 130, 198, 40, 16),
    '17_pie_chart_1_percent.svg': () => {
      const [x0, y0] = pt(120, 128, 86, -90);
      const [x1, y1] = pt(120, 128, 86, -86.4);
      const [w0x, w0y] = pt(128, 106, 92, -92);
      const [w1x, w1y] = pt(128, 106, 92, -84.4);
      return (
        P(`M120 128 L${n(x1)} ${n(y1)} ${arcD(120, 128, 86, -86.4, 270).replace(/^M[^A]+/, '')} Z`) +
        L(120, 128, x0, y0) +
        P(`M128 106 L${n(w0x)} ${n(w0y)} A92 92 0 0 1 ${n(w1x)} ${n(w1y)} Z`)
      );
    },
    '18_vault_safe.svg': () => {
      let s = R(30, 30, 180, 180, 14) + R(46, 46, 148, 148, 8) + C(128, 120, 40) + C(128, 120, 10);
      for (let i = 0; i < 6; i++) {
        const [x0, y0] = pt(128, 120, 16, i * 60);
        const [x1, y1] = pt(128, 120, 54, i * 60);
        s += L(x0, y0, x1, y1);
      }
      return s + L(30, 72, 22, 72) + L(30, 168, 22, 168) + L(60, 210, 60, 222) + L(180, 210, 180, 222);
    },
    '19_handshake_minimal.svg': () =>
      PL([[10, 112], [52, 96], [92, 104]]) + PL([[230, 112], [188, 96], [150, 100]]) +
      P('M92 104 L140 86 C150 82 158 92 150 100 L124 118') +
      P('M150 100 L176 128 C182 136 174 146 166 140') +
      P('M166 140 C170 148 162 158 154 152 L146 146') +
      P('M146 146 C148 156 140 164 132 158 L124 152') +
      P('M124 152 C124 162 114 166 108 160 L70 124 L52 96') + L(188, 96, 176, 128),
    '20_trophy_cup.svg': () =>
      P('M70 34 L170 34 L170 84 C170 116 148 140 120 140 C92 140 70 116 70 84 Z') +
      P('M70 52 L42 52 C40 84 52 100 74 104') + P('M170 52 L198 52 C200 84 188 100 166 104') +
      L(120, 140, 120, 176) + R(84, 176, 72, 18, 4) + L(70, 212, 170, 212) + L(84, 194, 84, 212) + L(156, 194, 156, 212),
  },

  '04_Stoicisme_&_Philosophie': {
    '01_greek_column.svg': () =>
      P('M54 40 L186 40 C186 54 172 60 160 60 L80 60 C68 60 54 54 54 40 Z') + L(74, 72, 166, 72) +
      L(90, 72, 90, 180) + L(110, 72, 110, 180) + L(130, 72, 130, 180) + L(150, 72, 150, 180) +
      L(74, 180, 166, 180) + R(60, 192, 120, 16, 2),
    '02_laurel_wreath.svg': () => {
      let s = A(120, 120, 84, 100, 250) + A(120, 120, 84, -70, 80);
      for (let i = 0; i < 6; i++) {
        for (const side of [-1, 1]) {
          const a = side < 0 ? 240 - i * 24 : -60 + i * 24;
          const [x, y] = pt(120, 120, 84, a);
          const tangent = a + side * 90 + 60 * side;
          const [tx, ty] = pt(x, y, 30, tangent);
          const [cx1, cy1] = pt(x, y, 18, tangent - 40);
          const [cx2, cy2] = pt(x, y, 18, tangent + 40);
          s += P(`M${n(x)} ${n(y)} Q${n(cx1)} ${n(cy1)} ${n(tx)} ${n(ty)} Q${n(cx2)} ${n(cy2)} ${n(x)} ${n(y)} Z`);
        }
      }
      return s + L(108, 206, 132, 206);
    },
    '03_stoic_sword.svg': () =>
      PG([[120, 14], [132, 34], [132, 158], [108, 158], [108, 34]]) + L(120, 34, 120, 150) +
      L(76, 158, 164, 158) + L(76, 158, 70, 150) + L(164, 158, 170, 150) + L(120, 158, 120, 202) + C(120, 214, 10),
    '04_spartan_shield.svg': () => C(120, 120, 96) + C(120, 120, 80) + PL([[72, 178], [120, 62], [168, 178]]),
    '05_sacred_flame.svg': () => P(FLAME) + P(FLAME_INNER) + L(80, 222, 160, 222),
    '06_mountain_peak.svg': () =>
      PL([[10, 204], [86, 74], [122, 132], [154, 96], [230, 204]]) + L(10, 204, 230, 204) +
      PL([[62, 114], [76, 104], [86, 116], [98, 104], [108, 112]]) + C(186, 50, 18),
    '07_eclipse_sun_moon.svg': () => {
      let s = C(120, 120, 56) + P(`M148 71.5 A56 56 0 1 0 148 168.5 A44 44 0 1 1 148 71.5 Z`);
      for (let i = 0; i < 12; i++) {
        const [x0, y0] = pt(120, 120, 72, i * 30);
        const [x1, y1] = pt(120, 120, i % 2 ? 88 : 100, i * 30);
        s += L(x0, y0, x1, y1);
      }
      return s;
    },
    '08_memento_mori_skull_minimal.svg': () =>
      P('M120 26 C70 26 40 60 40 104 C40 132 52 150 70 160 L70 190 L170 190 L170 160 C188 150 200 132 200 104 C200 60 170 26 120 26 Z') +
      C(88, 112, 20) + C(152, 112, 20) + PG([[120, 136], [132, 160], [108, 160]]) +
      L(96, 176, 96, 204) + L(120, 176, 120, 206) + L(144, 176, 144, 204) + L(80, 206, 160, 206),
    '09_amor_fati_fire.svg': () =>
      C(120, 120, 100) +
      P('M120 194 C92 194 76 174 78 150 C80 126 98 116 102 92 C112 102 116 114 114 126 C124 112 130 92 126 64 C154 84 166 116 164 146 C162 174 146 194 120 194 Z'),
    '10_temple_pantheon.svg': () =>
      PG([[120, 28], [214, 78], [26, 78]]) + L(26, 90, 214, 90) +
      L(48, 98, 48, 178) + L(80, 98, 80, 178) + L(112, 98, 112, 178) + L(128, 98, 128, 178) +
      L(160, 98, 160, 178) + L(192, 98, 192, 178) + L(30, 186, 210, 186) + L(18, 204, 222, 204) + C(120, 62, 6),
    '11_ying_yang_minimal.svg': () =>
      C(120, 120, 92) + P('M120 28 A46 46 0 0 1 120 120 A46 46 0 0 0 120 212') + C(120, 74, 10) + C(120, 166, 10),
    '12_sacred_geometry_hex.svg': () => {
      const hex = regular(120, 120, 92, 6, -90);
      const t1 = regular(120, 120, 92, 3, -90);
      const t2 = regular(120, 120, 92, 3, 90);
      return PG(hex) + PG(t1) + PG(t2) + C(120, 120, 46) + C(120, 120, 6);
    },
    '13_vesica_piscis.svg': () => C(92, 120, 66) + C(148, 120, 66) + L(120, 58, 120, 182) + L(26, 120, 214, 120),
    '14_open_book_wisdom.svg': () =>
      P('M120 70 C96 52 56 48 22 56 L22 186 C56 178 96 182 120 200 Z') +
      P('M120 70 C144 52 184 48 218 56 L218 186 C184 178 144 182 120 200 Z') +
      P('M42 86 C64 82 86 84 102 92') + P('M42 116 C64 112 86 114 102 122') + P('M42 146 C64 142 86 144 102 152') +
      P('M198 86 C176 82 154 84 138 92') + P('M198 116 C176 112 154 114 138 122') + L(120, 24, 120, 44),
    '15_quill_feather.svg': () =>
      P('M206 20 C150 30 96 74 76 150 L90 164 C166 144 210 90 206 20 Z') + L(206, 20, 40, 214) +
      L(150, 76, 176, 72) + L(124, 106, 160, 100) + L(102, 136, 132, 132) + L(40, 214, 60, 214),
    '16_obelisk_monolith.svg': () =>
      PG([[120, 14], [140, 40], [150, 196], [90, 196], [100, 40]]) + L(100, 40, 140, 40) +
      L(60, 196, 180, 196) + L(40, 214, 200, 214) + L(120, 60, 120, 84),
    '17_wave_turbulence.svg': () => {
      let s = '';
      for (let k = 0; k < 5; k++) {
        const y0 = 56 + k * 32;
        const amp = 8 + k * 4;
        s += PL(curve((x) => y0 + amp * Math.sin(x / (14 + k * 2) + k), 20, 220, 60));
      }
      return s;
    },
    '18_still_water_horizon.svg': () =>
      L(14, 130, 226, 130) + C(120, 84, 30) +
      L(98, 150, 142, 150) + L(106, 168, 134, 168) + L(112, 186, 128, 186) + L(40, 150, 70, 150) + L(170, 150, 200, 150),
    '19_atlas_globe.svg': () =>
      C(120, 104, 78) + E(120, 104, 34, 78) + L(120, 26, 120, 182) + L(42, 104, 198, 104) +
      P('M52 66 Q120 84 188 66') + P('M52 142 Q120 124 188 142') +
      P('M56 160 C80 198 160 198 184 160') + L(120, 194, 120, 210) + L(84, 214, 156, 214),
    '20_philosopher_stone_triangle.svg': () => {
      const tri = regular(120, 128, 92, 3, -90);
      return C(120, 128, 92) + PG(tri) + C(120, 128, 46) + R(87.5, 95.5, 65, 65);
    },
  },

  '05_Personnages_&_Silhouettes': {
    '01_solo_avatar.svg': () => avatar(120, 120, 1.6),
    '02_avatar_in_comfort_box.svg': () => R(40, 40, 160, 160, 10) + avatar(120, 136, 1),
    '03_avatar_breaking_box.svg': () =>
      PL([[40, 100], [40, 200], [200, 200], [200, 100]]) + L(40, 100, 90, 100) + L(150, 100, 200, 100) +
      L(98, 92, 82, 70) + L(144, 92, 160, 70) + L(120, 82, 120, 64) +
      stick({ head: [120, 34], r: 14, neck: [120, 52], hip: [120, 118], lElbow: [96, 40], lHand: [80, 18], rElbow: [144, 40], rHand: [160, 18], lKnee: [104, 150], lFoot: [96, 186], rKnee: [136, 150], rFoot: [144, 186] }),
    '04_crowd_grid_30_dots.svg': () => {
      let s = '';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) s += C(40 + c * 32, 56 + r * 32, 9);
      return s;
    },
    '05_one_red_dot_vs_crowd.svg': () => {
      let s = '';
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 6; c++) {
          if (r === 2 && c === 4) continue;
          s += C(40 + c * 32, 56 + r * 32, 7);
        }
      return s + C(168, 120, 14) + C(168, 120, 26);
    },
    '06_climbing_avatar.svg': () =>
      PL([[20, 214], [20, 176], [76, 176], [76, 132], [132, 132], [132, 88], [188, 88], [188, 44], [222, 44]]) +
      stick({ head: [118, 54], r: 11, neck: [114, 68], hip: [104, 106], lElbow: [128, 78], lHand: [146, 84], rElbow: [100, 80], rHand: [110, 92], lKnee: [118, 116], lFoot: [124, 130], rKnee: [90, 118], rFoot: [84, 132] }),
    '07_falling_avatar.svg': () =>
      stick({ head: [96, 160], r: 14, neck: [108, 142], hip: [138, 96], lElbow: [84, 128], lHand: [68, 140], rElbow: [132, 156], rHand: [148, 172], lKnee: [126, 66], lFoot: [148, 50], rKnee: [164, 92], rFoot: [176, 66] }) +
      L(40, 40, 40, 80) + L(64, 24, 64, 56) + L(200, 130, 200, 170) + L(26, 214, 214, 214),
    '08_reaching_hand.svg': () =>
      P('M70 220 L82 150 L76 98 C74 88 88 86 90 96 L96 132') +
      P('M96 132 L94 66 C94 56 108 56 108 66 L112 126') +
      P('M112 126 L114 54 C114 44 128 44 128 54 L130 126') +
      P('M130 126 L136 66 C136 56 150 56 150 66 L146 136 C144 168 136 190 136 220') +
      C(160, 26, 6) + L(160, 8, 160, 14) + L(160, 38, 160, 44) + L(142, 26, 148, 26) + L(172, 26, 178, 26),
    '09_two_avatars_talking.svg': () =>
      avatar(66, 168, 0.85) + avatar(174, 168, 0.85) +
      P('M30 30 L106 30 C112 30 116 34 116 40 L116 76 C116 82 112 86 106 86 L64 86 L48 102 L50 86 L30 86 C24 86 20 82 20 76 L20 40 C20 34 24 30 30 30 Z') +
      P('M210 50 L144 50 C138 50 134 54 134 60 L134 92 C134 98 138 102 144 102 L176 102 L192 116 L190 102 L210 102 C216 102 220 98 220 92 L220 60 C220 54 216 50 210 50 Z') +
      L(40, 58, 96, 58) + L(154, 76, 200, 76),
    '10_king_avatar.svg': () =>
      avatar(120, 150, 1.25) + PG([[90, 92], [84, 46], [104, 66], [120, 38], [136, 66], [156, 46], [150, 92]]),
    '11_avatar_at_crossroads.svg': () =>
      P('M96 226 L112 150 L60 30') + P('M144 226 L128 150 L180 30') + P('M112 150 L120 120 L128 150') +
      L(120, 212, 120, 200) + L(120, 180, 120, 168) +
      stick({ head: [120, 92], r: 9, neck: [120, 103], hip: [120, 128], lElbow: [112, 114], lHand: [110, 126], rElbow: [128, 114], rHand: [130, 126], lKnee: [115, 140], lFoot: [113, 150], rKnee: [125, 140], rFoot: [127, 150] }) +
      L(196, 120, 196, 196) + PG([[176, 120], [222, 120], [230, 130], [222, 140], [176, 140]]),
    '12_avatar_pushing_boulder_sisyphus.svg': () =>
      L(10, 214, 230, 104) + C(156, 104, 40) +
      stick({ head: [94, 116], r: 11, neck: [100, 128], hip: [76, 162], lElbow: [112, 128], lHand: [122, 120], rElbow: [108, 140], rHand: [120, 136], lKnee: [70, 184], lFoot: [52, 188], rKnee: [90, 176], rFoot: [84, 186] }),
    '13_avatar_looking_at_stars.svg': () => {
      let s = avatar(120, 196, 0.9) + L(20, 226, 220, 226);
      const stars = [[50, 40, 8], [110, 26, 6], [180, 48, 10], [76, 92, 5], [154, 104, 7], [204, 120, 5], [32, 130, 5]];
      for (const [x, y, r] of stars) s += L(x - r, y, x + r, y) + L(x, y - r, x, y + r);
      return s + C(140, 64, 3);
    },
    '14_head_profile_gears.svg': () =>
      P(HEAD_PROFILE) + gear(112, 98, 30, 22, 8, 0) + C(112, 98, 8) + gear(150, 128, 18, 12, 6, 15) + C(150, 128, 4),
    '15_head_profile_empty.svg': () => P(HEAD_PROFILE) + C(124, 100, 6),
    '16_heart_anatomical_minimal.svg': () =>
      P('M116 66 C88 50 50 66 50 108 C50 156 98 196 128 214 C164 192 200 152 196 104 C192 70 166 56 140 66') +
      P('M116 66 L114 26') + P('M140 66 L144 22') + P('M128 64 C128 40 160 30 176 38') +
      P('M96 112 C110 128 112 160 108 186') + P('M156 100 C146 120 150 150 160 168'),
    '17_heart_broken_line.svg': () =>
      P('M120 72 C114 60 102 52 88 52 C64 52 44 70 44 96 C44 142 96 176 120 196') +
      P('M120 72 C126 60 138 52 152 52 C176 52 196 70 196 96 C196 142 144 176 120 196') +
      PL([[120, 72], [108, 98], [130, 122], [110, 148], [124, 170], [120, 196]]) +
      PL([[10, 222], [70, 222], [82, 204], [96, 230], [108, 214], [230, 214]]),
    '18_footsteps_path.svg': () => {
      let s = P('M24 216 C72 186 60 124 116 104 C166 86 170 46 216 24');
      const steps = [[40, 190, -40], [68, 162, -60], [72, 128, -70], [104, 108, -30], [136, 90, -30], [168, 70, -50], [188, 42, -40]];
      steps.forEach(([x, y, a], i) => {
        const off = i % 2 ? 14 : -14;
        const [px, py] = pt(x, y, off, a + 90);
        s += P(`M${n(px)} ${n(py)} m-4 0 a4 8 ${a + 90} 1 0 8 0 a4 8 ${a + 90} 1 0 -8 0`);
      });
      return s;
    },
    '19_puppet_strings_hand.svg': () =>
      L(56, 30, 184, 30) + L(120, 14, 120, 46) +
      L(56, 30, 76, 118) + L(184, 30, 164, 118) + L(120, 46, 120, 74) + L(90, 30, 102, 186) + L(150, 30, 138, 186) +
      stick({ head: [120, 86], r: 12, neck: [120, 100], hip: [120, 150], lElbow: [96, 110], lHand: [76, 118], rElbow: [144, 110], rHand: [164, 118], lKnee: [108, 170], lFoot: [102, 190], rKnee: [132, 170], rFoot: [138, 190] }),
    '20_free_man_arms_wide.svg': () => {
      let s = stick({ head: [120, 60], r: 16, neck: [120, 80], hip: [120, 146], lElbow: [86, 66], lHand: [54, 40], rElbow: [154, 66], rHand: [186, 40], lKnee: [104, 180], lFoot: [96, 214], rKnee: [136, 180], rFoot: [144, 214] });
      for (let i = 0; i < 7; i++) {
        const a = -90 - 75 + i * 25;
        const [x0, y0] = pt(120, 60, 32, a);
        const [x1, y1] = pt(120, 60, 46, a);
        s += L(x0, y0, x1, y1);
      }
      return s;
    },
  },
};

/* ------------------------------------------------------------------ */
/* Écriture                                                            */
/* ------------------------------------------------------------------ */
function wrap(name, body) {
  const title = name.replace(/\.svg$/, '').replace(/^\d+_/, '').replace(/_/g, ' ');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">\n` +
    `  <title>${title}</title>\n` +
    `  <g id="${name.replace(/\.svg$/, '')}">\n    ` +
    body.replace(/></g, '>\n    <') +
    `\n  </g>\n</svg>\n`
  );
}

function main() {
  let total = 0;
  const seen = new Set();
  for (const [folder, icons] of Object.entries(ICONS)) {
    const dir = path.join(OUT_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });
    const names = Object.keys(icons);
    if (names.length !== 20) throw new Error(`${folder}: ${names.length} icônes au lieu de 20`);
    for (const name of names) {
      const body = icons[name]();
      if (!body || body.length < 40) throw new Error(`Icône vide : ${name}`);
      if (/NaN|undefined/.test(body)) throw new Error(`Géométrie invalide : ${name}`);
      if (seen.has(body)) throw new Error(`Icône dupliquée : ${name}`);
      seen.add(body);
      fs.writeFileSync(path.join(dir, name), wrap(name, body), 'utf8');
      total++;
    }
  }
  if (total !== 100) throw new Error(`${total} icônes générées au lieu de 100`);
  console.log(`[SVG] ${total} icônes uniques générées dans ${path.relative(ROOT, OUT_DIR)}`);
}

module.exports = { ICONS, wrap };
if (require.main === module) main();
