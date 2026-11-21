#!/usr/bin/env python3
"""
build_episode.py — Voix off, alignement mot à mot, sous-titres et sound design d'un épisode.

    .venv/bin/python tools/build_episode.py episodes/eternuement.json [--force-tts]

Entrée  : episodes/<slug>.json (plans, texte découpé en groupes « | », bruitages ancrés sur des mots)
Sorties : public/<slug>/voice.wav      voix off neuronale (edge-tts) 48 kHz
          public/<slug>/fx.wav         bruitages + nappe musicale synthétisés (numpy/scipy)
          src/episodes/<slug>.timeline.json   plans, sous-titres, repères de mots (en images)

La durée de chaque plan est dictée par la voix : un plan commence sur son premier mot,
donc changer le texte d'un plan = relancer ce script, le montage se recale tout seul.
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
LEAD = 0.10  # le plan démarre 100 ms avant son premier mot (coupe « sur le souffle »)


# ----------------------------------------------------------------------------- texte
def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))


def display(group: str) -> str:
    """Règle des sous-titres de référence : casse d'origine, aucune ponctuation finale."""
    g = re.sub(r"[.,!?;:…«»\"]", "", group)
    return re.sub(r"\s+", " ", g).strip()


# ----------------------------------------------------------------------------- TTS
async def synth(text: str, voice: str, rate: str, pitch: str, mp3: Path) -> list[dict]:
    import edge_tts

    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for chunk in com.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({"text": chunk["text"], "start": chunk["offset"] / 1e7,
                          "end": (chunk["offset"] + chunk["duration"]) / 1e7})
    mp3.write_bytes(bytes(audio))
    return words


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1",
                          "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def write_wav(path: Path, x: np.ndarray) -> None:
    from scipy.io import wavfile
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


# ----------------------------------------------------------------------------- alignement
def align(groups: list[str], words: list[dict]) -> list[tuple[float, float]]:
    """Associe chaque groupe de sous-titre à (début, fin) en secondes via les WordBoundary."""
    full, spans = "", []
    for g in groups:
        n = norm(g)
        spans.append((len(full), len(full) + len(n)))
        full += n
    marks, cur = [], 0  # (index caractère début, index fin, t0, t1)
    for w in words:
        n = norm(w["text"])
        if not n:
            continue
        i = full.find(n, cur)
        if i < 0 or i - cur > 40:
            continue
        marks.append((i, i + len(n), w["start"], w["end"]))
        cur = i + len(n)
    if not marks:
        raise SystemExit("Alignement impossible : aucune frontière de mot reconnue")
    out = []
    for a, b in spans:
        inside = [m for m in marks if m[1] > a and m[0] < b]
        if inside:
            def at(m, c):  # temps interpolé dans un mot qui couvre plusieurs groupes (« 2018 un »)
                return m[2] + (m[3] - m[2]) * (min(max(c, m[0]), m[1]) - m[0]) / max(1, m[1] - m[0])
            out.append((at(inside[0], a), at(inside[-1], b)))
        else:  # interpolation linéaire sur l'index de caractère
            ci = np.array([m[0] for m in marks]); ti = np.array([m[2] for m in marks])
            out.append((float(np.interp(a, ci, ti)), float(np.interp(b, ci, ti))))
    return out


# ----------------------------------------------------------------------------- synthèse SFX
rng = np.random.default_rng(7)


def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a, r, curve=4.0):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2
    e[-nr:] *= np.exp(-curve * np.linspace(0, 1, nr))
    return e
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)
def nrm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak


def sweep_noise(d, f0, f1, q=0.35):
    """Bruit filtré dont la fréquence centrale glisse de f0 à f1 (whoosh)."""
    x = noise(d); out = np.zeros_like(x); hop = 512
    freqs = np.geomspace(f0, f1, len(x) // hop + 1)
    zi = None
    for k, f in enumerate(freqs):
        seg = x[k * hop:(k + 1) * hop]
        if not len(seg):
            break
        sos = signal.butter(2, [f * (1 - q), f * (1 + q)], "bandpass", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[k * hop:k * hop + len(y)] = y
    return out


def fx_whoosh(d=0.45, f0=300, f1=3200):
    x = sweep_noise(d, f0, f1); n = len(x)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return nrm(x * e)
def fx_whooshIn(): return fx_whoosh(0.38, 2500, 400)
def fx_whooshDeep():
    x = fx_whoosh(0.55, 120, 900)
    t = t_(0.55); sub = np.sin(2 * np.pi * (70 - 30 * t / 0.55) * t) * env(len(t), 0.05, 0.4)
    return nrm(x + 0.6 * sub)
def fx_pop(d=0.12):
    t = t_(d); f = 900 * np.exp(-t * 28) + 220
    return nrm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, d * 0.9, 6))
