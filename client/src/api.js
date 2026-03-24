// API Configuration
// Change this to your backend URL
export const API_BASE_URL = "http://localhost:5004";

export function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}
