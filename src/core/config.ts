import dotenv from 'dotenv';

// Load environment variables once for every entry point (MCP server, CLI, canvas server)
dotenv.config();

const env = (name: string): string | undefined => process.env[name]?.trim();

// Express server configuration
export const EXPRESS_SERVER_URL = process.env.EXPRESS_SERVER_URL || 'http://127.0.0.1:3000';
export const ENABLE_CANVAS_SYNC = process.env.ENABLE_CANVAS_SYNC !== 'false'; // Default to true

// Public URL of the canvas UI, used in human-facing hints. Falls back to
// EXPRESS_SERVER_URL so local/Docker setups keep working. This is display-only:
// API calls and auto-start always use EXPRESS_SERVER_URL.
export const AGENT_PUBLIC_URL =
  (env('WHITEBOARD_RT_AGENT_PUBLIC_URL') || EXPRESS_SERVER_URL)
    .replace(/\/+$/, '');

// MCP server transport configuration. Defaults to stdio for MCP clients;
// set MCP_TRANSPORT=http to serve the same tools over streamable HTTP.
export const MCP_TRANSPORT = process.env.MCP_TRANSPORT === 'http' ? 'http' : 'stdio';
export const MCP_HOST = process.env.MCP_HOST || '0.0.0.0';
export const MCP_PORT = Number.parseInt(process.env.MCP_PORT || '3100', 10);

// Opt-out for auto-starting the canvas server from the CLI / MCP server
export const AGENT_NO_AUTOSTART = env('WHITEBOARD_RT_AGENT_NO_AUTOSTART') === '1';

// Safe file path validation base directory (see sanitizeFilePath)
export const ALLOWED_EXPORT_DIR =
  env('WHITEBOARD_RT_AGENT_EXPORT_DIR') || process.cwd();

// Share target for `share` / `export_to_share_url`. Sharing stays disabled
// unless both URLs are explicitly configured.
export const AGENT_SHARE_UPLOAD_URL =
  env('WHITEBOARD_RT_AGENT_SHARE_UPLOAD_URL') || '';
export const AGENT_SHARE_BASE_URL =
  (env('WHITEBOARD_RT_AGENT_SHARE_BASE_URL') || '').replace(/\/+$/, '');

// Shared storage backend used for durable canvas persistence.
export const AGENT_PERSISTENCE_REQUESTED =
  env('WHITEBOARD_RT_AGENT_PERSISTENCE')?.toLowerCase() === 'remote';
export const WHITEBOARD_RT_AGENT_STORAGE_URL =
  (env('WHITEBOARD_RT_AGENT_STORAGE_URL') || '').replace(/\/+$/, '');
export const WHITEBOARD_RT_AGENT_STORAGE_STATE_KEY =
  env('WHITEBOARD_RT_AGENT_STORAGE_STATE_KEY') ||
  'whiteboardrt-agent-canvas-state-v1';
export const WHITEBOARD_RT_AGENT_STORAGE_FILE_PREFIX =
  env('WHITEBOARD_RT_AGENT_STORAGE_FILE_PREFIX') || 'whiteboardrt-agent-file-';
