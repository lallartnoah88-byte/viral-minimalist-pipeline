#!/usr/bin/env python3
"""
generate_sfx.py
Synthèse mathématique des 30 effets sonores WAV (48 kHz, 16-bit PCM, mono).

Chaque fichier est normalisé à -3 dBFS crête. Les sons ponctuels reçoivent un fondu
d'entrée/sortie anti-clic ; les drones sont construits pour boucler parfaitement
(fréquences à nombre entier de cycles sur 10 s + filtrage circulaire FFT), donc sans fondu.

Dépendances : numpy, scipy.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48_000
PEAK = 10 ** (-3 / 20)  # -3 dBFS
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "DIST_PACK_TO_SELL" / "ULTIMATE_MINIMALIST_ANIMATION_PACK" / "03_Sound_Design_SFX_WAV"


# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------
def t_axis(duration: float) -> np.ndarray:
    return np.arange(int(round(duration * SR))) / SR


def fades(x: np.ndarray, fade_in: float = 0.004, fade_out: float = 0.012) -> np.ndarray:
    x = x.copy()
    ni, no = max(1, int(fade_in * SR)), max(1, int(fade_out * SR))
    x[:ni] *= np.sin(np.linspace(0, np.pi / 2, ni)) ** 2
    x[-no:] *= np.cos(np.linspace(0, np.pi / 2, no)) ** 2
    return x


def normalize(x: np.ndarray) -> np.ndarray:
    x = x - np.mean(x)
    peak = np.max(np.abs(x))
    if peak <= 0:
        raise ValueError("Signal silencieux")
    return x / peak * PEAK


def write(path: Path, x: np.ndarray, apply_fades: bool = True, fade_in: float = 0.004) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if apply_fades:
        x = fades(x, fade_in=fade_in)
    x = normalize(x)
    if apply_fades:
        x = fades(x, fade_in=fade_in)  # garantit des bords à zéro après recentrage DC
        x = x / np.max(np.abs(x)) * PEAK
    pcm = np.clip(np.round(x * 32767), -32768, 32767).astype(np.int16)
    wavfile.write(path, SR, pcm)
    print(f"[WAV] {path.relative_to(OUT)}  {len(pcm) / SR:.2f}s")


def exp_glide(f0: float, f1: float, t: np.ndarray, duration: float) -> np.ndarray:
    return f0 * (f1 / f0) ** (t / duration)


def phase_from_freq(freq: np.ndarray) -> np.ndarray:
    return 2 * np.pi * np.cumsum(freq) / SR


def pink_noise(n: int, rng: np.random.Generator) -> np.ndarray:
    # Filtre de Paul Kellet (approximation 1/f)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1.0, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, rng.standard_normal(n))


def brown_noise(n: int, rng: np.random.Generator) -> np.ndarray:
    w = rng.standard_normal(n)
    return signal.lfilter([1.0], [1.0, -0.995], w)


def svf_bandpass(x: np.ndarray, fc: np.ndarray, q: float) -> np.ndarray:
    """Filtre à variables d'état (TPT, Zavalishin) passe-bande à fréquence variable."""
    y = np.zeros_like(x)
    ic1 = ic2 = 0.0
    k = 1.0 / q
    g_all = np.tan(np.pi * np.clip(fc, 20, SR * 0.45) / SR)
    for i in range(len(x)):
        g = g_all[i]
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        y[i] = v1 * k  # sortie passe-bande à gain unitaire au centre
    return y


def onepole_lowpass(x: np.ndarray, fc: np.ndarray) -> np.ndarray:
    """Passe-bas 1 pôle à coupure variable."""
    y = np.zeros_like(x)
    z = 0.0
    a_all = 1.0 - np.exp(-2 * np.pi * np.clip(fc, 10, SR * 0.45) / SR)
    for i in range(len(x)):
        z += a_all[i] * (x[i] - z)
        y[i] = z
    return y


