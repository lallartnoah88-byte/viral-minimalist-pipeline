#!/usr/bin/env bash
# Planche contact : une image au milieu de chaque plan (contrôle qualité rapide, 1/2 résolution).
# Usage : tools/contact_sheet.sh <compositionId> <timeline.json> <dossier_sortie> [position 0..1]
set -euo pipefail
COMP="$1"; TL="$2"; OUT="$3"; POS="${4:-0.6}"
mkdir -p "$OUT"
FRAMES=$(python3 -c "import json,sys;d=json.load(open('$TL'));print(' '.join(str(s['from']+int(s['dur']*$POS)) for s in d['shots']))")
npx remotion bundle src/index.ts --out-dir "$OUT/bundle" >/dev/null 2>&1 || true
i=0
for F in $FRAMES; do
  npx remotion still "$OUT/bundle" "$COMP" "$OUT/s$(printf %02d $i)_f$F.jpg" --frame="$F" --scale=0.5 --image-format=jpeg >/dev/null 2>&1 &
  i=$((i+1))
  if (( i % 4 == 0 )); then wait; fi
done
wait
ffmpeg -v error -y -pattern_type glob -i "$OUT/s*.jpg" -vf "scale=270:-1,tile=8x2" "$OUT/sheet.jpg"
echo "$OUT/sheet.jpg"
