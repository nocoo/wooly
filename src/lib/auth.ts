/**
 * Parse a comma-separated email whitelist string into a normalized array.
 */
export function parseEmailWhitelist(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if an email is allowed to sign in.
 * Fail-closed: an empty whitelist denies all logins so a misconfigured
 * AUTH_ALLOWED_EMAILS cannot silently open the dashboard to anyone.
 */
export function isEmailAllowed(
  email: string | null | undefined,
  whitelist: string[],
): boolean {
  if (!email) return false;
  if (whitelist.length === 0) {
    console.warn(
      "AUTH_ALLOWED_EMAILS not configured. Denying all logins for security.",
    );
    return false;
  }
  return whitelist.includes(email.toLowerCase());
}
