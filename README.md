# viral-minimalist-pipeline

A procedural pipeline that generates a complete "dark minimalist" motion-design toolkit and renders vertical videos with [Remotion](https://www.remotion.dev/). Every asset is produced from code: nothing is hand-drawn or hand-recorded.

```bash
./build_all.sh                 # generate, validate, zip, type-check Remotion, render a preview still
RENDER_ALL=1 ./build_all.sh    # also render the videos to MP4
SKIP_REMOTION=1 ./build_all.sh # assets only
```

Requirements: Node.js ≥ 18, Python ≥ 3.10, `zip`. The script creates a local `.venv` (numpy, scipy, Pillow). If Playwright and Chromium are installed, the guide is also exported to PDF.

Outputs go to `DIST_PACK_TO_SELL/` and `remotion-studio/out/`. Both are git-ignored.

## What gets generated

| Output | Generator | Technique |
|---|---|---|
| 100 SVG line icons (5 themes × 20) | `generators/generate_svgs.js` | Parametric geometry in plain Node.js. Strokes are centred on (120, 120), ready for Trim Paths or `stroke-dashoffset`. The generator rejects duplicate icons and `NaN` coordinates |
| 5 grid and texture PNGs (1080×1920, RGBA) + a 1080×1080 cover | `generators/generate_grids.py` | numpy + Pillow, radial vignette masks, double Gaussian blur glow |
| 30 WAV sound effects (48 kHz, 16-bit, −3 dBFS) | `generators/generate_sfx.py` | numpy/scipy synthesis: exponential sub-bass glides, time-varying state-variable band-pass whooshes, resonator clicks, detuned risers, and drones that loop sample-accurately (whole-cycle frequencies + FFT-domain circular filtering) |
| After Effects ScriptUI panel | `generators/plugin/Minimalist_Viral_Setup.jsx` | ECMAScript 3 only. Effects are addressed by `matchName`, so the panel works in any After Effects language. Validated by `generators/validate_jsx.js` (acorn, `ecmaVersion: 3`) |
| HTML + PDF guide | `generators/generate_docs.js` | Self-contained HTML. The speed-graph diagrams are computed from the bezier curve itself |
| Vertical videos (1080×1920, 30 fps) | `remotion-studio/` | React + TypeScript |

## Remotion components

| Component | Role |
|---|---|
| `MinimalCanvas` | `#070707` background, 90 px grid with a radial mask, animated `feTurbulence` grain, line boil, 15 fps time posterization |
| `GlowingSvgPath` | Path reveal through `stroke-dashoffset` with `Easing.bezier(0.75, 0, 0.15, 1)` and a double drop-shadow glow |
| `TypewriterText` | Letter-by-letter text in JetBrains Mono with a blinking cursor |
| `CameraRig` | Pan, zoom, rotation and shake, all eased on the same curve |
| `SfxTrack` | Places each sound cue at its storyboard frame and loops a drone underneath |

```bash
cd remotion-studio
npm install
npm run studio      # interactive editor
npm run typecheck   # tsc --noEmit
npm run render-all  # render every composition to out/
```

Compositions: `Video1-MentalNoise`, `Video2-MotivationIllusion`, `Video3-PriceOfDifference` (22 s each) and `Video4-PaycheckTrap` (61 s).

## Design decisions

- **One source of truth for timing.** `generators/storyboards.json` holds every scene, caption and sound cue. The guide and `SfxTrack` both read it, so sound and picture cannot drift apart. The build fails if a storyboard references a sound file that does not exist.
- **One easing curve.** `cubic-bezier(0.75, 0, 0.15, 1)` (75 % / 85 % influence in After Effects terms) drives path reveals, pop-ins and camera moves.
- **Verified output.** `build_all.sh` counts every file, rejects empty ones, checks WAV sample rate and bit depth and PNG size and alpha, then tests the ZIP's integrity.

## License

[MIT](LICENSE). The bundled font `remotion-studio/public/fonts/JetBrainsMono-Bold.ttf` is JetBrains Mono under the Apache License 2.0 (see `JetBrainsMono-LICENSE.txt` next to it).
