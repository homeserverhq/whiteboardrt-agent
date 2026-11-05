#!/usr/bin/env node
// Build the TTF fonts used by the headless renderer (assets/fonts/*.ttf).
//
// Why TTF: resvg (our SVG -> PNG rasterizer) loads TTF/OTF through
// `font.fontFiles` and silently ignores WOFF2, and it does not read
// `@font-face` from the SVG either. Excalidraw ships its fonts as WOFF2 only,
// so we decompress them once here and commit the result — this script is a
// dev-time tool, not part of `npm run build`.
//
// Sources:
//   Virgil, Cascadia Code, Liberation Sans — single-file WOFF2s shipped inside
//     @excalidraw/excalidraw (dist/prod/fonts).
//   Excalifont — the package only ships unicode-range subsets, so the full
//     file must be supplied via --excalifont <path>, or an existing
//     assets/fonts/Excalifont-Regular.ttf is kept.
// All four are SIL OFL 1.1; see assets/fonts/LICENSES.md.
//
// Usage: node scripts/build-fonts.mjs [--excalifont /path/to/Excalifont-Regular.woff2]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const wawoff2 = require('wawoff2');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgFonts = path.join(root, 'node_modules/@excalidraw/excalidraw/dist/prod/fonts');
const outDir = path.join(root, 'assets/fonts');

const args = process.argv.slice(2);
const flagIdx = args.indexOf('--excalifont');
const excalifontOverride = flagIdx !== -1 ? args[flagIdx + 1] : undefined;

async function excalifontSource() {
  if (excalifontOverride) return fs.readFileSync(path.resolve(excalifontOverride));
  const cached = path.join(os.tmpdir(), 'Excalifont-Regular.woff2');
  if (fs.existsSync(cached)) return fs.readFileSync(cached);
  if (fs.existsSync(path.join(outDir, 'Excalifont-Regular.ttf'))) return null;
  throw new Error(
    'Excalifont-Regular.ttf is missing. Pass --excalifont <path/to/Excalifont-Regular.woff2>.'
  );
}

const sources = [
  { out: 'Excalifont-Regular.ttf', read: excalifontSource },
  { out: 'Virgil-Regular.ttf', read: () => fs.readFileSync(path.join(pkgFonts, 'Virgil/Virgil-Regular.woff2')) },
  { out: 'CascadiaCode-Regular.ttf', read: () => fs.readFileSync(path.join(pkgFonts, 'Cascadia/CascadiaCode-Regular.woff2')) },
  { out: 'LiberationSans-Regular.ttf', read: () => fs.readFileSync(path.join(pkgFonts, 'Liberation/LiberationSans-Regular.woff2')) }
];

fs.mkdirSync(outDir, { recursive: true });
for (const { out, read } of sources) {
  const woff2 = await read();
  if (!woff2) {
    process.stderr.write(`${out}: keeping existing file\n`);
    continue;
  }
  if (woff2.subarray(0, 4).toString('latin1') !== 'wOF2') {
    throw new Error(`${out}: source is not a WOFF2 file`);
  }
  const ttf = Buffer.from(await wawoff2.decompress(woff2));
  fs.writeFileSync(path.join(outDir, out), ttf);
  process.stderr.write(`${out}: ${woff2.length} -> ${ttf.length} bytes\n`);
}
process.stderr.write(`Fonts written to ${outDir}\n`);
