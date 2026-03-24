// API Configuration
// Change this to your backend URL
// For local development: http://localhost:5004
// For production: https://bakrol-backend.onrender.com
const isDev = process.env.NODE_ENV === "development";
export const API_BASE_URL = isDev ? "http://localhost:5004" : "https://bakrol-backend.onrender.com";

export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}