def bell(t: np.ndarray, duration: float, peak_pos: float, sharp: float = 2.0) -> np.ndarray:
    """Courbe d'amplitude en cloche asymétrique (profil Speed Graph)."""
    x = np.clip(t / duration, 0, 1)
    a = peak_pos * sharp * 2
    b = (1 - peak_pos) * sharp * 2
    env = x ** a * (1 - x) ** b
    return env / env.max()


# ---------------------------------------------------------------------------
# 1. Sub Bass Drops (6)
# ---------------------------------------------------------------------------
SUB_DROPS = [
    ("01_Sub_Drop_Abyss_95-26Hz.wav", 95, 26, 2.0, 0.55),
    ("02_Sub_Drop_Gravity_80-22Hz.wav", 80, 22, 2.5, 0.70),
    ("03_Sub_Drop_Impact_110-30Hz.wav", 110, 30, 1.5, 0.40),
    ("04_Sub_Drop_Deep_Space_70-24Hz.wav", 70, 24, 2.2, 0.65),
    ("05_Sub_Drop_Punch_120-35Hz.wav", 120, 35, 1.8, 0.45),
    ("06_Sub_Drop_Monolith_88-28Hz.wav", 88, 28, 2.4, 0.75),
]


def sub_drop(f0: float, f1: float, dur: float, tau: float, seed: int) -> np.ndarray:
    t = t_axis(dur)
    freq = exp_glide(f0, f1, t, dur)
    s = np.sin(phase_from_freq(freq))
    s += 0.18 * np.sin(2 * phase_from_freq(freq))  # 2e harmonique pour l'audibilité sur mobile
    s = np.tanh(2.0 * s) / np.tanh(2.0)  # saturation harmonique douce
    attack = np.clip(t / 0.015, 0, 1)
    env = attack * np.exp(-t / tau)
    # Transitoire d'attaque très court (clic de "frappe")
    rng = np.random.default_rng(seed)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.004) * 0.25
    click = signal.lfilter(*signal.butter(2, 900 / (SR / 2), "low"), click)
    return s * env + click


# ---------------------------------------------------------------------------
# 2. Dark Whooshes (8)
# ---------------------------------------------------------------------------
WHOOSHES = [
    ("01_Whoosh_Shadow_Pass_0.6s.wav", 0.6, "brown", 120, 900, 100, 0.55, 2.2),
    ("02_Whoosh_Quick_Cut_0.4s.wav", 0.4, "pink", 140, 1100, 120, 0.45, 2.6),
    ("03_Whoosh_Heavy_Swing_1.0s.wav", 1.0, "brown", 100, 750, 90, 0.60, 2.0),
    ("04_Whoosh_Camera_Push_0.8s.wav", 0.8, "pink", 120, 900, 100, 0.65, 2.4),
    ("05_Whoosh_Reverse_Suck_0.9s.wav", 0.9, "brown", 110, 950, 140, 0.85, 3.0),
    ("06_Whoosh_Air_Slice_0.5s.wav", 0.5, "pink", 180, 1400, 150, 0.40, 2.8),
    ("07_Whoosh_Deep_Transition_1.2s.wav", 1.2, "brown", 90, 700, 80, 0.55, 1.8),
    ("08_Whoosh_Match_Cut_0.7s.wav", 0.7, "pink", 130, 900, 110, 0.50, 2.2),
]


def whoosh(dur, kind, f_start, f_peak, f_end, peak_pos, sharp, seed) -> np.ndarray:
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    n = len(t)
    noise = brown_noise(n, rng) if kind == "brown" else pink_noise(n, rng)
    noise /= np.max(np.abs(noise))
    x = t / dur
    # Balayage log : start -> peak (jusqu'à peak_pos) -> end
    fc = np.where(
        x < peak_pos,
        f_start * (f_peak / f_start) ** (x / peak_pos),
        f_peak * (f_end / f_peak) ** ((x - peak_pos) / (1 - peak_pos)),
    )
    y = svf_bandpass(noise, fc, q=1.4)
    y += 0.35 * svf_bandpass(noise, fc * 2.1, q=2.5)
    return y * bell(t, dur, peak_pos, sharp)


