#!/usr/bin/env bash
# =============================================================================
# build_all.sh — Construit tout le "Dark Minimalist Viral Animation Pack"
#   1. Génère les 100 SVG, 5 grilles PNG + mockup, 30 WAV, le guide et la page de vente
#   2. Valide le plugin After Effects (ECMAScript 3)
#   3. Vérifie la présence et la taille non nulle de chaque fichier
#   4. Crée DIST_PACK_TO_SELL/ULTIMATE_MINIMALIST_ANIMATION_PACK.zip
#   5. Synchronise les assets dans remotion-studio/, vérifie TypeScript et rend un aperçu
#
# Options (variables d'environnement) :
#   RENDER_ALL=1   rend aussi les 3 vidéos MP4 complètes dans remotion-studio/out/
#   SKIP_REMOTION=1  saute l'étape Remotion
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

DIST="DIST_PACK_TO_SELL"
PACK="$DIST/ULTIMATE_MINIMALIST_ANIMATION_PACK"
ZIP="$DIST/ULTIMATE_MINIMALIST_ANIMATION_PACK.zip"
PY="$ROOT/.venv/bin/python"

step() { printf '\n\033[1;31m▌\033[0m \033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$1"; }

# --- 0. Environnement Python -------------------------------------------------
step "0. Environnement Python (.venv : numpy, scipy, pillow)"
if [ ! -x "$PY" ]; then
  python3 -m venv .venv
fi
if ! "$PY" -c "import numpy, scipy, PIL" 2>/dev/null; then
  "$PY" -m pip install --quiet --disable-pip-version-check numpy scipy pillow
fi
ok "Python prêt : $("$PY" -c 'import numpy, scipy, PIL; print(f"numpy {numpy.__version__} · scipy {scipy.__version__} · Pillow {PIL.__version__}")')"

# --- 1. Générateurs ----------------------------------------------------------
step "1. Génération des assets"
rm -rf "$PACK"
mkdir -p "$PACK"
node generators/generate_svgs.js
"$PY" generators/generate_grids.py
"$PY" generators/generate_sfx.py | tail -n 1
node generators/validate_jsx.js generators/plugin/Minimalist_Viral_Setup.jsx
node generators/generate_docs.js

# --- 2. Validation -----------------------------------------------------------
step "2. Vérification des fichiers"
count() { find "$1" -type f -name "$2" | wc -l | tr -d ' '; }
expect() { # dossier motif attendu libellé
  local n; n=$(count "$1" "$2")
  [ "$n" -eq "$3" ] || fail "$4 : $n trouvé(s), $3 attendu(s)"
  ok "$4 : $n"
}
expect "$PACK/01_Icones_Minimalistes_SVG" '*.svg' 100 "Icônes SVG"
for d in "$PACK"/01_Icones_Minimalistes_SVG/*/; do
  expect "$d" '*.svg' 20 "  $(basename "$d")"
done
expect "$PACK/02_Fonds_&_Grilles_1080x1920" '*.png' 5 "Grilles PNG"
expect "$PACK/03_Sound_Design_SFX_WAV" '*.wav' 30 "Effets sonores WAV"
expect "$PACK/03_Sound_Design_SFX_WAV/01_Sub_Bass_Drops" '*.wav' 6 "  01_Sub_Bass_Drops"
expect "$PACK/03_Sound_Design_SFX_WAV/02_Dark_Whooshes" '*.wav' 8 "  02_Dark_Whooshes"
expect "$PACK/03_Sound_Design_SFX_WAV/03_Typewriter_&_Clicks" '*.wav' 6 "  03_Typewriter_&_Clicks"
expect "$PACK/03_Sound_Design_SFX_WAV/04_Cinematic_Risers" '*.wav' 5 "  04_Cinematic_Risers"
expect "$PACK/03_Sound_Design_SFX_WAV/05_Ambient_Drones" '*.wav' 5 "  05_Ambient_Drones"

REQUIRED=(
  "$PACK/04_Plugin_After_Effects/Minimalist_Viral_Setup.jsx"
  "$PACK/04_Plugin_After_Effects/LISEZ-MOI_INSTALLATION.txt"
  "$PACK/05_Formation_Complete_Guide/MASTERCLASS_VIRAL_ANIMATIONS.html"
  "$DIST/Store_Cover_Mockup_1080x1080.png"
  "$DIST/COPIE_PAGE_DE_VENTE.md"
)
for f in "${REQUIRED[@]}"; do
  [ -s "$f" ] || fail "Fichier manquant ou vide : $f"
  ok "$(basename "$f")"
done
if [ -s "$PACK/05_Formation_Complete_Guide/MASTERCLASS_VIRAL_ANIMATIONS.pdf" ]; then
  ok "MASTERCLASS_VIRAL_ANIMATIONS.pdf"
else
  echo "  (PDF non généré : Chromium indisponible — le guide HTML est autonome et imprimable)"
fi

EMPTY=$(find "$PACK" -type f -size 0 | wc -l | tr -d ' ')
[ "$EMPTY" -eq 0 ] || fail "$EMPTY fichier(s) vide(s) dans le pack"
ok "Aucun fichier vide ($(find "$PACK" -type f | wc -l | tr -d ' ') fichiers au total)"

# Contrôle du format audio (48 kHz / 16 bits) et des dimensions d'images
"$PY" - "$PACK" "$DIST" <<'PYCHECK'
import sys, wave, glob
from PIL import Image
pack, dist = sys.argv[1], sys.argv[2]
for f in glob.glob(f"{pack}/03_Sound_Design_SFX_WAV/*/*.wav"):
    with wave.open(f) as w:
        assert w.getframerate() == 48000 and w.getsampwidth() == 2, f"Format WAV invalide : {f}"
for f in glob.glob(f"{pack}/02_Fonds_&_Grilles_1080x1920/*.png"):
    im = Image.open(f)
    assert im.size == (1080, 1920) and im.mode == "RGBA", f"PNG invalide : {f} {im.size} {im.mode}"
im = Image.open(f"{dist}/Store_Cover_Mockup_1080x1080.png")
assert im.size == (1080, 1080), "Mockup : dimensions invalides"
print("\033[32m✓\033[0m Formats : WAV 48 kHz / 16 bits · PNG 1080x1920 RGBA · Mockup 1080x1080")
PYCHECK

# Chaque SFX cité dans les storyboards doit exister dans le pack (synchronisation guide <-> Remotion)
node -e '
const fs = require("fs"), path = require("path");
const story = require("./generators/storyboards.json");
const have = new Set();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(path.join(d, e.name)) : have.add(e.name));
walk(process.argv[1]);
const missing = [];
for (const v of story.videos) for (const f of [v.music, ...v.scenes.flatMap((s) => s.sfx.map((x) => x.file))]) if (!have.has(f)) missing.push(v.id + " -> " + f);
if (missing.length) { console.error("SFX introuvables :\n  " + missing.join("\n  ")); process.exit(1); }
console.log("\x1b[32m✓\x1b[0m Storyboards : toutes les références SFX existent");
' "$PACK/03_Sound_Design_SFX_WAV" || fail "Storyboards incohérents avec la bibliothèque SFX"

