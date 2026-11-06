#!/usr/bin/env node
// Guard the WhiteboardRT Agent surface against stale product names and
// Excalidraw-owned endpoints. The embedded @excalidraw/excalidraw bundle and
// .excalidraw file-format references are intentionally out of scope.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'README.md',
  'MCP.md',
  'Dockerfile',
  'Dockerfile.canvas',
  'docker-compose.yml',
  'package.json',
  'frontend/index.html',
  'scripts/sync-skills.mjs',
];

for (const directory of ['frontend/src', 'src', 'skills/whiteboardrt-agent-skill']) {
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(css|json|md|ts|tsx)$/.test(entry.name)) {
        files.push(path.relative(root, full));
      }
    }
  };
  walk(path.join(root, directory));
}

const forbidden = [
  /WhiteboardAI/,
  /whiteboardai/,
  /WHITEBOARDAI/,
  /mcp-excalidraw-server/,
  /excalidraw-canvas/,
  /mcp-excalidraw-canvas/,
  /export_to_excalidraw_url/,
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