def fx_bonk():
    t = t_(0.3); f = 260 * np.exp(-t * 6) + 90
    return nrm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.28, 5) + 0.15 * lp(noise(0.3), 800) * env(len(t), 0.001, 0.05))
def fx_thump():
    t = t_(0.5); f = 95 * np.exp(-t * 5) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.48, 4.5)
    click = lp(noise(0.5), 2500) * env(len(t), 0.0005, 0.03, 8)
    return nrm(body + 0.4 * click)
def fx_tear():
    d = 0.75; x = noise(d); n = len(x)
    grain = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n) * 6
    rip = bp(x + grain, 900, 5200) * env(n, 0.004, 0.65, 3.5)
    t = t_(d); low = np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 8)) * t) * env(n, 0.002, 0.5, 4)
    return nrm(rip + 0.7 * low)
def fx_hiss(d=1.2):
    x = hp(noise(d), 3500) * env(int(d * SR), 0.05, d * 0.8, 2.5)
    return nrm(x, 0.6)
def fx_pressure(d=1.4):
    t = t_(d); f = 55 + 70 * (t / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    x *= (0.6 + 0.4 * np.sin(2 * np.pi * (6 + 10 * t / d) * t))
    return nrm(x * env(len(t), d * 0.6, 0.15, 3))
def fx_riser(d=1.6):
    x = sweep_noise(d, 200, 4000, 0.25); t = t_(d)
    tone = np.sin(2 * np.pi * np.cumsum(180 + 500 * (t / d) ** 2) / SR) * 0.35
    return nrm((x + tone) * (t / d) ** 1.8 * env(len(t), 0.01, 0.06, 2))
def fx_engine(d=3.0):
    t = t_(d); f = 38 + 3 * np.sin(2 * np.pi * 0.7 * t)
    x = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in (1, 2, 3, 4.02))
    x += 0.25 * lp(noise(d), 300)
    return nrm(x * env(len(t), 0.2, 0.4, 2), 0.7)
def fx_squeak():
    t = t_(0.18); f = 1400 + 600 * np.sin(np.pi * t / 0.18)
    return nrm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.01, 0.12, 4), 0.5)
def fx_tick():
    t = t_(0.06); return nrm(np.sin(2 * np.pi * 2400 * t) * env(len(t), 0.0005, 0.05, 9))
def fx_inflate(d=1.1):
    t = t_(d); f = 120 + 260 * (t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + bp(noise(d), 400, 1600) * 0.5
    return nrm(x * env(len(t), 0.1, 0.2, 3))
def fx_crackle(d=1.4):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(46):
        i = int(rng.random() ** 0.8 * (n - 2400)); L = int(rng.integers(150, 900))
        x[i:i + L] += rng.standard_normal(L) * np.exp(-np.linspace(0, 9, L)) * rng.uniform(0.3, 1)
    return nrm(hp(x, 1200))
def fx_bubbles(d=1.3):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(14):
        i = int(rng.random() * (n - 6000)); L = int(SR * rng.uniform(0.04, 0.09)); t = np.arange(L) / SR
        f0 = rng.uniform(500, 1300)
        x[i:i + L] += np.sin(2 * np.pi * np.cumsum(f0 * (1 + 3 * t / t[-1])) / SR) * np.exp(-t * 40)
    return nrm(x)
def fx_scan(d=1.0):
    t = t_(d); x = np.sin(2 * np.pi * 880 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t)))
    return nrm(lp(x, 3000) * env(len(t), 0.02, 0.3, 3), 0.6)
