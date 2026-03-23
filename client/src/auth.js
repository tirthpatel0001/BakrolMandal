const TOKEN_KEY = "bbm_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Headers for API calls. Pass json: true only for JSON bodies (not FormData). */
export function authHeaders({ json = false } = {}) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}