# ---------------------------------------------------------------------------
# 3. Typewriter & Clicks (6)
# ---------------------------------------------------------------------------
CLICKS = [
    ("01_Click_Mechanical_Switch.wav", 0.08, 1.0, 1.0, 0.0, 14),
    ("02_Click_Typewriter_Key.wav", 0.12, 0.9, 0.7, 0.6, 10),
    ("03_Click_Digital_UI_Tick.wav", 0.06, 0.4, 1.4, 0.0, 22),
    ("04_Click_Heavy_Keystroke.wav", 0.15, 1.0, 0.6, 1.0, 8),
    ("05_Click_Soft_Tap.wav", 0.07, 0.8, 0.5, 0.2, 12),
    ("06_Click_Typewriter_Return_Bell.wav", 0.14, 0.7, 1.2, 0.3, 18),
]


def click(dur, g2400, g5800, body, q, seed) -> np.ndarray:
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    n = len(t)
    impulse = np.zeros(n)
    m = int(0.003 * SR)  # transitoire de 3 ms
    impulse[:m] = rng.standard_normal(m) * np.exp(-np.arange(m) / (m / 4))
    b1, a1 = signal.iirpeak(2400, q, SR)
    b2, a2 = signal.iirpeak(5800, q * 1.2, SR)
    y = g2400 * signal.lfilter(b1, a1, impulse) + g5800 * signal.lfilter(b2, a2, impulse)
    if body > 0:
        # "corps" grave du mécanisme de machine à écrire
        b3, a3 = signal.iirpeak(320, 6, SR)
        y += body * 0.6 * signal.lfilter(b3, a3, impulse)
    return y * np.exp(-t / (dur / 4))


def return_bell(dur: float) -> np.ndarray:
    t = t_axis(dur)
    tone = np.sin(2 * np.pi * 2637 * t) + 0.5 * np.sin(2 * np.pi * 3951 * t)
    return 0.35 * tone * np.exp(-t / 0.05)


# ---------------------------------------------------------------------------
# 4. Cinematic Risers (5)
# ---------------------------------------------------------------------------
RISERS = [
    ("01_Riser_Tension_Build_3.0s.wav", 3.0, 80, 880, 0.006),
    ("02_Riser_Short_Snap_2.5s.wav", 2.5, 110, 1200, 0.008),
    ("03_Riser_Long_Suspense_4.0s.wav", 4.0, 55, 660, 0.005),
    ("04_Riser_Dark_Ascend_3.5s.wav", 3.5, 65, 520, 0.010),
    ("05_Riser_Reveal_Hit_3.2s.wav", 3.2, 90, 1000, 0.007),
]


def riser(dur, f0, f1, detune, seed) -> np.ndarray:
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    base = exp_glide(f0, f1, t, dur)
    osc = np.zeros_like(t)
    for d in (-detune, 0.0, detune):
        ph = phase_from_freq(base * (1 + d))
        # Onde riche : fondamentale + harmoniques impaires/paires décroissantes
        osc += np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph)
    osc /= 3
    noise = rng.standard_normal(len(t))
    cutoff = 200 * (12000 / 200) ** ((t / dur) ** 1.6)  # le filtre s'ouvre progressivement
    noise = onepole_lowpass(onepole_lowpass(noise, cutoff), cutoff)
    noise /= np.max(np.abs(noise))
    env = (t / dur) ** 2.2
    y = (0.75 * osc + 0.55 * noise) * env
    # Coupure nette finale (4 ms) : le silence brutal crée l'impact
    cut = int(0.004 * SR)
    y[-cut:] *= np.linspace(1, 0, cut)
    return y


