# WhiteboardAI Canvas

WhiteboardAI Canvas is a modified fork of [mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw), packaged as a self-hosted live canvas for AI agents. Agents can draw, inspect, refine, export, and restore diagrams through the REST API, WebSocket sync, or headless renderer.

This repository preserves the upstream git history for provenance. WhiteboardAI Canvas is **not affiliated with or endorsed by Excalidraw**.

## Changes from upstream

- Debranded the canvas UI and canvas container as **WhiteboardAI**.
- Replaced the default Excalidraw menu with a minimal WhiteboardAI menu and an About dialog.
- Hid the Excalidraw welcome screen, help dialog, command palette, social links, and Excalifont entry in the font picker.
- Uses Virgil as the default font. Excalifont remains bundled and registered for compatibility with existing scenes.
- Loads editor fonts from the canvas server's own `/assets/fonts` route instead of a CDN.
- Removed Excalidraw-owned share defaults. Sharing stays disabled unless explicitly configured.
- Exported scene metadata now identifies WhiteboardAI as the source.
- Added `WHITEBOARDAI_*` runtime environment variables with existing `EXCALIDRAW_*` fallbacks.

The MCP server, CLI, and agent skill are documented separately in [MCP.md](./MCP.md). They still use upstream Excalidraw branding and will be rebranded in a follow-up.

## Quick start

### Docker

```bash
docker build -f Dockerfile.canvas -t whiteboardai-canvas:latest .
```

```bash
docker run -d -p 3000:3000 \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e WHITEBOARDAI_PUBLIC_URL=http://localhost:3000 \
  whiteboardai-canvas:latest
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
| `WHITEBOARDAI_PUBLIC_URL` | `EXCALIDRAW_PUBLIC_URL` | Human-facing canvas URL |
| `WHITEBOARDAI_NO_AUTOSTART` | `EXCALIDRAW_NO_AUTOSTART` | Disable canvas auto-start |
| `WHITEBOARDAI_EXPORT_DIR` | `EXCALIDRAW_EXPORT_DIR` | Export sandbox |
| `WHITEBOARDAI_DATA_DIR` | `EXCALIDRAW_DATA_DIR` | Durable canvas state directory |
| `WHITEBOARDAI_PNG_WORKER_TIMEOUT_MS` | `EXCALIDRAW_PNG_WORKER_TIMEOUT_MS` | PNG worker timeout |
| `WHITEBOARDAI_RENDER_MAX_DIM` | `EXCALIDRAW_RENDER_MAX_DIM` | Maximum render dimension |
| `WHITEBOARDAI_SHARE_UPLOAD_URL` | `EXCALIDRAW_SHARE_UPLOAD_URL` | Share upload endpoint |
| `WHITEBOARDAI_SHARE_BASE_URL` | `EXCALIDRAW_SHARE_BASE_URL` | Share viewer base URL |

### Sharing

Sharing is **disabled by default**. `share` and `export_to_excalidraw_url` return a configuration error unless both `WHITEBOARDAI_SHARE_UPLOAD_URL` and `WHITEBOARDAI_SHARE_BASE_URL` are set to a compatible self-hosted service.

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

WhiteboardAI Canvas includes code from mcp_excalidraw and Excalidraw. See [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

The Excalidraw name and logo are trademarks of their respective owner. This fork does not claim any affiliation with or endorsement by Excalidraw.
