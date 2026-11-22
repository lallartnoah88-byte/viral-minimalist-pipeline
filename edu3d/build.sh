#!/usr/bin/env bash
# Production complète d'une vidéo TikTok éducative 3D (1080x1920, 30 fps, H.264 + AAC).
#   ./build.sh 01_chauffer_moteur            # voix → rendu 3D → bruitages/musique → MP4 final
#   STILLS=0.5,4.4,20 ./build.sh 01_...      # images de contrôle uniquement
# Prérequis : Node ≥ 18 + Playwright/Chromium, Python ≥ 3.10, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
ID="${1:?usage: ./build.sh <video_id>}"
B="build/$ID"; mkdir -p "$B" out .models

# 1) dépendances
[ -d node_modules/three ] || { npm install --silent && npx playwright install chromium; }
if [ ! -x .venv/bin/python ]; then python3 -m venv .venv; fi
.venv/bin/pip install -q -r requirements.txt
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s ".models/$f" ] || curl -sSL -o ".models/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done

# 2) voix off + horodatage mot à mot
.venv/bin/python tools/voice.py "videos/$ID/script.json" "$B" .models

if [ -n "${STILLS:-}" ]; then node render.mjs "$ID" --stills "$STILLS"; exit 0; fi

# 3) rendu 3D image par image (exporte aussi sfx.json)
node render.mjs "$ID" --workers "${WORKERS:-3}"

# 4) bruitages + musique + mixage
.venv/bin/python tools/sfx.py "$B"

# 5) assemblage final, loudness TikTok (-14 LUFS)
ffmpeg -y -loglevel error -i "$B/video_noaudio.mp4" -i "$B/mix.wav" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "out/$ID.mp4"
echo "OK → out/$ID.mp4"
