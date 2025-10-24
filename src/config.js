/**
 * Application Configuration
 */

// API base URL - use environment variable or default to relative path for local dev
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Full API endpoint
export const POST_COMMENT_API = `${API_BASE_URL}/api/post-comment`
