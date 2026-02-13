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
 * If the whitelist is empty, all emails are allowed.
 */
export function isEmailAllowed(
  email: string | null | undefined,
  whitelist: string[],
): boolean {
  if (!email) return false;
  if (whitelist.length === 0) return true;
  return whitelist.includes(email.toLowerCase());
}
