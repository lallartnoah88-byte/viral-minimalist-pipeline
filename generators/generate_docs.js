#!/usr/bin/env node
/*
 * generate_docs.js
 * - Génère le guide MASTERCLASS_VIRAL_ANIMATIONS.html (autonome, CSS embarqué, 7 modules)
 * - Exporte le PDF via Playwright/Chromium si disponible
 * - Copie le plugin After Effects + LISEZ-MOI dans le pack
 * - Génère DIST_PACK_TO_SELL/COPIE_PAGE_DE_VENTE.md (FR + EN)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'DIST_PACK_TO_SELL');
const PACK = path.join(DIST, 'ULTIMATE_MINIMALIST_ANIMATION_PACK');
const GUIDE_DIR = path.join(PACK, '05_Formation_Complete_Guide');
const PLUGIN_DIR = path.join(PACK, '04_Plugin_After_Effects');
const STORY = JSON.parse(fs.readFileSync(path.join(__dirname, 'storyboards.json'), 'utf8'));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tc = (frame, fps = STORY.fps) => {
  const s = Math.floor(frame / fps);
  const f = frame % fps;
  return `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Schéma SVG : Speed Graph 75/85 vs linéaire                          */
/* ------------------------------------------------------------------ */
function bezierSpeedPoints(x1, y1, x2, y2, samples = 300) {
  const pts = [];
  for (let i = 1; i < samples; i++) {
    const s = i / samples;
    const dx = 3 * (1 - s) ** 2 * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s ** 2 * (1 - x2);
    const dy = 3 * (1 - s) ** 2 * y1 + 6 * (1 - s) * s * (y2 - y1) + 3 * s ** 2 * (1 - y2);
    const x = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3;
    pts.push([x, dx > 1e-6 ? dy / dx : 0]);
  }
  return [[0, 0], ...pts, [1, 0]];
}

function speedGraphSvg() {
  const W = 760, H = 340, L = 70, R = 30, T = 30, B = 60;
  const pw = W - L - R, ph = H - T - B;
  const pts = bezierSpeedPoints(0.75, 0, 0.15, 1);
  const peak = Math.max(...pts.map((p) => p[1]));
  const toXY = ([x, v]) => [L + x * pw, T + ph - (v / peak) * ph * 0.92];
  const bell = pts.map(toXY).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const linearY = T + ph - (1 / peak) * ph * 0.92;
  const peakPt = toXY(pts.reduce((a, b) => (b[1] > a[1] ? b : a)));
  let grid = '';
  for (let i = 0; i <= 10; i++) {
    const x = L + (pw * i) / 10;
    grid += `<line x1="${x}" y1="${T}" x2="${x}" y2="${T + ph}" stroke="#1c1c1c" stroke-width="1"/>`;
  }
  for (let i = 0; i <= 4; i++) {
    const y = T + (ph * i) / 4;
    grid += `<line x1="${L}" y1="${y}" x2="${L + pw}" y2="${y}" stroke="#1c1c1c" stroke-width="1"/>`;
  }
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="Speed Graph : courbe en cloche asymétrique 75/85 comparée à une interpolation linéaire">
  <defs>
    <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0b0b0b" rx="12"/>
  ${grid}
  <line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" stroke="#555" stroke-width="1.5"/>
  <line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" stroke="#555" stroke-width="1.5"/>
  <polyline points="${L},${linearY.toFixed(1)} ${L + pw},${linearY.toFixed(1)}" fill="none" stroke="#8a8a8a" stroke-width="3" stroke-dasharray="8 8"/>
  <polyline points="${bell}" fill="none" stroke="#FF1E1E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" filter="url(#glowRed)"/>
  <circle cx="${peakPt[0].toFixed(1)}" cy="${peakPt[1].toFixed(1)}" r="6" fill="#070707" stroke="#FF1E1E" stroke-width="3"/>
  <text x="${L + 10}" y="${T + ph + 34}" fill="#bbb" font-size="13" font-family="JetBrains Mono, monospace">Clé A : influence sortie 75 %</text>
  <text x="${L + pw - 250}" y="${T + ph + 34}" fill="#bbb" font-size="13" font-family="JetBrains Mono, monospace">Clé B : influence entrée 85 %</text>
  <text x="${L + pw - 230}" y="${linearY - 10}" fill="#8a8a8a" font-size="13" font-family="JetBrains Mono, monospace">Linéaire : vitesse constante</text>
  <text x="${peakPt[0] + 14}" y="${peakPt[1] + 4}" fill="#FF1E1E" font-size="13" font-family="JetBrains Mono, monospace">pic de vélocité</text>
  <text x="18" y="${T + ph / 2}" fill="#777" font-size="12" font-family="JetBrains Mono, monospace" transform="rotate(-90 18 ${T + ph / 2})">VITESSE</text>
  <text x="${L + pw / 2 - 20}" y="${H - 6}" fill="#777" font-size="12" font-family="JetBrains Mono, monospace">TEMPS</text>
</svg>`;
}

function valueGraphSvg() {
  const W = 760, H = 220, L = 70, R = 30, T = 24, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const s = i / 200;
    const x = 3 * (1 - s) ** 2 * s * 0.75 + 3 * (1 - s) * s ** 2 * 0.15 + s ** 3;
    const y = 3 * (1 - s) * s ** 2 + s ** 3;
    pts.push(`${(L + x * pw).toFixed(1)},${(T + ph - y * ph).toFixed(1)}`);
  }
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="Value Graph de la courbe cubic-bezier(0.75, 0, 0.15, 1)">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0b0b0b" rx="12"/>
  <line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" stroke="#555" stroke-width="1.5"/>
  <line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" stroke="#555" stroke-width="1.5"/>
  <line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T}" stroke="#8a8a8a" stroke-width="2" stroke-dasharray="8 8"/>
  <polyline points="${pts.join(' ')}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  <text x="${L + 12}" y="${T + 16}" fill="#bbb" font-size="13" font-family="JetBrains Mono, monospace">cubic-bezier(0.75, 0, 0.15, 1)</text>
  <text x="${L + pw / 2 - 30}" y="${H - 10}" fill="#777" font-size="12" font-family="JetBrains Mono, monospace">TEMPS</text>
  <text x="18" y="${T + ph / 2 + 20}" fill="#777" font-size="12" font-family="JetBrains Mono, monospace" transform="rotate(-90 18 ${T + ph / 2})">VALEUR</text>
</svg>`;
}

