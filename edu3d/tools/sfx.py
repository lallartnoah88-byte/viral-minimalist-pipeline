#!/usr/bin/env python3
"""Sound design synthétisé + musique de fond + mixage final.

Usage : python tools/sfx.py <dossier_build>
Entrées : voice.wav, sfx.json (repères exportés par la scène 3D), timings.json
Sortie  : mix.wav (48 kHz stéréo, crête -1 dBFS)

Mix : voix 0 dB (compressée, éclaircie), bruitages -9 à -14 dB, musique -22 dB avec ducking sous la voix.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
R = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=0.1, shape=3.0):
    x = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    x[:na] = np.linspace(0, 1, na)
    if nr < n:
        x[-nr:] *= np.linspace(1, 0, nr) ** shape
    return x


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def noise(d):
    return R.standard_normal(int(d * SR))


def sweep_noise(d, f0, f1, q=0.5):
    """bruit filtré dont la bande glisse de f0 à f1 (whoosh)"""
    n = noise(d)
    out = np.zeros_like(n)
    blocks = 24
    L = len(n) // blocks
    for i in range(blocks):
        f = f0 * (f1 / f0) ** (i / (blocks - 1))
        seg = bp(n, max(40, f * (1 - q)), min(SR / 2 - 100, f * (1 + q)))[i * L:(i + 1) * L]
        out[i * L:(i + 1) * L] = seg
    return out


def tone(d, f, decay=8.0):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-decay * t)


def norm(x, peak=1.0):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


# ---------------- Bibliothèque de bruitages ----------------
def s_whoosh():
    d = 0.55
    x = sweep_noise(d, 300, 3000) * np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 2
    return norm(x, 0.7)


def s_whoosh_long():
    d = 1.4
    x = sweep_noise(d, 180, 2200, 0.6) * np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 1.5
    return norm(x, 0.65)


def s_pop():
    d = 0.16
    t = t_(d)
    f = 900 * np.exp(-t * 30) + 300
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    return norm(x, 0.8)


def s_click():
    d = 0.05
    x = bp(noise(d), 2000, 6000) * np.exp(-t_(d) * 120)
    return norm(x, 0.8)


def s_tick():
    return norm(tone(0.06, 2400, 70) + 0.5 * tone(0.06, 4800, 90), 0.6)


def s_clock():
    # tic-tac accéléré pendant que les « dix minutes » défilent
    d = 1.4
    out = np.zeros(int(d * SR))
    t, k = 0.0, 0
    while t < d - 0.06:
        s = s_tick() * (0.8 if k % 2 else 0.55)
        i = int(t * SR)
        out[i:i + len(s)] += s[: len(out) - i]
        t += max(0.045, 0.22 * (1 - t / d))
        k += 1
    return norm(out, 0.7)


def s_sparkle():
    d = 0.9
    out = np.zeros(int(d * SR))
    for k in range(9):
        f = 2400 + R.random() * 3200
        s = tone(0.25, f, 18) * 0.5
        i = int(R.random() * 0.6 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return norm(out, 0.55)


def s_ice():
    d = 0.5
    x = hp(noise(d), 3500) * np.exp(-t_(d) * 9) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t_(d)))
    return norm(x + 0.3 * tone(d, 3100, 10), 0.55)


def s_start():
    # démarreur (tchk-tchk) puis le moteur prend
    d = 1.3
    t = t_(d)
    crank = np.sign(np.sin(2 * np.pi * 11 * t)) * lp(noise(d), 900) * (t < 0.55)
    f = np.where(t < 0.55, 0, 38 + 60 * np.exp(-(t - 0.55) * 4))
    eng = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t >= 0.55)
    eng = lp(np.tanh(3 * eng) + 0.3 * lp(noise(d), 400), 700)
    x = 0.5 * crank + eng * env(len(t), 0.01, 0.4)
    return norm(x, 0.8)


def s_idle():
    d = 1.6
    t = t_(d)
    x = np.tanh(2.5 * np.sin(2 * np.pi * 32 * t)) + 0.4 * lp(noise(d), 300)
    return norm(lp(x, 500) * env(len(t), 0.05, 0.6), 0.55)


def s_fire():
    d = 0.8
    x = lp(noise(d), 1200) * env(int(d * SR), 0.02, 0.5) + 0.4 * tone(d, 70, 4)
    return norm(x, 0.6)


def s_scratch():
    # effet « disque rayé »
    d = 0.42
    t = t_(d)
    f = 1800 * np.abs(np.sin(2 * np.pi * 4.5 * t)) + 200
    x = bp(noise(d), 300, 4000) * 0.5 + np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3
    return norm(x * env(len(t), 0.005, 0.15), 0.8)


def s_thud():
    d = 0.4
    t = t_(d)
    f = 120 * np.exp(-t * 12) + 45
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + 0.2 * lp(noise(d), 300) * np.exp(-t * 25)
    return norm(x, 0.95)


def s_boom():
    d = 0.35
    t = t_(d)
    x = lp(noise(d), 600) * np.exp(-t * 14) + 0.7 * np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 20)) * t) * np.exp(-t * 10)
    return norm(x, 0.85)


def s_pour():
    d = 0.9
    t = t_(d)
    x = bp(noise(d), 500, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * t)) * env(len(t), 0.05, 0.3)
    return norm(x, 0.45)


def s_drip():
    d = 0.18
    t = t_(d)
    f = 700 + 1400 * t / d
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26), 0.6)


def s_bloop():
    d = 0.4
    t = t_(d)
    f = 220 + 500 * np.exp(-t * 9)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7), 0.8)


def s_beep():
    d = 0.22
    t = t_(d)
    x = np.sin(2 * np.pi * 1760 * t) * ((t < 0.08) | (t > 0.12)) * env(len(t), 0.003, 0.03)
    return norm(x, 0.45)


def s_fall():
    d = 0.42
    t = t_(d)
    f = 1400 - 1100 * t / d
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + sweep_noise(d, 2500, 600) * 0.3, 0.45)


def s_clank():
    d = 0.6
    x = sum(tone(d, f, 7 + i) / (i + 1) for i, f in enumerate([523, 1307, 2290, 3410]))
    th = s_thud()
    x[: len(th)] += th * 0.7
    return norm(x, 0.85)


def s_sputter():
    d = 1.0
    out = np.zeros(int(d * SR))
    t = 0.0
    while t < d - 0.12:
        s = s_boom()[: int(0.12 * SR)] * (0.5 + 0.5 * R.random())
        i = int(t * SR)
        out[i:i + len(s)] += s
        t += 0.07 + R.random() * 0.18
    return norm(lp(out, 1500), 0.8)


def s_stall():
    d = 0.9
    t = t_(d)
    f = 34 * (1 - t / d) ** 1.5 + 2
    x = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * (1 - t / d)
    return norm(lp(x, 400), 0.7)


def s_ding():
    d = 1.0
    return norm(tone(d, 1318, 4) + 0.5 * tone(d, 1976, 5) + 0.25 * tone(d, 2637, 6), 0.55)


def s_buckle():
    d = 0.2
    x = np.zeros(int(d * SR))
    for k, off in enumerate([0.0, 0.035]):
        s = bp(noise(0.03), 1500 + k * 1500, 7000) * np.exp(-t_(0.03) * 150)
        i = int(off * SR)
        x[i:i + len(s)] += s
    return norm(x + 0.3 * tone(d, 3200, 40), 0.9)


def s_drive():
    d = 2.4
    t = t_(d)
    f = 45 + 35 * np.clip(t / 1.6, 0, 1)
    x = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) + 0.3 * lp(noise(d), 500)
    return norm(lp(x, 900) * env(len(t), 0.1, 0.8), 0.6)


def s_rise():
    d = 1.6
    t = t_(d)
    f = 300 + 500 * (t / d) ** 1.3
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.1, 0.3) * 0.5 + 0.2 * sweep_noise(d, 400, 2000)
    return norm(x, 0.45)


def s_brake():
    d = 0.8
    x = bp(noise(d), 2500, 5000) * env(int(d * SR), 0.05, 0.4) * 0.5
    return norm(x, 0.35)


def s_defrost():
    d = 1.0
    x = hp(noise(d), 1500) * env(int(d * SR), 0.2, 0.5) * 0.5 + 0.3 * sweep_noise(d, 3000, 800)
    return norm(x, 0.4)


def s_confetti():
    d = 0.6
    t = t_(d)
    pop_ = lp(noise(d), 3000) * np.exp(-t * 30)
    rattle = bp(noise(d), 3000, 9000) * np.exp(-t * 5) * 0.3
    return norm(pop_ + rattle + 0.4 * s_sparkle()[: len(t)], 0.9)


LIB = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}
GAINS_DB = {  # niveaux de mix par famille
    "whoosh": -12, "whoosh_long": -13, "pop": -11, "click": -13, "tick": -14, "clock": -14, "sparkle": -15, "ice": -15,
    "start": -12, "idle": -16, "fire": -14, "scratch": -9, "thud": -10, "boom": -12, "pour": -15, "drip": -13, "bloop": -12,
    "beep": -14, "fall": -14, "clank": -10, "sputter": -11, "stall": -12, "ding": -13, "buckle": -10, "drive": -14,
    "rise": -15, "brake": -17, "defrost": -16, "confetti": -10,
}


# ---------------- Musique de fond (lo-fi léger, 100 BPM) ----------------
def music(dur):
    bpm = 100
    beat = 60 / bpm
    n = int(dur * SR)
    out = np.zeros(n)
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = 4 * beat
    t = 0.0
    k = 0
    while t < dur:
        ch = chords[k % 4]
        L = int(bar * SR)
        tt = np.arange(L) / SR
        pad = sum(np.sin(2 * np.pi * mtof(m) * tt) * 0.12 + np.sin(2 * np.pi * mtof(m) * 2.003 * tt) * 0.03 for m in ch)
        pad *= env(L, 0.25, 0.6, 1.5)
        i = int(t * SR)
        seg = pad[: n - i]
        out[i:i + len(seg)] += seg
        # basse + arpège pluck
        for b in range(4):
            bi = int((t + b * beat) * SR)
            if bi >= n:
                break
            m = ch[0] - 12
            s = np.sin(2 * np.pi * mtof(m) * t_(beat * 0.9)) * np.exp(-t_(beat * 0.9) * 3) * 0.35
            out[bi:bi + len(s)] += s[: n - bi]
            for h, mm in enumerate([ch[(b + 1) % 4] + 12, ch[(b + 2) % 4] + 12]):
                pi_ = int((t + b * beat + h * beat / 2) * SR)
                if pi_ >= n:
                    continue
                p = np.sin(2 * np.pi * mtof(mm) * t_(0.3)) * np.exp(-t_(0.3) * 14) * 0.12
                out[pi_:pi_ + len(p)] += p[: n - pi_]
        # batterie légère : kick 1/3, hat croches
        for b in range(4):
            bi = int((t + b * beat) * SR)
            if bi >= n:
                break
            if b in (0, 2):
                kk = s_thud()[: int(0.25 * SR)] * 0.5
                out[bi:bi + len(kk)] += kk[: n - bi]
            for h in (0, 1):
                hi = int((t + b * beat + h * beat / 2) * SR)
                if hi < n:
                    hh = hp(noise(0.04), 7000) * np.exp(-t_(0.04) * 90) * (0.12 if h else 0.07)
                    out[hi:hi + len(hh)] += hh[: n - hi]
        t += bar
        k += 1
    return lp(out, 6000)


def read_wav(p):
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        assert w.getframerate() == SR
    return x


def compress(x, thr_db=-18, ratio=3.5, att=0.003, rel=0.08):
    thr = 10 ** (thr_db / 20)
    level = np.abs(x)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    envl = np.zeros_like(x)
    e = 0.0
    for i in range(0, len(x), 64):  # enveloppe par blocs (rapide)
        v = level[i:i + 64].max()
        e = a * e + (1 - a) * v if v > e else r * e + (1 - r) * v
        envl[i:i + 64] = e
    gain = np.where(envl > thr, (thr * (envl / thr) ** (1 / ratio)) / (envl + 1e-9), 1.0)
    return x * gain


def main():
    d = Path(sys.argv[1])
    voice = read_wav(d / "voice.wav")
    cues = json.loads((d / "sfx.json").read_text())
    dur = len(voice) / SR + 0.3
    n = int(dur * SR)

    # voix : passe-haut, présence, compression, -1 dB
    v = hp(voice, 90)
    v = v + 0.25 * bp(v, 2500, 6000)
    v = compress(v)
    v = norm(v, 0.9)
    vv = np.zeros(n)
    vv[: len(v)] = v

    fx_l, fx_r = np.zeros(n), np.zeros(n)
    cache = {}
    for c in cues:
        typ = c["type"]
        if typ not in LIB:
            raise SystemExit(f"bruitage inconnu : {typ}")
        s = cache.setdefault(typ, LIB[typ]())
        g = 10 ** (GAINS_DB[typ] / 20) * c.get("gain", 1)
        i = int(c["t"] * SR)
        if i >= n:
            continue
        seg = s[: n - i] * g
        pan = R.uniform(-0.3, 0.3)
        fx_l[i:i + len(seg)] += seg * (1 - pan)
        fx_r[i:i + len(seg)] += seg * (1 + pan)

    # musique avec ducking sous la voix
    m = music(dur)[:n]
    m = norm(m, 1.0) * 10 ** (-21 / 20)
    venv = lp(np.abs(vv), 4)
    duck = 1 - 0.55 * np.clip(venv / 0.05, 0, 1)
    m = m * duck
    m *= env(n, 0.3, 1.5, 1.5)

    L = vv + fx_l + m
    Rr = vv + fx_r + m
    st = np.stack([L, Rr], 1)
    st = st / (np.max(np.abs(st)) + 1e-9) * 10 ** (-1 / 20)
    with wave.open(str(d / "mix.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print(f"mix : {dur:.2f} s, {len(cues)} bruitages")


if __name__ == "__main__":
    main()
