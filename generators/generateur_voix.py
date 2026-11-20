#!/usr/bin/env python3
"""generateur_voix.py — voix-off française « Henri » (Microsoft Edge TTS, fr-FR-HenriNeural).

Lit generators/storyboards.json (source unique), synthétise la phrase `voFr` de chaque scène
et la cale sur l'image de début de la scène :

  remotion-studio/public/voix/<VideoId>/scene_NN.mp3   clips posés par Remotion (piste voix, -3 dB)
  remotion-studio/src/data/voix.json                    manifeste {fichier, image de début, durée}
  DIST_PACK_TO_SELL/VOIX_OFF_HENRI/<VideoId>.wav        piste voix complète 48 kHz, à la durée exacte de la vidéo

Si une phrase est plus longue que sa scène, le débit est accéléré (jusqu'à +35 %) pour qu'elle tienne.
Les clips déjà générés pour le même texte, la même voix et le même débit sont réutilisés (cache par empreinte).

  python generators/generateur_voix.py [--voix fr-FR-HenriNeural] [--debit +0%] [--force]

Nécessite : pip install edge-tts, ffmpeg, accès réseau à speech.platform.bing.com.
"""
import argparse
import asyncio
import hashlib
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORY = os.path.join(ROOT, "generators", "storyboards.json")
CLIPS = os.path.join(ROOT, "remotion-studio", "public", "voix")
MANIFEST = os.path.join(ROOT, "remotion-studio", "src", "data", "voix.json")
FULL = os.path.join(ROOT, "DIST_PACK_TO_SELL", "VOIX_OFF_HENRI")

LEAD_IN = 6        # images de silence avant la phrase (laisse passer l'impact de début de scène)
TAIL = 10          # images de respiration minimales avant la scène suivante
MAX_SPEEDUP = 35   # accélération maximale du débit, en %


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         check=True, capture_output=True, text=True).stdout
    return float(out.strip())


async def synth(text, voice, rate, out):
    import edge_tts
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or None
    tmp = out + ".part"
    await edge_tts.Communicate(text, voice, rate=rate, proxy=proxy).save(tmp)
    os.replace(tmp, out)


def pct(rate):
    return int(rate.strip().rstrip("%"))


async def scene_clip(video_id, idx, scene, fps, voice, base_rate, force, cache):
    os.makedirs(os.path.join(CLIPS, video_id), exist_ok=True)
    rel = f"voix/{video_id}/scene_{idx + 1:02d}.mp3"
    out = os.path.join(ROOT, "remotion-studio", "public", rel)
    budget = (scene["to"] - scene["from"] - LEAD_IN - TAIL) / fps
    rate = pct(base_rate)
    while True:
        r = f"{rate:+d}%"
        key = hashlib.sha256(f"{voice}|{r}|{scene['voFr']}".encode()).hexdigest()[:16]
        if force or cache.get(rel) != key or not os.path.exists(out):
            await synth(scene["voFr"], voice, r, out)
        sec = duration(out)
        if sec <= budget or rate >= pct(base_rate) + MAX_SPEEDUP:
            break
        rate = min(pct(base_rate) + MAX_SPEEDUP, rate + max(5, int((sec / budget - 1) * 100) + 2))
    if sec > budget:
        print(f"  ! {video_id} scène {idx + 1} : {sec:.2f}s pour {budget:.2f}s disponibles, déborde légèrement")
    start = scene["from"] + LEAD_IN
    print(f"  {video_id} scène {idx + 1} : {sec:5.2f}s  débit {r:>5}  image {start}")
    return {"file": rel, "frame": start, "durationInFrames": int(sec * fps) + 2, "rate": r, "hash": key, "text": scene["voFr"]}


def assemble(video_id, entries, total_frames, fps):
    os.makedirs(FULL, exist_ok=True)
    out = os.path.join(FULL, f"{video_id}_Henri.wav")
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for e in entries:
        cmd += ["-i", os.path.join(ROOT, "remotion-studio", "public", e["file"])]
    chains = [f"[{i}:a]aresample=48000,adelay={round(e['frame'] / fps * 1000)}:all=1[a{i}]" for i, e in enumerate(entries)]
    mix = "".join(f"[a{i}]" for i in range(len(entries)))
    chains.append(f"{mix}amix=inputs={len(entries)}:normalize=0,apad,atrim=0:{total_frames / fps:.3f}[out]")
    cmd += ["-filter_complex", ";".join(chains), "-map", "[out]", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", out]
    subprocess.run(cmd, check=True)
    return out


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voix", default="fr-FR-HenriNeural")
    ap.add_argument("--debit", default="+0%", help="débit de base, ex. +5%%")
    ap.add_argument("--force", action="store_true", help="régénère tous les clips")
    a = ap.parse_args()

    story = json.load(open(STORY, encoding="utf-8"))
    old = json.load(open(MANIFEST, encoding="utf-8")) if os.path.exists(MANIFEST) else {"videos": {}}
    fps = story["fps"]
    manifest = {"voice": a.voix, "volumeDb": -3, "videos": {}}
    for v in story["videos"]:
        cache = {e["file"]: e["hash"] for e in old.get("videos", {}).get(v["id"], []) if old.get("voice") == a.voix}
        entries = [await scene_clip(v["id"], i, s, fps, a.voix, a.debit, a.force, cache) for i, s in enumerate(v["scenes"])]
        manifest["videos"][v["id"]] = entries
        print(f"✓ {os.path.relpath(assemble(v['id'], entries, v['durationInFrames'], fps), ROOT)}")
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"✓ {os.path.relpath(MANIFEST, ROOT)}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ModuleNotFoundError:
        sys.exit("edge-tts manquant : pip install edge-tts")
