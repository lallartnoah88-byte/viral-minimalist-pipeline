"""tools/new_project.py — create a project folder for one video.

  python tools/new_project.py --name my-video --voice "C:/path/voiceover.mp3" [--script path] \
      [--aspect 9:16] [--resolution 1080p] [--style dusk] [--fps 30] [--no-captions] [--any-length]

Defaults are the TikTok format: 9:16, 1080x1920, 30 fps, burned-in captions, voiceover 61-90 s.
"""
import argparse, os, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import probe_duration, save_json

ap = argparse.ArgumentParser()
ap.add_argument("--name", required=True)
ap.add_argument("--voice", required=True)
ap.add_argument("--script")
ap.add_argument("--aspect", default="9:16", choices=["16:9", "9:16"])
ap.add_argument("--resolution", default="1080p", choices=["720p", "1080p", "1440p", "2160p", "4k"])
ap.add_argument("--style", default="dusk")
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--title", default="")
ap.add_argument("--captions", dest="captions", action="store_true", default=True, help="burn word-by-word captions (default)")
ap.add_argument("--no-captions", dest="captions", action="store_false")
ap.add_argument("--any-length", action="store_true", help="skip the TikTok 61-90 s duration check")
a = ap.parse_args()

root = os.path.join("projects", a.name)
for d in ["input", "timeline", "story", "scenes/sets", "scenes/shots", "build", "out", "audio"]:
    os.makedirs(os.path.join(root, d), exist_ok=True)
voice_dst = os.path.join("input", "voiceover" + os.path.splitext(a.voice)[1].lower())
shutil.copy2(a.voice, os.path.join(root, voice_dst))
script_dst = None
if a.script:
    script_dst = os.path.join("input", "script" + os.path.splitext(a.script)[1].lower())
    shutil.copy2(a.script, os.path.join(root, script_dst))
dur = probe_duration(os.path.join(root, voice_dst))
TIKTOK_MIN, TIKTOK_MAX = 61.0, 90.0
if not a.any_length and not (TIKTOK_MIN - 1.5 <= dur <= TIKTOK_MAX - 1.5):
    sys.exit(f"voiceover is {dur:.1f}s: the TikTok target is {TIKTOK_MIN:.0f}-{TIKTOK_MAX:.0f}s of video "
             f"(voiceover {TIKTOK_MIN - 1.5:.1f}-{TIKTOK_MAX - 1.5:.1f}s plus the 1.5s tail). "
             "Trim or extend the narration, or pass --any-length.")
cfg = {"title": a.title or a.name, "aspect": a.aspect, "resolution": a.resolution, "fps": a.fps, "style": a.style,
       "voiceover": voice_dst.replace("\\", "/"), "script": script_dst.replace("\\", "/") if script_dst else None,
       "duration": round(dur, 3), "captions": bool(a.captions), "bars": None, "fadeIn": 0.5, "fadeOut": 0.8,
       "music": {"enabled": True, "gainDb": -17}, "sfx": {"enabled": True, "gainDb": -6}, "loudness": -14}
save_json(os.path.join(root, "config.json"), cfg)
print(f"created {root}  (voiceover {dur:.1f}s, {a.aspect} {a.resolution} @ {a.fps}fps, style {a.style})")
