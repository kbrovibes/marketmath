/**
 * Generates the app icon set from the inline SVG source.
 * Run: npx tsx scripts/generate-icons.ts
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

// Full-bleed dark mark with the sparkline kept inside the maskable safe
// zone (center circle, r = 0.4 * width), so one artwork serves both
// `any` and `maskable` purposes.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#131917"/>
      <stop offset="1" stop-color="#0a0d0c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.62" cy="0.38" r="0.55">
      <stop offset="0" stop-color="#00c805" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#00c805" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#00c805" stop-opacity="0.16"/>
      <stop offset="0.85" stop-color="#00c805" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  <path d="M128 340 L214 258 L272 300 L384 178 L384 396 L128 396 Z" fill="url(#area)"/>
  <path d="M128 340 L214 258 L272 300 L384 178" fill="none" stroke="#00c805"
        stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="384" cy="178" r="24" fill="#00c805"/>
  <circle cx="384" cy="178" r="11" fill="#c8ffd0"/>
</svg>`;

const source = Buffer.from(svg);

const targets: Array<[string, number]> = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["src/app/apple-icon.png", 180],
  ["src/app/icon.png", 512],
];

async function main() {
  for (const [rel, size] of targets) {
    const png = await sharp(source, { density: 300 })
      .resize(size, size)
      .png()
      .toBuffer();
    await writeFile(path.join(root, rel), png);
    console.log(`${rel} (${size}x${size}, ${png.length} bytes)`);
  }
}

main();