function trackDiagramSvg() {
  const tracks = [
    ['PISTE 1 · VOIX-OFF', '-3 dB', 1.0, '#FFFFFF'],
    ['PISTE 2 · SFX IMPACTS', '-10 dB', 0.45, '#FF1E1E'],
    ['PISTE 3 · SFX MOUVEMENTS', '-12 dB', 0.36, '#FFC72C'],
    ['PISTE 4 · MUSIQUE DRONE', '-24 dB', 0.09, '#7a7a7a'],
  ];
  let rows = '';
  tracks.forEach(([name, db, level, color], i) => {
    const y = 20 + i * 52;
    rows += `<text x="16" y="${y + 24}" fill="#ddd" font-size="13" font-family="JetBrains Mono, monospace">${name}</text>
    <rect x="260" y="${y + 8}" width="420" height="22" rx="4" fill="#141414" stroke="#262626"/>
    <rect x="260" y="${y + 8}" width="${(420 * level).toFixed(0)}" height="22" rx="4" fill="${color}" opacity="0.85"/>
    <text x="692" y="${y + 24}" fill="${color}" font-size="13" font-family="JetBrains Mono, monospace">${db}</text>`;
  });
  return `<svg class="diagram" viewBox="0 0 760 230" role="img" aria-label="Architecture sound design à 4 pistes">
  <rect x="0" y="0" width="760" height="230" fill="#0b0b0b" rx="12"/>${rows}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Contenu                                                             */
/* ------------------------------------------------------------------ */
const FX_TABLE = [
  ['Grain / Bruit (FX_04)', 'Bruit (Noise) · Quantité 6 % · Bruit couleur désactivé', 'Fusion : nœud <code>FastNoise</code> en Overlay, Detail 10, Contrast 1.2, opacité 6 % — ou effet <em>Film Grain</em> (Grain Size 0.6, Strength 0.06)', 'Effets > <em>Bruit / Grain</em> (Film Grain) · Intensité 6–8'],
  ['Postérisation 15 i/s (FX_03)', 'Postérisation temporelle (Posterize Time) · 15 i/s', 'Fusion : <code>TimeSpeed</code> + expression <code>floor(time*15)/15</code> sur Source Time — ou clip à 15 i/s dans une timeline 30 i/s (Retime Process : Nearest)', 'Vitesse > <em>Courbe</em> désactivée + exporter un pré-rendu à 15 i/s puis réimporter (ou effet <em>Stop Motion</em> 15)'],
  ['Line Boil (FX_02)', 'Déplacement turbulent · Quantité 4 · Taille 15 · Évolution <code>time*250</code>', 'Fusion : <code>Displace</code> piloté par <code>FastNoise</code> (Scale 15, Seethe Rate 2.5), Refraction Strength 0.004', 'Effets > <em>Distorsion</em> > Ondulation (Wave) amplitude 2–3, vitesse élevée'],
  ['Double Glow (FX_01)', '2 × Lueur (Glow) : 60 % / 25 / 1.2 et 40 % / 120 / 0.6', 'Fusion : 2 × <code>SoftGlow</code> (Threshold 0.6 / Gain 1.2 / Glow Size 6, puis 0.4 / 0.6 / 30) ou effet <em>Glow</em> natif ×2', 'Effets > <em>Lumière</em> > Lueur (Glow) ×2 : Intensité 40 / Rayon 20 puis Intensité 25 / Rayon 70'],
  ['Trim Paths', 'Raccourcir les traces · Fin 0 → 100 %', 'Fusion : <code>Polygon/BSpline</code> > Length 0 → 1 (Write On)', 'Masque / Forme : animation <em>Révéler</em> (Wipe / Stroke reveal) ou keyframes sur l\'effet <em>Tracé</em>'],
  ['Speed Graph 75/85', 'Éditeur de graphique · Influence 75 % / 85 %', 'Spline Editor : poignées Bézier étirées à 75 % / 85 % de la durée', 'Courbe de vitesse personnalisée (<em>Courbes > Personnalisé</em>) ou keyframes avec easing <em>Ease In/Out</em> maximal'],
  ['Caméra 3D', 'Nul 3D parent + calques 3D', 'Fusion : <code>Camera3D</code> + <code>Merge3D</code> + <code>Transform3D</code>', 'Animation de position / échelle par keyframes (pas de vraie 3D)'],
];

const DICTIONARY = [
  ['Anxiété / bruit mental', 'Spirale chaotique, 12 flèches dispersées', '03_chaos_spiral · 08_scattered_arrows_12'],
  ['Clarté / focus', 'Ligne qui se redresse, cible, œil focalisé', '04_clarity_line · 06_target_bullseye · 06_focused_eye'],
  ['Fatigue / énergie', 'Batterie 10 % rouge vs batterie pleine', '07_low_battery_10 · 08_full_battery'],
  ['Discipline', 'Escalier, marques de pointage quotidiennes', '05_discipline_stairs · 17_daily_tally_marks'],
  ['Croissance', 'Courbe exponentielle, barres croissantes', '01_exponential_curve · 16_bar_chart_growth'],
  ['Échec / chute', 'Courbe qui s\'écrase, personnage qui tombe', '02_crash_chart · 07_falling_avatar'],
  ['Liberté', 'Chaîne brisée, cadenas ouvert, bras ouverts', '12_broken_chain · 14_unlocked_padlock · 20_free_man_arms_wide'],
  ['Zone de confort', 'Avatar dans une boîte, puis qui la brise', '02_avatar_in_comfort_box · 03_avatar_breaking_box'],
  ['Être différent', 'Une forme isolée face à une grille de 30 points', '04_crowd_grid_30_dots · 05_one_red_dot_vs_crowd'],
  ['Effort sans fin / résilience', 'Sisyphe et le rocher, sommet de montagne', '12_avatar_pushing_boulder_sisyphus · 06_mountain_peak'],
];

const SOUND_TABLE = [
  ['1', 'Voix-off', '-3 dB', 'EQ : +4 dB à 120 Hz (corps), +3 dB à 5 kHz (présence), coupe-bas 80 Hz. Compresseur 3:1, limiteur -1 dBTP.'],
  ['2', 'SFX Impacts (Sub Drops, clics forts)', '-10 dB', 'Posés exactement sur l\'image de l\'impact visuel. Jamais deux impacts dans la même seconde que la voix accentuée.'],
  ['3', 'SFX Mouvements (Whooshes, Risers)', '-12 dB', 'Le pic du whoosh tombe sur la coupe. Un riser finit 1 image avant l\'impact (le silence crée la tension).'],
  ['4', 'Musique / Drone', '-24 dB', 'Drone en boucle, sidechain (ducking) -6 dB sous la voix, coupe-haut 8 kHz pour laisser de la place à la voix.'],
];

const EXPORT_TABLE = [
  ['Résolution', '1080 × 1920 (9:16)'],
  ['Fréquence d\'images', '30 i/s (identique à la composition)'],
  ['Codec', 'H.264 (High Profile, niveau 4.2)'],
  ['Débit', 'CBR 25 Mbps (constant — évite la recompression agressive des plateformes)'],
  ['Images clés', 'Toutes les 30 images (1 par seconde)'],
  ['Audio', 'AAC 320 kbps, 48 kHz, stéréo'],
  ['Qualité', '« Rendu en qualité maximale » / Max Render Quality activé, profondeur 8 bits'],
  ['Upload', 'Depuis l\'application mobile en Wi-Fi, option « Importer en HD » activée (Instagram / TikTok)'],
];

function storyboardHtml(v) {
  const rows = v.scenes
    .map((s) => {
      const sfx = s.sfx
        .slice()
        .sort((a, b) => a.frame - b.frame)
        .map((x) => `<li><span class="mono">${tc(x.frame)}</span> ${esc(x.file)} <span class="muted">— ${esc(x.note)}</span></li>`)
        .join('');
      return `<tr>
        <td class="mono nowrap">${tc(s.from)}<br>→ ${tc(s.to)}</td>
        <td><strong>FR</strong> « ${esc(s.voFr)} »<br><span class="muted"><strong>EN</strong> “${esc(s.voEn)}”</span></td>
        <td>${esc(s.visual)}</td>
        <td><ul class="sfx">${sfx}</ul></td>
      </tr>`;
    })
    .join('');
  return `<h3>${esc(v.titleFr)} <span class="muted">/ ${esc(v.titleEn)}</span></h3>
  <p class="meta mono">Composition Remotion : <code>${esc(v.id)}</code> · 1080×1920 · 30 i/s · ${v.durationInFrames} images (${v.durationInFrames / STORY.fps} s) · Couleur d'accent <span class="swatch" style="background:${v.accent}"></span> ${v.accent} · Musique : ${esc(v.music)} (-24 dB)</p>
  <div class="table-wrap"><table class="story">
    <thead><tr><th>Timecode</th><th>Voix-off</th><th>Visuel</th><th>SFX</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function guideHtml() {
  const fxRows = FX_TABLE.map((r) => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const dictRows = DICTIONARY.map((r, i) => `<tr><td class="mono">${String(i + 1).padStart(2, '0')}</td><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td class="mono small">${r[2]}</td></tr>`).join('');
  const soundRows = SOUND_TABLE.map((r) => `<tr><td class="mono">${r[0]}</td><td><strong>${r[1]}</strong></td><td class="mono accent">${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const exportRows = EXPORT_TABLE.map((r) => `<tr><td><strong>${r[0]}</strong></td><td class="mono">${r[1]}</td></tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Masterclass Viral Animations</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root { --bg:#080808; --panel:#0f0f0f; --line:#1f1f1f; --text:#e9e9e9; --muted:#8c8c8c; --red:#FF1E1E; --gold:#FFC72C; }
  * { box-sizing:border-box; }
  html { background:var(--bg); }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.65 Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; -webkit-font-smoothing:antialiased; }
  .page { max-width:980px; margin:0 auto; padding:0 24px 96px; }
  .mono, code { font-family:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  code { background:#151515; border:1px solid var(--line); padding:1px 6px; border-radius:4px; font-size:.88em; }
  .muted { color:var(--muted); } .accent { color:var(--red); } .small { font-size:.82em; } .nowrap { white-space:nowrap; }
  header.cover { min-height:92vh; display:flex; flex-direction:column; justify-content:center; border-bottom:1px solid var(--line);
    background: radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.05), transparent 60%),
      linear-gradient(transparent 89px, rgba(255,255,255,.035) 90px) 0 0/90px 90px,
      linear-gradient(90deg, transparent 89px, rgba(255,255,255,.035) 90px) 0 0/90px 90px; }
  .kicker { font-family:"JetBrains Mono", monospace; color:var(--red); letter-spacing:.2em; font-size:13px; text-transform:uppercase; }
  h1 { font-size:clamp(40px, 7vw, 78px); line-height:1.02; letter-spacing:-.03em; font-weight:900; margin:18px 0 22px; }
  h2 { font-size:34px; letter-spacing:-.02em; margin:0 0 8px; font-weight:900; }
  h3 { font-size:21px; margin:34px 0 10px; }
  .lead { font-size:19px; color:#c9c9c9; max-width:720px; }
  section.module { padding:72px 0 8px; border-bottom:1px solid var(--line); page-break-before:always; }
  .modnum { font-family:"JetBrains Mono", monospace; color:var(--muted); font-size:13px; letter-spacing:.2em; }
  .toc { list-style:none; padding:0; margin:36px 0 0; display:grid; gap:8px; }
  .toc a { color:var(--text); text-decoration:none; border-bottom:1px solid var(--line); display:flex; gap:16px; padding:8px 0; }
  .toc a span { font-family:"JetBrains Mono", monospace; color:var(--red); }
  .table-wrap { overflow-x:auto; margin:16px 0 8px; }
  table { width:100%; border-collapse:collapse; font-size:14.5px; }
  th, td { text-align:left; vertical-align:top; padding:10px 12px; border-bottom:1px solid var(--line); }
  th { font-family:"JetBrains Mono", monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:18px 20px; margin:16px 0; }
  .card.red { border-left:3px solid var(--red); } .card.gold { border-left:3px solid var(--gold); }
  .grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px; }
  .stat { font-family:"JetBrains Mono", monospace; font-size:30px; font-weight:600; color:#fff; }
  .diagram { width:100%; height:auto; display:block; margin:18px 0; }
  ul.sfx { margin:0; padding-left:16px; font-size:13px; } ul.sfx li { margin:2px 0; }
  .swatch { display:inline-block; width:11px; height:11px; border-radius:2px; vertical-align:middle; }
  .meta { color:var(--muted); font-size:13px; }
  ol.steps li { margin:6px 0; }
  footer { padding:48px 0 0; color:var(--muted); font-size:13px; }
  @media print {
    @page { size:A4; margin:14mm 12mm; }
    html, body { background:var(--bg) !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    header.cover { min-height:auto; padding:120px 0; }
    .page { max-width:none; padding:0 7mm; }
    table { font-size:12px; } th, td { padding:7px 8px; }
    section.module { padding-top:12px; }
    table, .card, svg { page-break-inside:avoid; }
  }
</style>
</head>
<body>
<div class="page">

<header class="cover">
  <div class="kicker">Masterclass · Dark Minimalist Viral Animations</div>
  <h1>Créer des animations minimalistes qui arrêtent le scroll.</h1>
  <p class="lead">Le système complet utilisé par les comptes de motion design « dark minimalist » : audio, pile d'effets, tracés vectoriels, Speed Graph, sound design, 3 storyboards prêts à produire et réglages d'export anti-compression. Méthode applicable dans After Effects, DaVinci Resolve et CapCut.</p>
  <div class="grid2" style="margin-top:28px">
    <div class="card"><div class="stat">100</div><div class="muted">icônes SVG animables</div></div>
    <div class="card"><div class="stat">30</div><div class="muted">effets sonores WAV 48 kHz</div></div>
    <div class="card"><div class="stat">5</div><div class="muted">grilles & textures 1080×1920</div></div>
    <div class="card"><div class="stat">1</div><div class="muted">plugin After Effects en 5 clics</div></div>
  </div>
  <ol class="toc">
    <li><a href="#m1"><span>01</span> Trouver l'audio viral & réglages ElevenLabs</a></li>
    <li><a href="#m2"><span>02</span> La pile des 4 calques d'effets</a></li>
    <li><a href="#m3"><span>03</span> Tracés vectoriels & Speed Graph 75/85</a></li>
    <li><a href="#m4"><span>04</span> Dictionnaire visuel, Match Cut & caméra 3D</a></li>
    <li><a href="#m5"><span>05</span> Architecture sound design à 4 pistes</a></li>
    <li><a href="#m6"><span>06</span> Les 3 storyboards viraux complets</a></li>
    <li><a href="#m7"><span>07</span> Export anti-compression</a></li>
  </ol>
</header>

<section class="module" id="m1">
  <div class="modnum">MODULE 01</div>
  <h2>Trouver l'audio viral & réglages exacts ElevenLabs</h2>
  <p>Dans ce format, <strong>la voix est le squelette de la vidéo</strong> : chaque coupe visuelle tombe sur un mot-clé. On écrit donc le script avant de toucher à l'animation.</p>
  <h3>1. Trouver un script qui retient</h3>
  <ol class="steps">
    <li><strong>Hook en moins de 2 secondes</strong> : une affirmation qui contredit une croyance (« Ton cerveau n'est pas fatigué. Il est saturé. »).</li>
    <li><strong>Une idée par phrase, une phrase par scène</strong> : 4 scènes de 4 à 7 secondes pour une vidéo de 20 à 25 s.</li>
    <li><strong>Phrases de 3 à 9 mots</strong>, verbes concrets, pas d'adverbes.</li>
    <li><strong>Chute courte et impérative</strong> (« Exécute. », « Travaille en silence. ») qui donne envie de revoir la vidéo : c'est le moteur du taux de rétention.</li>
    <li>Repérez les sons tendance dans l'onglet audio de TikTok / Reels, mais gardez la musique sous la voix : ici l'audio viral est la <em>voix</em>, la musique n'est qu'un drone.</li>
  </ol>
  <h3>2. Réglages ElevenLabs</h3>
  <div class="grid2">
    <div class="card red"><div class="muted mono small">STABILITY</div><div class="stat">35 %</div><p class="small muted">Assez bas pour garder des variations d'intonation dramatiques, assez haut pour éviter les artefacts.</p></div>
    <div class="card red"><div class="muted mono small">CLARITY + SIMILARITY</div><div class="stat">75 %</div><p class="small muted">Diction nette sans accentuer le souffle ni les sifflantes.</p></div>
    <div class="card red"><div class="muted mono small">STYLE EXAGGERATION</div><div class="stat">15 %</div><p class="small muted">Une touche d'émotion. Au-delà de 25 %, la voix devient théâtrale.</p></div>
    <div class="card"><div class="muted mono small">SPEAKER BOOST</div><div class="stat">ON</div><p class="small muted">Choisissez une voix grave, posée, narrateur documentaire.</p></div>
  </div>
  <h3>3. Égalisation de la voix</h3>
  <div class="table-wrap"><table>
    <thead><tr><th>Bande</th><th>Réglage</th><th>Effet</th></tr></thead>
    <tbody>
      <tr><td class="mono">80 Hz</td><td>Coupe-bas 12 dB/oct</td><td>Supprime les grondements inutiles</td></tr>
      <tr><td class="mono">120 Hz</td><td class="accent mono">+4 dB (Q 1.0)</td><td>Corps et autorité de la voix</td></tr>
      <tr><td class="mono">5 kHz</td><td class="accent mono">+3 dB (Q 0.8)</td><td>Présence et intelligibilité sur haut-parleur de téléphone</td></tr>
      <tr><td class="mono">—</td><td>Compresseur 3:1, attaque 10 ms, relâchement 80 ms</td><td>Niveau constant</td></tr>
      <tr><td class="mono">—</td><td>Limiteur plafond -1 dBTP</td><td>Aucune saturation à l'export</td></tr>
    </tbody>
  </table></div>
  <div class="card gold"><strong>Astuce :</strong> générez chaque phrase séparément dans ElevenLabs. Vous pourrez ajuster l'espace entre les phrases (8 à 12 images de silence) pour laisser respirer les impacts sonores.</div>
</section>

<section class="module" id="m2">
  <div class="modnum">MODULE 02</div>
  <h2>La pile des 4 calques d'effets (le Look Signature)</h2>
  <p>Le style « dark minimalist » ne vient pas des formes : il vient de <strong>4 calques de réglage empilés au-dessus de toute la scène</strong>. Ils transforment des tracés vectoriels parfaits en image organique, lumineuse et légèrement « dessinée à la main ».</p>
  <div class="grid2">
    <div class="card"><div class="mono accent small">FX_04_NOISE</div><p>Bruit 6 %, monochrome. Casse la perfection numérique et masque le banding des dégradés de lueur.</p></div>
    <div class="card"><div class="mono accent small">FX_03_POSTERIZE_15FPS</div><p>Postérisation temporelle à 15 i/s dans une comp à 30 i/s : le mouvement devient saccadé comme une animation dessinée.</p></div>
    <div class="card"><div class="mono accent small">FX_02_LINE_BOIL</div><p>Déplacement turbulent (quantité 4, taille 15, évolution <code>time*250</code>) : les traits « bouillonnent » légèrement, effet crayonné vivant.</p></div>
    <div class="card"><div class="mono accent small">FX_01_DOUBLE_GLOW</div><p>Lueur serrée (60 % / 25 / 1.2) + lueur large (40 % / 120 / 0.6) : un cœur net et un halo diffus, comme un néon.</p></div>
  </div>
  <p><strong>Ordre de la pile (de haut en bas)</strong> : FX_04 → FX_03 → FX_02 → FX_01 → vos animations → grille → fond #070707. La lueur est calculée en premier, puis déformée, postérisée et enfin granulée : le grain reste fin et ne « bave » pas.</p>
  <h3>Tableau de correspondance logiciel</h3>
  <div class="table-wrap"><table>
    <thead><tr><th>Élément</th><th>After Effects</th><th>DaVinci Resolve (Fusion)</th><th>CapCut Desktop</th></tr></thead>
    <tbody>${fxRows}</tbody>
  </table></div>
  <div class="card red">Dans After Effects, le bouton <strong>2</strong> du plugin <code>Minimalist_Viral_Setup.jsx</code> crée automatiquement ces 4 calques avec ces valeurs exactes.</div>
</section>

<section class="module" id="m3">
  <div class="modnum">MODULE 03</div>
  <h2>Maîtriser les tracés vectoriels (Trim Paths) & le Speed Graph 75/85</h2>
  <p>Toutes les icônes du pack sont des <strong>contours sans remplissage</strong> (trait blanc 5 px, extrémités arrondies). C'est ce qui permet de les « dessiner » à l'écran avec Trim Paths (After Effects) ou <code>stroke-dashoffset</code> (Remotion / web).</p>
  <h3>Importer et animer une icône</h3>
  <ol class="steps">
    <li>Importez le <code>.svg</code> (AE 2024+ : import natif ; versions antérieures : ouvrez-le dans Illustrator et enregistrez en .ai, puis <em>Calque > Créer des formes à partir d'un calque vectoriel</em>).</li>
    <li>Sélectionnez le calque de forme et cliquez sur le bouton <strong>4</strong> du plugin : Trim Paths est ajouté avec Fin 0 % → 100 % sur 25 images.</li>
    <li>Pour un tracé « qui voyage » (comète), animez aussi Début 0 → 100 % décalé de 6 images.</li>
    <li>Pour les icônes en plusieurs tracés, réglez <em>Raccourcir plusieurs formes</em> sur <strong>Individuellement</strong> pour un dessin séquentiel.</li>
  </ol>
  <h3>Pourquoi 75 % / 85 % ?</h3>
  <p>Une interpolation linéaire déplace l'objet à vitesse constante : le cerveau la perçoit comme mécanique. Avec une influence de <strong>75 % en sortie</strong> de la première clé et <strong>85 % en entrée</strong> de la seconde, l'objet démarre lentement, accélère violemment, puis se pose en douceur. C'est la courbe en cloche asymétrique ci-dessous — l'équivalent CSS / Remotion est <code>cubic-bezier(0.75, 0, 0.15, 1)</code>.</p>
  ${speedGraphSvg()}
  ${valueGraphSvg()}
  <div class="table-wrap"><table>
    <thead><tr><th>Logiciel</th><th>Comment obtenir la courbe 75/85</th></tr></thead>
    <tbody>
      <tr><td><strong>After Effects</strong></td><td>Clic droit sur la clé > Assistant d'images clés > Vélocité : Influence sortante 75 % sur la clé A, influence entrante 85 % sur la clé B, vitesse 0. Ou bouton 4 / 5 du plugin.</td></tr>
      <tr><td><strong>DaVinci Resolve</strong></td><td>Spline Editor : sélectionnez les deux clés, appuyez sur <code>F</code> (Flat), puis étirez la poignée droite de A jusqu'à 75 % de l'intervalle et la poignée gauche de B jusqu'à 85 %.</td></tr>
      <tr><td><strong>CapCut</strong></td><td>Sur la clé : Courbes > Personnalisé, placez le premier point à (0.75, 0) et le second à (0.15, 1).</td></tr>
      <tr><td><strong>Remotion</strong></td><td><code>interpolate(frame, [a, b], [0, 1], { easing: Easing.bezier(0.75, 0, 0.15, 1) })</code></td></tr>
    </tbody>
  </table></div>
  <div class="card gold"><strong>Règle d'or des durées :</strong> tracé d'icône 25 images, pop-in 20 images (échelle 220 % → 100 %), mouvement de caméra 30 à 45 images. Tout ce qui est plus long paraît lent à 30 i/s postérisé à 15.</div>
</section>

<section class="module" id="m4">
  <div class="modnum">MODULE 04</div>
  <h2>Le dictionnaire visuel, les Match Cuts & la caméra 3D</h2>
  <p>Le format repose sur une traduction systématique : <strong>un concept abstrait = une forme géométrique simple</strong>. Le spectateur comprend l'idée en moins d'une seconde, avant même que la voix ait fini la phrase.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Concept</th><th>Traduction géométrique</th><th>Icônes du pack</th></tr></thead>
    <tbody>${dictRows}</tbody>
  </table></div>
  <h3>Transitions Match Cut</h3>
  <p>Un Match Cut relie deux scènes par une <strong>forme commune</strong> : la dernière forme de la scène A devient la première forme de la scène B, à la même position et à la même taille.</p>
  <ol class="steps">
    <li><strong>Cercle → cercle</strong> : la pupille d'un œil devient le centre d'une cible, puis une planète.</li>
    <li><strong>Ligne → ligne</strong> : l'horizon devient la barre de progression, puis la courbe d'un graphique.</li>
    <li><strong>Réduction à un point</strong> : n'importe quelle forme se contracte (échelle → 0 % en 8 images) en un point qui devient l'origine de la scène suivante.</li>
    <li>Calez la coupe sur le pic d'un whoosh (piste 3) et sur une consonne forte de la voix.</li>
  </ol>
  <h3>La caméra 3D sans caméra</h3>
  <p>Le bouton <strong>3</strong> du plugin crée un objet nul 3D <code>CAMERA_CONTROLLER_3D</code> parent de tous les calques de forme 3D. Animez seulement ce nul :</p>
  <ul>
    <li><strong>Push-in</strong> : échelle 100 % → 108 % sur toute la scène (mouvement lent, presque imperceptible, qui crée de la tension).</li>
    <li><strong>Translation verticale</strong> : position Y -400 px sur 40 images pour « monter » un escalier ou suivre une route.</li>
    <li><strong>Dézoom de révélation</strong> : échelle 100 % → 35 % sur 45 images, courbe 75/85 : le détail fait partie d'un ensemble beaucoup plus grand.</li>
    <li>Espacez vos calques en Z (0, -200, -400) et activez le flou de mouvement pour une parallaxe naturelle.</li>
  </ul>
</section>

<section class="module" id="m5">
  <div class="modnum">MODULE 05</div>
  <h2>L'architecture sound design à 4 pistes</h2>
  <p>Le son fait <strong>50 % de la rétention</strong>. Chaque événement visuel a son équivalent sonore, et chaque famille de sons a sa piste et son niveau fixe.</p>
  ${trackDiagramSvg()}
  <div class="table-wrap"><table>
    <thead><tr><th>Piste</th><th>Contenu</th><th>Niveau</th><th>Règles</th></tr></thead>
    <tbody>${soundRows}</tbody>
  </table></div>
  <h3>Correspondance visuel → son (bibliothèque du pack)</h3>
  <div class="table-wrap"><table>
    <thead><tr><th>Événement visuel</th><th>Dossier SFX</th><th>Placement</th></tr></thead>
    <tbody>
      <tr><td>Ouverture, révélation, impact</td><td class="mono">01_Sub_Bass_Drops</td><td>Sur l'image exacte de l'impact</td></tr>
      <tr><td>Coupe, Match Cut, mouvement de caméra</td><td class="mono">02_Dark_Whooshes</td><td>Pic du whoosh = image de la coupe</td></tr>
      <tr><td>Apparition d'icône, texte, pop-in</td><td class="mono">03_Typewriter_&amp;_Clicks</td><td>1 clic par élément, 0 à 2 images avant</td></tr>
      <tr><td>Montée de tension avant une révélation</td><td class="mono">04_Cinematic_Risers</td><td>Se termine 1 image avant l'impact</td></tr>
      <tr><td>Ambiance de fond</td><td class="mono">05_Ambient_Drones</td><td>Boucle de 10 s sous toute la vidéo, -24 dB</td></tr>
    </tbody>
  </table></div>
  <div class="card red">Les 5 drones sont <strong>bouclables à l'échantillon près</strong> : posez-les bout à bout sans fondu, la jonction est inaudible.</div>
</section>

<section class="module" id="m6">
  <div class="modnum">MODULE 06</div>
  <h2>Les 3 storyboards viraux complets</h2>
  <p>Ces trois storyboards correspondent exactement aux trois compositions du projet <code>remotion-studio/</code> livré avec le pack : vous pouvez les rendre tels quels ou les reproduire dans votre logiciel. Les timecodes sont au format <span class="mono">HH:MM:SS:images</span> à 30 i/s.</p>
  ${STORY.videos.filter((v) => !v.bonus).map(storyboardHtml).join('\n')}
</section>

<section class="module" id="m7">
  <div class="modnum">MODULE 07</div>
  <h2>Réglages d'exportation anti-compression</h2>
  <p>Instagram et TikTok recompressent toutes les vidéos. Les fonds très sombres et le grain fin sont les premiers détruits (banding, macro-blocs). L'objectif : livrer un fichier si propre que la recompression a peu de marge pour l'abîmer.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead>
    <tbody>${exportRows}</tbody>
  </table></div>
  <h3>Où régler ces paramètres</h3>
  <ul>
    <li><strong>After Effects</strong> : Composition > Ajouter à la file d'attente Adobe Media Encoder > H.264 > Débit CBR 25 Mbps, cochez « Utiliser la qualité de rendu maximale ».</li>
    <li><strong>DaVinci Resolve</strong> : page Deliver > Format MP4, Codec H.264, Quality « Restrict to 25000 Kb/s », Encoding Profile High, Key Frames « Every 30 ».</li>
    <li><strong>CapCut Desktop</strong> : Exporter > Résolution 1080p, Débit « Personnalisé » au maximum, Codec H.264, Fréquence 30 i/s.</li>
    <li><strong>Remotion</strong> : <code>npx remotion render ... --codec=h264 --video-bitrate=25M --audio-bitrate=320k</code>.</li>
  </ul>
  <div class="card gold"><strong>Le grain protège l'image :</strong> le calque FX_04 à 6 % donne au codec une texture uniforme à encoder au lieu de larges aplats noirs, ce qui réduit fortement le banding après recompression.</div>
</section>

<footer>
  <p>Masterclass Viral Animations · Dark Minimalist Viral Animation Pack · Tous les assets (icônes, grilles, effets sonores, plugin) sont libres d'utilisation dans vos projets personnels et commerciaux. La revente ou redistribution du pack lui-même est interdite.</p>
</footer>
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Page de vente                                                       */
/* ------------------------------------------------------------------ */
function salesPage() {
  return `# COPIE PAGE DE VENTE — Beacons / Gumroad

Texte prêt à coller. Visuel à téléverser : \`Store_Cover_Mockup_1080x1080.png\`.
Fichier à livrer : \`ULTIMATE_MINIMALIST_ANIMATION_PACK.zip\`.

---

## 🇫🇷 VERSION FRANÇAISE

### Titre du produit
**Viral Minimalist Animation Pack — Formation + 150 Assets + Plugin After Effects**

### Sous-titre
Crée les animations sombres et minimalistes qui font des millions de vues — même si tu n'as jamais fait de motion design.

### Description

Tu as vu ces vidéos : fond noir, traits blancs lumineux, une voix grave, des sons qui claquent pile au bon moment. Elles cumulent des millions de vues sur TikTok, Reels et Shorts.

**Ce pack te donne le système complet pour les produire en série.**

**Ce que tu reçois :**

- 🎓 **La Masterclass complète (7 modules, HTML + PDF)**
  - Trouver l'audio viral + réglages exacts ElevenLabs (Stability 35 %, Clarity 75 %, Style 15 %) et l'égalisation de la voix
  - La pile des 4 calques d'effets du « look signature », avec les équivalences After Effects / DaVinci Resolve / CapCut
  - Trim Paths et le Speed Graph 75/85 expliqués avec schémas
  - Le dictionnaire visuel : 10 concepts abstraits traduits en formes simples + Match Cuts + caméra 3D
  - L'architecture sound design à 4 pistes (niveaux exacts)
  - 3 storyboards viraux complets (timecodes, voix-off FR/EN, visuels, effets sonores)
  - Les réglages d'export anti-compression

- ✏️ **100 icônes vectorielles SVG** en 5 thèmes (Psychologie, Discipline, Business, Stoïcisme, Personnages) — traits prêts à animer en Trim Paths

- 🔊 **30 effets sonores WAV 48 kHz** : sub drops, whooshes sombres, clics de machine à écrire, risers cinématiques, drones bouclables

- 🌌 **5 fonds et grilles 1080×1920** (grille carrée, blueprint, matrice de points, isométrique, grain de film)

- ⚡ **Le plugin After Effects « Minimalist Viral Setup »** : composition, grille, pile d'effets, rig caméra 3D, animation de tracé et pop-in en **5 clics**. Compatible AE en français et en anglais.

- 🎬 **Bonus développeurs : le projet Remotion (React)** avec les 3 vidéos complètes déjà animées et synchronisées

**Pour qui ?**
Créateurs de pages motivation, psychologie, business, philosophie ; monteurs freelances ; agences qui veulent un style reconnaissable et rapide à produire.

**Licence :** usage personnel et commercial illimité dans tes vidéos et celles de tes clients. Revente du pack interdite.

**Livraison :** téléchargement immédiat (fichier ZIP).

### Bouton d'achat
> Je veux le pack →

### FAQ courte
- **Je débute, est-ce pour moi ?** Oui. La formation part de zéro, et la méthode fonctionne aussi dans CapCut (gratuit).
- **Quelle version d'After Effects ?** CC 2018 ou plus récente, Windows et macOS.
- **Je n'ai pas After Effects.** Le guide donne les équivalences DaVinci Resolve (gratuit) et CapCut pour chaque effet.

---

## 🇬🇧 ENGLISH VERSION

### Product title
**Viral Minimalist Animation Pack — Course + 150 Assets + After Effects Plugin**

### Subtitle
Create the dark, minimalist animations that pull millions of views — even if you've never done motion design.

### Description

You've seen them: black background, glowing white lines, a deep voice, sounds that hit exactly on the cut. They rack up millions of views on TikTok, Reels and Shorts.

**This pack gives you the complete system to produce them at scale.**

**What you get:**

- 🎓 **The complete Masterclass (7 modules, HTML + PDF)**
  - Finding viral audio + exact ElevenLabs settings (Stability 35%, Clarity 75%, Style 15%) and voice EQ
  - The 4-layer "signature look" effect stack, with After Effects / DaVinci Resolve / CapCut equivalents
  - Trim Paths and the 75/85 Speed Graph explained with diagrams
  - The visual dictionary: 10 abstract concepts turned into simple shapes + Match Cuts + 3D camera
  - The 4-track sound design architecture (exact levels)
  - 3 complete viral storyboards (timecodes, FR/EN voice-over, visuals, sound effects)
  - Anti-compression export settings

- ✏️ **100 SVG vector icons** in 5 themes (Psychology, Discipline, Business, Stoicism, Characters) — strokes ready for Trim Paths

- 🔊 **30 WAV sound effects at 48 kHz**: sub drops, dark whooshes, typewriter clicks, cinematic risers, loopable drones

- 🌌 **5 backgrounds & grids at 1080×1920** (square grid, blueprint, dot matrix, isometric, film grain)

- ⚡ **The "Minimalist Viral Setup" After Effects plugin**: comp, grid, effect stack, 3D camera rig, path animation and pop-in in **5 clicks**. Works in any AE language.

- 🎬 **Developer bonus: the Remotion (React) project** with the 3 complete videos already animated and synced

**Who is it for?**
Motivation, psychology, business and philosophy page creators; freelance editors; agencies who want a recognizable style that's fast to produce.

**License:** unlimited personal and commercial use in your videos and your clients' videos. Reselling the pack is not allowed.

**Delivery:** instant download (ZIP file).

### Buy button
> Get the pack →

### Short FAQ
- **I'm a beginner, is this for me?** Yes. The course starts from zero, and the method also works in CapCut (free).
- **Which After Effects version?** CC 2018 or newer, Windows and macOS.
- **I don't have After Effects.** The guide gives DaVinci Resolve (free) and CapCut equivalents for every effect.
`;
}

/* ------------------------------------------------------------------ */
async function exportPdf(htmlPath, pdfPath) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.log('[DOC] Playwright indisponible : le guide HTML reste autonome et imprimable (Ctrl+P > PDF).');
    return false;
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'load', timeout: 60000 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch (e) {
      /* polices Google indisponibles hors ligne : repli sur les polices locales */
    }
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
    return true;
  } finally {
    await browser.close();
  }
}

async function main() {
  fs.mkdirSync(GUIDE_DIR, { recursive: true });
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });

  for (const f of ['Minimalist_Viral_Setup.jsx', 'LISEZ-MOI_INSTALLATION.txt']) {
    fs.copyFileSync(path.join(__dirname, 'plugin', f), path.join(PLUGIN_DIR, f));
    console.log(`[DOC] Plugin copié : ${f}`);
  }

  const htmlPath = path.join(GUIDE_DIR, 'MASTERCLASS_VIRAL_ANIMATIONS.html');
  fs.writeFileSync(htmlPath, guideHtml(), 'utf8');
  console.log(`[DOC] ${path.relative(ROOT, htmlPath)}`);

  const pdfPath = path.join(GUIDE_DIR, 'MASTERCLASS_VIRAL_ANIMATIONS.pdf');
  if (await exportPdf(htmlPath, pdfPath)) console.log(`[DOC] ${path.relative(ROOT, pdfPath)}`);

  const salesPath = path.join(DIST, 'COPIE_PAGE_DE_VENTE.md');
  fs.writeFileSync(salesPath, salesPage(), 'utf8');
  console.log(`[DOC] ${path.relative(ROOT, salesPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
