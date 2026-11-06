# WhiteboardRT Agent Canvas

WhiteboardRT Agent Canvas is a modified fork of [mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw), packaged as a self-hosted live canvas for AI agents. Agents can draw, inspect, refine, export, and restore diagrams through the REST API, WebSocket sync, or headless renderer.

This repository preserves the upstream git history for provenance. WhiteboardRT Agent Canvas is **not affiliated with or endorsed by Excalidraw**.

## Changes from upstream

- Debranded the canvas UI and canvas container as **WhiteboardRT Agent**.
- Replaced the default Excalidraw menu with a minimal WhiteboardRT Agent menu and an About dialog.
- Hid the Excalidraw welcome screen, help dialog, command palette, social links, and Excalifont entry in the font picker.
- Uses Virgil as the default font. Excalifont remains bundled and registered for compatibility with existing scenes.
- Loads editor fonts from the canvas server's own `/assets/fonts` route instead of a CDN.
- Removed Excalidraw-owned share defaults. Sharing stays disabled unless explicitly configured.
- Exported scene metadata now identifies WhiteboardRT Agent as the source.
- Replaced runtime environment variables with the `WHITEBOARD_RT_AGENT_*` prefix.

The MCP server, CLI, and agent skill are documented separately in [MCP.md](./MCP.md). They are packaged as `whiteboardrt-agent-server`.

## Quick start

### Docker

```bash
docker build -f Dockerfile.canvas -t whiteboardrt-agent-canvas:latest .
```

```bash
docker run -d -p 3000:3000 \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e WHITEBOARD_RT_AGENT_PUBLIC_URL=http://localhost:3000 \
  whiteboardrt-agent-canvas:latest
```

Open `http://localhost:3000`.

### From source

```bash
npm ci
npm run build
npm run canvas
```

## Runtime environment

The canvas server reads process environment variables at runtime. No rebuild is required to change them.

| Variable | Fallback | Purpose |
|---|---|---|
| `PORT` | `3000` | Canvas server port |
| `HOST` | `0.0.0.0` | Canvas server bind address |
| `EXPRESS_SERVER_URL` | `http://127.0.0.1:3000` | Internal canvas API URL |
| `WHITEBOARD_RT_AGENT_PUBLIC_URL` | `EXPRESS_SERVER_URL` | Human-facing canvas URL |
| `WHITEBOARD_RT_AGENT_NO_AUTOSTART` | unset | Disable canvas auto-start |
| `WHITEBOARD_RT_AGENT_EXPORT_DIR` | current working dir | Export sandbox |
| `WHITEBOARD_RT_AGENT_DATA_DIR` | unset | Local durable canvas state directory |
| `WHITEBOARD_RT_AGENT_STORAGE_URL` | unset | Shared storage backend URL |
| `WHITEBOARD_RT_AGENT_PERSISTENCE` | unset | Set `remote` to enable shared-backend persistence (requires `WHITEBOARD_RT_AGENT_STORAGE_URL`) |
| `WHITEBOARD_RT_AGENT_STORAGE_STATE_KEY` | `whiteboardrt-agent-canvas-state-v1` | Canvas checkpoint key |
| `WHITEBOARD_RT_AGENT_STORAGE_FILE_PREFIX` | `whiteboardrt-agent-file-` | Image blob key prefix |
| `WHITEBOARD_RT_AGENT_PNG_WORKER_TIMEOUT_MS` | `120000` | PNG worker timeout |
| `WHITEBOARD_RT_AGENT_RENDER_MAX_DIM` | `8192` | Maximum render dimension |
| `WHITEBOARD_RT_AGENT_SHARE_UPLOAD_URL` | unset | Share upload endpoint |
| `WHITEBOARD_RT_AGENT_SHARE_BASE_URL` | unset | Share viewer base URL |

### Shared storage persistence

The AI canvas is designed as a single shared instance. It can persist its checkpoint and image blobs in the same storage backend used by the WhiteboardRT web container:

```bash
WHITEBOARD_RT_AGENT_PERSISTENCE=remote
WHITEBOARD_RT_AGENT_STORAGE_URL=http://excalidraw-storage:8080/api/v2
```

The storage backend stores the canvas checkpoint under `whiteboardrt-agent-canvas-state-v1` and image blobs under `whiteboardrt-agent-file-*`. This mode supports one AI canvas writer; do not run multiple AI canvas replicas against the same state key.

### Sharing

Sharing is **disabled by default**. `share` and `export_to_share_url` return a configuration error unless both `WHITEBOARD_RT_AGENT_SHARE_UPLOAD_URL` and `WHITEBOARD_RT_AGENT_SHARE_BASE_URL` are set to a compatible self-hosted service.

## Fonts and compatibility

- Editor fonts are served locally from `/assets/fonts`.
- Excalifont is retained for compatibility with existing scenes and headless rendering. Its entry is hidden in the font picker, and new text defaults to Virgil.
- `.excalidraw` and `.excalidrawlib` formats, MIME types, and internal element identifiers are intentionally retained for compatibility.

## Development

```bash
npm ci
npm run build
npm run type-check
npm run type-check:frontend
npm test
npm run test:canvas
```

## License and attribution

WhiteboardRT Agent Canvas includes code from mcp_excalidraw and Excalidraw. See [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

The Excalidraw name and logo are trademarks of their respective owner. This fork does not claim any affiliation with or endorsement by Excalidraw.