# ---------------------------------------------------------------------------
# 5. Ambient Drones (5) — 10 s bouclables
# ---------------------------------------------------------------------------
DRONES = [
    ("01_Drone_D_Minor_Abyss_Loop_10s.wav", [36.7, 55.0, 73.4, 87.3]),
    ("02_Drone_A_Minor_Void_Loop_10s.wav", [55.0, 82.4, 110.0, 130.8]),
    ("03_Drone_E_Minor_Stoic_Loop_10s.wav", [41.2, 61.7, 82.4, 98.0]),
    ("04_Drone_C_Minor_Monolith_Loop_10s.wav", [32.7, 49.0, 65.4, 77.8]),
    ("05_Drone_G_Minor_Night_Loop_10s.wav", [49.0, 73.4, 98.0, 116.5]),
]


def circular_lowpass(x: np.ndarray, fc: float) -> np.ndarray:
    """Passe-bas doux appliqué dans le domaine fréquentiel (circulaire = boucle parfaite)."""
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    resp = 1.0 / np.sqrt(1.0 + (f / fc) ** 4)  # pente ~12 dB/oct, type Butterworth ordre 2
    return np.fft.irfft(spec * resp, n=len(x))


def drone(freqs, seed) -> np.ndarray:
    dur = 10.0
    rng = np.random.default_rng(seed)
    t = t_axis(dur)
    y = np.zeros_like(t)
    for i, f in enumerate(freqs):
        # f et f ± 0.1 Hz : nombre entier de cycles sur 10 s -> boucle sans couture
        voice = np.zeros_like(t)
        for det, g in ((0.0, 1.0), (0.1, 0.5), (-0.1, 0.5)):
            ph0 = rng.uniform(0, 2 * np.pi)
            voice += g * (np.sin(2 * np.pi * (f + det) * t + ph0) + 0.3 * np.sin(2 * np.pi * 2 * (f + det) * t + ph0))
        # LFO 0.2 Hz (2 cycles exacts sur 10 s), déphasé par voix
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * 0.2 * t + i * np.pi / 2)
        y += voice * lfo / (1 + i * 0.25)
    lfo_global = 0.7 + 0.3 * np.sin(2 * np.pi * 0.2 * t)
    air = circular_lowpass(rng.standard_normal(len(t)), 400) * 0.6
    y = (y / np.max(np.abs(y)) + air / np.max(np.abs(air)) * 0.08) * lfo_global
    return circular_lowpass(y, 650)


# ---------------------------------------------------------------------------
def main() -> None:
    folders = {
        "sub": OUT / "01_Sub_Bass_Drops",
        "whoosh": OUT / "02_Dark_Whooshes",
        "click": OUT / "03_Typewriter_&_Clicks",
        "riser": OUT / "04_Cinematic_Risers",
        "drone": OUT / "05_Ambient_Drones",
    }
    count = 0
    for i, (name, f0, f1, dur, tau) in enumerate(SUB_DROPS):
        write(folders["sub"] / name, sub_drop(f0, f1, dur, tau, 100 + i)); count += 1
    for i, (name, dur, kind, fs, fp, fe, pp, sh) in enumerate(WHOOSHES):
        write(folders["whoosh"] / name, whoosh(dur, kind, fs, fp, fe, pp, sh, 200 + i)); count += 1
    for i, (name, dur, g1, g2, body, q) in enumerate(CLICKS):
        y = click(dur, g1, g2, body, q, 300 + i)
        if "Bell" in name:
            y = y + return_bell(dur) * np.max(np.abs(y)) * 3
        write(folders["click"] / name, y, apply_fades=True, fade_in=0.0003); count += 1
    for i, (name, dur, f0, f1, det) in enumerate(RISERS):
        write(folders["riser"] / name, riser(dur, f0, f1, det, 400 + i)); count += 1
    for i, (name, freqs) in enumerate(DRONES):
        write(folders["drone"] / name, drone(freqs, 500 + i), apply_fades=False); count += 1
    if count != 30:
        raise SystemExit(f"{count} fichiers au lieu de 30")
    print(f"[WAV] {count} effets sonores générés (48 kHz / 16-bit / -3 dBFS)")


if __name__ == "__main__":
    main()
