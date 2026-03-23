/** Allowed admin usernames (login is case-insensitive). */
export const ADMIN_USERNAMES = ["bakrolbalmandal", "bakrolshishumandal"];

export function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

export function isAllowedAdmin(username) {
  return ADMIN_USERNAMES.includes(normalizeUsername(username));
}
