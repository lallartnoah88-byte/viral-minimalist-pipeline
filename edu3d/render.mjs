// Rendu image par image : Chromium (WebGL) → JPEG → ffmpeg. Parallélisé en plusieurs navigateurs.
// Usage : node render.mjs <video_id> [--fps 30] [--workers 3] [--from s] [--to s] [--stills t1,t2,...]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const video = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('fps', 30), WORKERS = +opt('workers', 3);
const OUT = path.join(ROOT, 'build', video);
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/scene/index.html?video=${video}`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return page;
}
const launch = () => chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const stills = opt('stills', null);
if (stills) {
  const browser = await launch();
  const page = await openPage(browser);
  for (const s of stills.split(',')) {
    const t0 = Date.now();
    const url = await page.evaluate((t) => window.__edu3d.frame(t, 0.9), +s);
    fs.writeFileSync(path.join(OUT, `still_${(+s).toFixed(2)}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`still ${s}s (${Date.now() - t0} ms)`);
  }
  await browser.close(); server.close(); process.exit(0);
}

// --- rendu complet ---
const browser0 = await launch();
const page0 = await openPage(browser0);
const { duration, sfx } = await page0.evaluate(() => ({ duration: window.__edu3d.duration, sfx: window.__edu3d.sfx }));
fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(sfx, null, 1));
await browser0.close();
const from = +opt('from', 0), to = +opt('to', duration);
const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
const total = f1 - f0;
console.log(`${video} : ${total} images (${from}-${to}s) avec ${WORKERS} navigateurs`);
const per = Math.ceil(total / WORKERS);
const started = Date.now();
let done = 0;
async function worker(k) {
  const a = f0 + k * per, b = Math.min(f1, a + per);
  if (a >= b) return null;
  const file = path.join(OUT, `part_${k}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const browser = await launch();
  const page = await openPage(browser);
  for (let f = a; f < b; f++) {
    const url = await page.evaluate((t) => window.__edu3d.frame(t), f / FPS);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - started) / 1000;
      console.log(`  ${done}/${total} images — ${(el / done).toFixed(2)} s/img, reste ~${Math.round(el / done * (total - done) / 60)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  return file;
}
const parts = (await Promise.all(Array.from({ length: WORKERS }, (_, k) => worker(k)))).filter(Boolean);
fs.writeFileSync(path.join(OUT, 'parts.txt'), parts.map((p) => `file '${p}'`).join('\n'));
await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'parts.txt'), '-c', 'copy', path.join(OUT, 'video_noaudio.mp4')], { stdio: 'inherit' }).on('close', r));
console.log(`vidéo muette : ${path.join(OUT, 'video_noaudio.mp4')} en ${Math.round((Date.now() - started) / 60000)} min`);
server.close();
