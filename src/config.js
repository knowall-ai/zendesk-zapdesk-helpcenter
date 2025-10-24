/**
 * Application Configuration
 */

// API base URL - use environment variable or default to relative path for local dev
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Full API endpoints
export const POST_COMMENT_API = `${API_BASE_URL}/api/post-comment`
export const GET_AGENT_LIGHTNING_API = `${API_BASE_URL}/api/get-agent-lightning`
