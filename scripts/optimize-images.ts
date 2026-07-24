/**
 * Generate WebP/AVIF variants for LCP hero and oversized marketing images.
 * Requires system Python with Pillow.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()

const jobs = [
  { src: 'public/image/hero-langkawi-adventure-768.jpg', max_width: 768, quality: 72 },
  { src: 'public/image/hero-langkawi-adventure-1280.jpg', max_width: 1280, quality: 72 },
  { src: 'public/image/Sunset Cruise.png', max_width: 1280, quality: 70 },
  { src: 'public/image/Langkawi Car Rental - Pick This Car.JPG', max_width: 1280, quality: 70 },
  { src: 'public/image/Langkawi Car Rental - Pick This Car.png', max_width: 1280, quality: 70 },
  { src: 'public/image/Attractions/Eagle Square.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Kilim Geoforest Park.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Pulau Payar Marine Park.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Sky bridge.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Skycab.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Tanjung Rhu.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Telaga Tujuh Waterfall.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Underwater World.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/Wildlife Park.png', max_width: 960, quality: 70 },
  { src: 'public/image/Attractions/pantai cenang.png', max_width: 960, quality: 70 },
] as const

const py = `
import os, sys, json
from PIL import Image

def save_variants(src, max_width=None, quality=75):
    im = Image.open(src).convert("RGB")
    if max_width and im.width > max_width:
        ratio = max_width / im.width
        im = im.resize((max_width, max(1, int(im.height * ratio))), Image.Resampling.LANCZOS)
    base, _ = os.path.splitext(src)
    for fmt, ext, q in (("WEBP", ".webp", quality), ("AVIF", ".avif", max(quality - 25, 40))):
        out = base + ext
        try:
            kwargs = {"quality": q}
            if fmt == "WEBP":
                kwargs["method"] = 6
            im.save(out, fmt, **kwargs)
            print(f"wrote {out} ({os.path.getsize(out)} bytes)")
        except Exception as e:
            print(f"skip {fmt} for {src}: {e}", file=sys.stderr)

for job in json.loads(${JSON.stringify(JSON.stringify(jobs))}):
    src = job["src"]
    if not os.path.exists(src):
        print(f"missing {src}", file=sys.stderr)
        continue
    # AVIF often needs lower quality numbers than WebP for similar visual size
    save_variants(src, job.get("max_width"), job.get("quality", 75))
`

const scriptPath = join(root, 'scripts', '.optimize-images-tmp.py')
mkdirSync(dirname(scriptPath), { recursive: true })
writeFileSync(scriptPath, py)

try {
  execFileSync('python3', [scriptPath], { stdio: 'inherit', cwd: root })
} finally {
  try {
    unlinkSync(scriptPath)
  } catch {
    /* ignore */
  }
}
