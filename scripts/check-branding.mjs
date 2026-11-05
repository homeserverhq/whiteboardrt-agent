#!/usr/bin/env node
// Guard the WhiteboardAI canvas surface against Excalidraw-owned endpoints and
// product names. The embedded @excalidraw/excalidraw bundle is intentionally
// out of scope here; runtime network checks cover it separately.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'README.md',
  'Dockerfile.canvas',
  'docker-compose.yml',
  'frontend/index.html',
  'src/server.ts',
  'src/core/brand.ts',
  'src/core/config.ts',
  'src/core/scene-io.ts',
  'src/core/share-url.ts',
];

const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(css|ts|tsx)$/.test(entry.name)) {
      files.push(path.relative(root, full));
    }
  }
};

walk(path.join(root, 'frontend/src'));

const forbidden = [
  /plus\.excalidraw/i,
  /app\.excalidraw/i,
  /docs\.excalidraw/i,
  /json\.excalidraw/i,
  /esm\.sh/i,
  /digitaloceanspaces/i,
  /Excalidraw\+/,
  /Excalidraw AI/,
  /Excalidraw links/,
];

const allowedFiles = new Set([
  // This file intentionally matches the label in order to hide it in the editor.
  'frontend/src/utils/branding.ts',
]);

let failed = false;
for (const file of [...new Set(files)]) {
  const full = path.join(root, file);
  if (!fs.existsSync(full) || allowedFiles.has(file)) continue;
  const contents = fs.readFileSync(full, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(contents)) {
      process.stderr.write(`${file}: matched ${pattern}\n`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

process.stdout.write('branding checks passed\n');
