/**
 * Global API configuration utility.
 * In development, VITE_API_URL is typically empty (proxied by Vite).
 * In production, you must set VITE_API_URL to your Render backend URL.
 */
const VITE_API_URL = import.meta.env.VITE_API_URL || "";

// Standardizes path handling to prevent double slashes
const cleanPath = (path) => path.startsWith("/") ? path : `/${path}`;

/**
 * Returns the full absolute URL for a backend API route.
 * @param {string} path - The API route (e.g., "/api/chat")
 */
export const getApiUrl = (path) => {
  if (!VITE_API_URL) return path; // Use relative path (proxied) in dev
  return `${VITE_API_URL}${cleanPath(path)}`;
};
