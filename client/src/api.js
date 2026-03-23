// API Configuration
// Change this to your backend URL
export const API_BASE_URL = "https://bakrol-backend.onrender.com";

export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}