# --- 3. Archive ZIP ----------------------------------------------------------
step "3. Création de l'archive ZIP"
rm -f "$ZIP"
( cd "$DIST" && zip -r -9 -q -X "$(basename "$ZIP")" "$(basename "$PACK")" )
zip -T "$ZIP" >/dev/null || fail "Archive ZIP corrompue"
ZIP_FILES=$(unzip -Z1 "$ZIP" | grep -cv '/$')
SRC_FILES=$(find "$PACK" -type f | wc -l | tr -d ' ')
[ "$ZIP_FILES" -eq "$SRC_FILES" ] || fail "ZIP : $ZIP_FILES fichiers au lieu de $SRC_FILES"
ok "$ZIP ($(du -h "$ZIP" | cut -f1), $ZIP_FILES fichiers, intégrité vérifiée)"

# --- 4. Remotion -------------------------------------------------------------
if [ "${SKIP_REMOTION:-0}" = "1" ]; then
  step "4. Remotion : étape sautée (SKIP_REMOTION=1)"
  exit 0
fi
step "4. Studio Remotion"
RS="remotion-studio"
mkdir -p "$RS/public/sfx" "$RS/public/icons" "$RS/public/fonts" "$RS/src/data"
cp "$PACK"/03_Sound_Design_SFX_WAV/*/*.wav "$RS/public/sfx/"
rm -rf "$RS/public/icons" && mkdir -p "$RS/public/icons"
cp -R "$PACK/01_Icones_Minimalistes_SVG/." "$RS/public/icons/"
cp generators/storyboards.json "$RS/src/data/storyboards.json"
if [ ! -s "$RS/public/fonts/JetBrainsMono-Bold.ttf" ] && [ -s /usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf ]; then
  cp /usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf "$RS/public/fonts/"
fi
ok "Assets synchronisés dans $RS/public (SFX, icônes, police) + storyboards"

cd "$RS"
[ -d node_modules ] || npm install --no-audit --no-fund
npx tsc --noEmit
ok "TypeScript : compilation sans erreur"

# Navigateur local si disponible (évite le téléchargement de Chrome Headless Shell)
for cand in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do
  if [ -x "$cand" ]; then export REMOTION_BROWSER_EXECUTABLE="$cand"; break; fi
done

mkdir -p out
npx remotion still src/index.ts Video1-MentalNoise out/preview_video1.png --frame=500 --log=error
[ -s out/preview_video1.png ] || fail "Aperçu Remotion non généré"
ok "Aperçu rendu : $RS/out/preview_video1.png"

if [ "${RENDER_ALL:-0}" = "1" ]; then
  npm run render-all
  for v in Video1_MentalNoise Video2_MotivationIllusion Video3_PriceOfDifference; do
    [ -s "out/$v.mp4" ] || fail "Rendu manquant : out/$v.mp4"
    ok "out/$v.mp4"
  done
else
  echo "  Rendu complet des 3 vidéos : RENDER_ALL=1 ./build_all.sh  (ou : cd $RS && npm run render-all)"
fi

step "Terminé ✔"
