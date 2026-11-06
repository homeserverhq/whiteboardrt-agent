#!/usr/bin/env node
// Shared-storage persistence checks. Run after `npm run build:server`:
//   node scripts/check-remote-state.mjs
//
// Starts a fake WhiteboardRT Storage Backend, runs the canvas server against it,
// commits elements/files, restarts, and verifies recovery.

import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(root, 'dist', 'server.js');
const stateKey = 'rooms/whiteboardrt-agent-canvas-state-v1';
const fileKey = 'files/whiteboardrt-agent-file-file1';

const store = new Map();
const storage = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const match = (req.url || '').match(/^\/api\/v2\/(rooms|files)\/([^/?]+)$/);
    if (!match) {
      res.writeHead(404);
      res.end();
      return;
    }
    const key = `${match[1]}/${decodeURIComponent(match[2])}`;
    if (req.method === 'PUT') {
      store.set(key, Buffer.concat(chunks));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: decodeURIComponent(match[2]) }));
      return;
    }
    if (req.method === 'GET') {
      const value = store.get(key);
      if (!value) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'application/octet-stream' });
      res.end(value);
      return;
    }
    res.writeHead(405);
    res.end();
  });
});

const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await listen(storage);
const storagePort = storage.address().port;
const storageUrl = `http://127.0.0.1:${storagePort}/api/v2`;

function startCanvas(port) {
  const child = spawn(process.execPath, [serverPath], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      LOG_LEVEL: 'error',
      WHITEBOARD_RT_AGENT_STORAGE_URL: storageUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  return { child, getOutput: () => output.trim() };
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHealth(port, getOutput) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return response.json();
    } catch { /* not up yet */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(
    `canvas server did not become healthy on port ${port}` +
    (getOutput ? `\n${getOutput()}` : '')
  );
}

async function stopCanvas(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

let canvas;
try {
  const firstPort = await getFreePort();
  canvas = startCanvas(firstPort);
  const health = await waitForHealth(firstPort, canvas.getOutput);
  assert.equal(health.durable_state_enabled, true);
  assert.equal(health.durable_state_backend, 'remote');

  const elementResponse = await fetch(`http://127.0.0.1:${firstPort}/api/elements`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'rectangle', x: 10, y: 20, width: 100, height: 50 }),
  });
  assert.equal(elementResponse.ok, true);
  const created = await elementResponse.json();
  assert.ok(created.element?.id);

  const fileResponse = await fetch(`http://127.0.0.1:${firstPort}/api/files`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([{
      id: 'file1',
      dataURL: 'data:image/png;base64,aGVsbG8=',
      mimeType: 'image/png',
      created: 123,
    }]),
  });
  assert.equal(fileResponse.ok, true);

  assert.ok(store.has(stateKey), 'state blob was not written');
  assert.ok(store.has(fileKey), 'file blob was not written');
  const state = JSON.parse(store.get(stateKey).toString('utf8'));
  assert.equal(state.elements.length, 1);
  assert.equal(state.files.length, 1);
  assert.equal(state.files[0].id, 'file1');
  assert.equal(state.files[0].blob, 'whiteboardrt-agent-file-file1');

  await stopCanvas(canvas.child);
  canvas = null;

  const secondPort = await getFreePort();
  canvas = startCanvas(secondPort);
  await waitForHealth(secondPort, canvas.getOutput);

  const elementsResponse = await fetch(`http://127.0.0.1:${secondPort}/api/elements`);
  const elementsBody = await elementsResponse.json();
  assert.equal(elementsBody.elements.length, 1);
  assert.equal(elementsBody.elements[0].id, created.element.id);

  const filesResponse = await fetch(`http://127.0.0.1:${secondPort}/api/files`);
  const filesBody = await filesResponse.json();
  assert.equal(Object.keys(filesBody.files).length, 1);
  assert.equal(filesBody.files.file1?.id, 'file1');

  process.stdout.write('remote persistence checks passed\n');
} finally {
  if (canvas) await stopCanvas(canvas.child);
  storage.close();
}
