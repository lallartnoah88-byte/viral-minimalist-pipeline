#!/usr/bin/env bash
# Rend un épisode de bout en bout : voix + timeline + sons → rendu 3D Remotion → mastering audio.
# Usage : ./render_episode.sh eternuement        (lit episodes/eternuement.json)
#         SKIP_TTS=1 ./render_episode.sh eternuement   (réutilise la voix en cache)
set -euo pipefail
cd "$(dirname "$0")"
SLUG="${1:?usage: render_episode.sh <slug>}"
EP="episodes/$SLUG.json"
[ -f "$EP" ] || { echo "Épisode introuvable : $EP" >&2; exit 1; }

if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
  .venv/bin/pip install --quiet numpy scipy edge-tts
fi
[ -d node_modules ] || npm install --no-audit --no-fund

if [ -z "${REMOTION_BROWSER_EXECUTABLE:-}" ]; then
  for cand in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do
    [ -x "$cand" ] && export REMOTION_BROWSER_EXECUTABLE="$cand" && break
  done
fi

.venv/bin/python tools/build_episode.py "$EP"
COMP=$(python3 -c "import json;print(json.load(open('$EP'))['compositionId'])")
mkdir -p out
npx tsc --noEmit
npx remotion render src/index.ts "$COMP" "out/${SLUG}_raw.mp4" --concurrency="${REMOTION_CONCURRENCY:-3}"

# Mastering : -12 LUFS intégrés, crête vraie -1 dBTP (niveau des vidéos de référence ≈ -11 LUFS).
ffmpeg -v error -y -i "out/${SLUG}_raw.mp4" -c:v copy \
  -af "loudnorm=I=-12:TP=-1:LRA=7" -c:a aac -b:a 320k -ar 48000 -movflags +faststart "out/${SLUG}.mp4"
rm -f "out/${SLUG}_raw.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "out/${SLUG}.mp4"
echo "✓ out/${SLUG}.mp4"