def fx_hum(d=3.0):
    t = t_(d); x = np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 220.5 * t) + 0.2 * bp(noise(d), 600, 1200)
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 1.5 * t)
    return nrm(x * env(len(t), 0.3, 0.4, 2), 0.7)
def fx_beep():
    t = t_(0.16); return nrm(np.sin(2 * np.pi * 1760 * t) * env(len(t), 0.004, 0.06, 5), 0.6)
def fx_shimmer(d=1.6):
    t = t_(d); x = np.zeros_like(t)
    for k, f in enumerate((1318.5, 1568, 1975.5, 2637)):
        s = int(k * 0.09 * SR); tt = t[: len(t) - s]
        x[s:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2)
    return nrm(x)
def fx_ding():
    t = t_(1.2); x = np.sin(2 * np.pi * 1046.5 * t) + 0.4 * np.sin(2 * np.pi * 2093 * t) + 0.2 * np.sin(2 * np.pi * 3140 * t)
    return nrm(x * np.exp(-t * 3.5) * env(len(t), 0.002, 0.05, 1))
def fx_flip():
    out = np.zeros(int(0.35 * SR))
    for k in range(4):
        c = lp(noise(0.03), 4000) * env(int(0.03 * SR), 0.001, 0.025, 6)
        s = int(k * 0.06 * SR); out[s:s + len(c)] += c * (1 - k * 0.15)
    return nrm(out)
def fx_pulse(d=1.2):
    t = t_(d); x = np.sin(2 * np.pi * 60 * t) * (np.sin(2 * np.pi * 2.4 * t) > 0.3)
    return nrm(lp(x, 400) * env(len(t), 0.02, 0.2, 2))
def fx_sneeze():
    """« Atchoum » synthétique : inspiration bruitée + explosion de souffle."""
    inh = bp(noise(0.45), 700, 2600) * np.linspace(0, 1, int(0.45 * SR)) ** 2 * 0.35
    burst_d = 0.5; n = int(burst_d * SR); t = np.arange(n) / SR
    voiced = signal.sawtooth(2 * np.pi * (210 - 80 * t / burst_d) * t) * 0.25
    burst = (bp(noise(burst_d), 1500, 7500) + bp(voiced, 300, 2500)) * env(n, 0.003, 0.45, 4)
    return nrm(np.concatenate([inh, np.zeros(int(0.05 * SR)), burst]))


FX = {k[3:]: v for k, v in globals().items() if k.startswith("fx_")}


def music_bed(d: float) -> np.ndarray:
    """Nappe discrète (pads + pluck) à 96 BPM, accords Fa–Ré m–Si♭–Do."""
    t = t_(d); x = np.zeros_like(t); beat = 60 / 96
    chords = [(174.6, 220, 261.6), (146.8, 174.6, 220), (116.5, 146.8, 174.6), (130.8, 164.8, 196)]
    bar = beat * 4
    for i in range(int(d / bar) + 1):
        ch = chords[i % 4]; s = int(i * bar * SR); L = min(int(bar * SR), len(t) - s)
        if L <= 0:
            break
        tt = np.arange(L) / SR; pad = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) for f in ch)
        x[s:s + L] += pad * env(L, 0.25, 0.4, 2) * 0.25
        for b in range(8):  # croches pluck
            ps = s + int(b * beat / 2 * SR); f = ch[(b * 2) % 3] * 2
            Lp = min(int(0.35 * SR), len(t) - ps)
            if Lp <= 0:
                continue
            tp = np.arange(Lp) / SR
            x[ps:ps + Lp] += np.sin(2 * np.pi * f * tp) * np.exp(-tp * 11) * 0.22
    return lp(x, 3500)


def db(g): return 10 ** (g / 20)


