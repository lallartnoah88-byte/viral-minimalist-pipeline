#!/usr/bin/env python3
"""Voix off FR (Kokoro v1.0, voix « ff_siwis ») + horodatage mot à mot.

Usage : python tools/voice.py videos/<id>/script.json <dossier_sortie> <dossier_modeles_kokoro>
  (le dossier contient kokoro-v1.0.onnx et voices-v1.0.bin, téléchargés par build.sh)

Sorties : voice.wav (48 kHz mono) et timings.json
  { duration, segments:[{id,start,end}], words:[{seg,i,text,start,end}] }

Méthode d'horodatage : chaque segment est synthétisé d'un bloc (intonation naturelle),
les silences internes sont détectés et associés aux ponctuations (, : ; …), puis la durée
de chaque proposition est répartie entre ses mots au prorata de leurs phonèmes.
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly

SR_OUT = 48000
PUNCT_PAUSE = re.compile(r"[,:;…?!.]$")


def synth(voice, text, cfg):
    x, sr = voice.create(text, voice=cfg["name"], speed=cfg["speed"], lang="fr-fr")
    return np.asarray(x, np.float32), sr


def frame_energy(x, sr, hop=0.01):
    h = int(sr * hop)
    n = len(x) // h
    e = np.sqrt(np.mean(x[: n * h].reshape(n, h) ** 2, axis=1) + 1e-12)
    return e, hop


def trim(x, sr, thr=0.012):
    e, hop = frame_energy(x, sr)
    idx = np.where(e > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, int((idx[0] - 2) * hop * sr))
    b = min(len(x), int((idx[-1] + 4) * hop * sr))
    return x[a:b]


def silences(x, sr, thr=0.010, min_len=0.07):
    """Retourne les silences internes [(debut, fin)] en secondes."""
    e, hop = frame_energy(x, sr)
    quiet = e < thr
    out, start = [], None
    for i, q in enumerate(quiet):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if (i - start) * hop >= min_len and start > 0:
                out.append((start * hop, i * hop))
            start = None
    return out


def phoneme_weight(voice, word):
    clean = re.sub(r"[^\w'’-]", "", word)
    if not clean:
        return 1.0
    ph = voice.tokenizer.phonemize(clean, "fr-fr")
    n = len(re.sub(r"[ˈˌː\s]", "", ph))
    return max(2.0, float(n))


def main():
    script_path, out_dir, model = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
    out_dir.mkdir(parents=True, exist_ok=True)
    script = json.loads(Path(script_path).read_text(encoding="utf-8"))
    vcfg = script.get("voice", {})
    voice = Kokoro(str(Path(model) / "kokoro-v1.0.onnx"), str(Path(model) / "voices-v1.0.bin"))
    cfg = {"name": vcfg.get("name", "ff_siwis"), "speed": vcfg.get("speed", 1.1)}

    track, t = [], 0.0
    seg_out, words_out = [], []
    for seg in script["segments"]:
        gap = float(seg.get("gap", 0.15))
        if gap > 0:
            track.append(np.zeros(int(gap * SR_OUT), np.float32))
            t += gap
        x, sr = synth(voice, seg["text"], cfg)
        x = trim(x, sr)
        y = resample_poly(x, SR_OUT, sr).astype(np.float32)
        dur = len(y) / SR_OUT

        # propositions séparées par la ponctuation interne
        tokens = []
        for tok in seg["text"].split():
            if tokens and re.fullmatch(r"[:;?!…]+", tok):
                tokens[-1] += " " + tok
            else:
                tokens.append(tok)
        clauses, cur = [], []
        for tok in tokens:
            cur.append(tok)
            if PUNCT_PAUSE.search(tok):
                clauses.append(cur)
                cur = []
        if cur:
            clauses.append(cur)
        sil = silences(x, sr)
        total = len(x) / sr
        weights = [sum(phoneme_weight(voice, w) for w in c) for c in clauses]
        wsum = sum(weights)
        bounds, acc, used = [0.0], 0.0, set()
        for k in range(len(clauses) - 1):
            acc += weights[k] / wsum * total
            # silence le plus proche de la position attendue de la ponctuation k
            best, best_score = None, 1e9
            for j, (a, b) in enumerate(sil):
                if j in used or a <= bounds[-1]:
                    continue
                score = abs((a + b) / 2 - acc) - 0.8 * (b - a)
                if score < best_score and abs((a + b) / 2 - acc) < max(0.35, 0.12 * total):
                    best, best_score = j, score
            if best is None:
                bounds += [acc, acc]
            else:
                used.add(best)
                bounds += [sil[best][0], sil[best][1]]
        bounds.append(total)

        wi = 0
        for ci, clause in enumerate(clauses):
            c0, c1 = bounds[2 * ci], bounds[2 * ci + 1]
            weights = [phoneme_weight(voice, w) for w in clause]
            tot = sum(weights)
            acc = c0
            for w, wgt in zip(clause, weights):
                d = wgt / tot * (c1 - c0)
                words_out.append({
                    "seg": seg["id"], "i": wi, "text": w,
                    "start": round(t + acc, 3), "end": round(t + acc + d, 3),
                })
                acc += d
                wi += 1
        seg_out.append({"id": seg["id"], "start": round(t, 3), "end": round(t + dur, 3), "text": seg["text"]})
        track.append(y)
        t += dur

    track.append(np.zeros(int(1.2 * SR_OUT), np.float32))
    audio = np.concatenate(track)
    audio = audio / (np.max(np.abs(audio)) + 1e-9) * 0.89
    with wave.open(str(out_dir / "voice.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR_OUT)
        w.writeframes((audio * 32767).astype(np.int16).tobytes())
    timings = {"duration": round(len(audio) / SR_OUT, 3), "segments": seg_out, "words": words_out}
    (out_dir / "timings.json").write_text(json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"voix : {timings['duration']} s, {len(words_out)} mots, {len(seg_out)} segments")


if __name__ == "__main__":
    main()
