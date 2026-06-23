/**
 * Username helpers. Auth is username-only (no email), so each username maps to
 * a synthetic internal email that Supabase Auth uses under the hood.
 * Kept free of Next.js/server imports so the create-admin script can use it.
 */
export const INTERNAL_EMAIL_DOMAIN =
  process.env.INTERNAL_EMAIL_DOMAIN || "users.tracker.local";

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function synthEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}

/** 3–30 chars: lowercase letters, digits, and . _ - */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,30}$/.test(normalizeUsername(username));
}

export const USERNAME_RULE =
  "3–30 characters: letters, numbers, and . _ - only";