# ----------------------------------------------------------------------------- principal
def main() -> None:
    ep_path = Path(sys.argv[1]).resolve()
    force = "--force-tts" in sys.argv
    ep = json.loads(ep_path.read_text(encoding="utf-8"))
    slug, fps = ep["slug"], ep["fps"]
    out_pub = ROOT / "public" / slug; out_pub.mkdir(parents=True, exist_ok=True)
    out_tl = ROOT / "src" / "episodes"; out_tl.mkdir(parents=True, exist_ok=True)

    groups, owner = [], []
    for si, shot in enumerate(ep["shots"]):
        for g in shot["text"].split("|"):
            groups.append(g.strip()); owner.append(si)
    script = " ".join(groups)

    mp3, cache = out_pub / "voice.mp3", out_pub / "voice.words.json"
    key = json.dumps([script, ep["voice"], ep["rate"], ep["pitch"]], ensure_ascii=False)
    if force or not cache.exists() or json.loads(cache.read_text())["key"] != key:
        print(f"TTS {ep['voice']} ({len(script)} caractères)…")
        words = asyncio.run(synth(script, ep["voice"], ep["rate"], ep["pitch"], mp3))
        cache.write_text(json.dumps({"key": key, "words": words}, ensure_ascii=False, indent=1))
    words = json.loads(cache.read_text())["words"]
    voice = decode(mp3)
    times = align(groups, words)

    # Débuts de plans = premier mot du plan - LEAD
    nshots = len(ep["shots"])
    starts = []
    for si in range(nshots):
        gi = owner.index(si)
        starts.append(0.0 if si == 0 else max(0.0, times[gi][0] - LEAD))
    total = times[-1][1] + ep.get("tailSeconds", 0.8)
    ends = starts[1:] + [total]
    total_frames = int(np.ceil(total * fps))
    fr = lambda s: int(round(s * fps))

    subs = []
    for gi, g in enumerate(groups):
        a = times[gi][0]
        b = times[gi + 1][0] if gi + 1 < len(groups) else total
        subs.append({"text": display(g), "from": fr(a), "to": fr(b)})

    shots_out = []
    fx_track = np.zeros(int(total * SR) + SR)
    for si, shot in enumerate(ep["shots"]):
        s0, s1 = starts[si], ends[si]
        shot_words = [w for w in words if s0 - 0.05 <= w["start"] < s1]
        cues = {}
        for w in shot_words:
            cues.setdefault(norm(w["text"]), fr(w["start"] - s0))
        shots_out.append({"id": shot["id"], "scene": shot["scene"], "params": shot.get("params", {}),
                          "from": fr(s0), "dur": fr(s1) - fr(s0), "cues": cues})
        for c in shot.get("sfx", []):
            if "word" in c:
                k = norm(c["word"])
                w = next((w for w in shot_words if norm(w["text"]) == k), None) or \
                    next((w for w in shot_words if k in norm(w["text"])), None)
                if w is None:
                    raise SystemExit(f"[{shot['id']}] mot d'ancrage introuvable : {c['word']}")
                at = w["start"]
            else:
                at = s0 + c.get("at", 0.0)
            at += c.get("offset", 0.0)
            fn = FX[c["fx"]]
            if c.get("dur") == "shot" and fn.__code__.co_argcount:
                clip = fn(max(0.3, s1 - at))
            else:
                clip = fn()
            i = max(0, int(at * SR)); j = min(len(fx_track), i + len(clip))
            fx_track[i:j] += clip[: j - i] * db(c.get("gain", -12))

    bed = music_bed(len(fx_track) / SR)
    bed *= np.minimum(1, np.arange(len(bed)) / (0.4 * SR))
    fade = np.ones(len(bed)); nf = int(0.8 * SR); fade[-nf:] = np.linspace(1, 0, nf)
    fx_track += nrm(bed) * db(-27) * fade

    v = np.zeros(len(fx_track)); v[: min(len(voice), len(v))] = voice[: len(v)]
    v = v / (np.max(np.abs(v)) + 1e-9) * db(-3)
    write_wav(out_pub / "voice.wav", v)
    write_wav(out_pub / "fx.wav", np.tanh(fx_track * 1.1) * 0.9)

    tl = {"slug": slug, "compositionId": ep["compositionId"], "title": ep["title"], "fps": fps,
          "durationInFrames": total_frames, "shots": shots_out, "subs": subs}
    (out_tl / f"{slug}.timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✓ {slug} : {total:.2f} s · {total_frames} images · {nshots} plans · {len(subs)} sous-titres")
    for s in shots_out:
        print(f"   {s['from']:>5} +{s['dur']:>3}  {s['id']:<14} {s['scene']}")


if __name__ == "__main__":
    main()
