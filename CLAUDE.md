# CLAUDE.md — Dark Minimalist Viral Animations

Système complet de création et de vente d'un pack d'animation « dark minimalist » (Beacons / Gumroad)
et moteur vidéo Remotion associé. Tout est généré par script : **aucun asset n'est édité à la main**.

## Commande unique

```bash
./build_all.sh                 # génère, valide, zippe, vérifie Remotion + aperçu
RENDER_ALL=1 ./build_all.sh    # + rend les 3 vidéos MP4 dans remotion-studio/out/
SKIP_REMOTION=1 ./build_all.sh # pack uniquement
```

Prérequis : Node.js ≥ 18, Python ≥ 3.10, `zip`. Le script crée `.venv/` (numpy, scipy, pillow).
Le PDF du guide utilise Playwright/Chromium s'il est installé, sinon le HTML reste autonome et imprimable.

## Architecture

| Chemin | Rôle |
|---|---|
| `generators/generate_svgs.js` | 100 icônes SVG (5 dossiers × 20), traits blancs 5 px, viewBox 240, centrées sur (120,120) |
| `generators/generate_grids.py` | 5 grilles PNG 1080×1920 RGBA + `Store_Cover_Mockup_1080x1080.png` |
| `generators/generate_sfx.py` | 30 WAV 48 kHz / 16 bits / -3 dBFS synthétisés (numpy/scipy) |
| `generators/plugin/` | Source du plugin AE `Minimalist_Viral_Setup.jsx` (ES3) + LISEZ-MOI FR/EN |
| `generators/validate_jsx.js` | Contrôle ECMAScript 3 du plugin (acorn `ecmaVersion: 3` + motifs interdits) |
| `generators/storyboards.json` | **Source unique** des 3 storyboards (timecodes, voix FR/EN, visuels, SFX) — utilisée par le guide ET par Remotion |
| `generators/generate_docs.js` | Guide `MASTERCLASS_VIRAL_ANIMATIONS.html/.pdf` (7 modules), copie du plugin, `COPIE_PAGE_DE_VENTE.md` |
| `DIST_PACK_TO_SELL/` | Sortie : pack, ZIP client, mockup boutique, texte de vente |
| `remotion-studio/` | Projet Remotion (React + TS) : composants + 3 vidéos 660 images, 1080×1920, 30 fps |

## Règles à respecter

- **Zéro placeholder** : pas de `TODO`, `...`, listes tronquées. Chaque fichier généré est réel et unique
  (le générateur SVG refuse les doublons et les coordonnées `NaN`).
- **Plugin AE = ECMAScript 3** : uniquement `var`, boucles `for`, pas de `const`/`let`/`=>`/`map`/`forEach`/`indexOf`/`JSON`.
  Effets et propriétés appelés par **matchName** (`ADBE Glo2`, `ADBE Vector Filter - Trim`, …) avec repli par index,
  pour fonctionner dans AE en français comme en anglais. Toujours lancer `node generators/validate_jsx.js`.
- **Style** : fond `#070707`, blanc `#FFFFFF`, rouge `#FF1E1E`, or `#FFC72C`. Courbe signature
  `cubic-bezier(0.75, 0, 0.15, 1)` = influence 75 % / 85 % dans After Effects.
- **Synchronisation son/image** : modifier un timing = modifier `storyboards.json` puis relancer `build_all.sh`
  (le guide et `SfxTrack` de Remotion relisent ce fichier).
- **Mix 4 pistes** : voix -3 dB, impacts -10 dB, mouvements -12 dB, drone -24 dB (`remotion-studio/src/components/SfxTrack.tsx`).

## Remotion

```bash
cd remotion-studio
npm install
npm run studio      # éditeur interactif
npm run typecheck   # tsc --noEmit
npm run preview     # image fixe de contrôle
npm run render-all  # 3 MP4 H.264 25 Mbps
```

Compositions : `Video1-MentalNoise`, `Video2-MotivationIllusion`, `Video3-PriceOfDifference`.
Composants : `MinimalCanvas` (fond, grille, grain, line boil, postérisation 15 fps), `GlowingSvgPath`
(tracé stroke-dashoffset + double lueur), `TypewriterText` (JetBrains Mono + curseur), `CameraRig` (pan/zoom/secousses).
