import dotenv from 'dotenv';

// Load environment variables once for every entry point (MCP server, CLI, canvas server)
dotenv.config();

const firstEnv = (...names: string[]): string | undefined =>
  names.map(name => process.env[name]?.trim()).find(Boolean);

// Express server configuration
export const EXPRESS_SERVER_URL = process.env.EXPRESS_SERVER_URL || 'http://127.0.0.1:3000';
export const ENABLE_CANVAS_SYNC = process.env.ENABLE_CANVAS_SYNC !== 'false'; // Default to true

// Public URL of the canvas UI, used in human-facing hints. Falls back to
// EXPRESS_SERVER_URL so local/Docker setups keep working. This is display-only:
// API calls and auto-start always use EXPRESS_SERVER_URL.
export const EXCALIDRAW_PUBLIC_URL =
  (firstEnv('WHITEBOARDAI_PUBLIC_URL', 'EXCALIDRAW_PUBLIC_URL') || EXPRESS_SERVER_URL)
    .replace(/\/+$/, '');

// MCP server transport configuration. Defaults to stdio for MCP clients;
// set MCP_TRANSPORT=http to serve the same tools over streamable HTTP.
export const MCP_TRANSPORT = process.env.MCP_TRANSPORT === 'http' ? 'http' : 'stdio';
export const MCP_HOST = process.env.MCP_HOST || '0.0.0.0';
export const MCP_PORT = Number.parseInt(process.env.MCP_PORT || '3100', 10);

// Opt-out for auto-starting the canvas server from the CLI / MCP server
export const EXCALIDRAW_NO_AUTOSTART =
  firstEnv('WHITEBOARDAI_NO_AUTOSTART', 'EXCALIDRAW_NO_AUTOSTART') === '1';

// Safe file path validation base directory (see sanitizeFilePath)
export const ALLOWED_EXPORT_DIR =
  firstEnv('WHITEBOARDAI_EXPORT_DIR', 'EXCALIDRAW_EXPORT_DIR') || process.cwd();

// Share target for `share` / `export_to_share_url`. Sharing stays disabled
// unless both URLs are explicitly configured.
export const EXCALIDRAW_SHARE_UPLOAD_URL =
  firstEnv('WHITEBOARDAI_SHARE_UPLOAD_URL', 'EXCALIDRAW_SHARE_UPLOAD_URL') || '';
export const EXCALIDRAW_SHARE_BASE_URL =
  (firstEnv('WHITEBOARDAI_SHARE_BASE_URL', 'EXCALIDRAW_SHARE_BASE_URL') || '')
    .replace(/\/+$/, '');

// Shared storage backend used for durable canvas persistence. Setting
// WHITEBOARDAI_STORAGE_URL enables remote persistence directly; setting
// WHITEBOARDAI_PERSISTENCE=remote enables it using the existing web-container
// storage URL fallbacks.
const remotePersistenceRequested =
  process.env.WHITEBOARDAI_PERSISTENCE?.trim().toLowerCase() === 'remote';
const explicitStorageUrl = firstEnv('WHITEBOARDAI_STORAGE_URL');
export const WHITEBOARDAI_STORAGE_URL =
  (remotePersistenceRequested
    ? firstEnv(
        'WHITEBOARDAI_STORAGE_URL',
        'VITE_APP_INTERNAL_STORAGE_URL',
        'HTTP_STORAGE_BACKEND_URL'
      )
    : explicitStorageUrl
  )?.replace(/\/+$/, '') || '';
export const WHITEBOARDAI_STORAGE_STATE_KEY =
  process.env.WHITEBOARDAI_STORAGE_STATE_KEY?.trim() ||
  'whiteboardai-canvas-state-v1';
export const WHITEBOARDAI_STORAGE_FILE_PREFIX =
  process.env.WHITEBOARDAI_STORAGE_FILE_PREFIX?.trim() || 'whiteboardai-file-';
