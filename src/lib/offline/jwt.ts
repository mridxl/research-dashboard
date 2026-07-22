/**
 * Decode JWT payload without verifying signature (client-side convenience only).
 *
 * By default, an expired token is treated as unauthenticated (returns null).
 * Pass `ignoreExpiry: true` for call sites that only need the uid for local
 * bookkeeping (e.g. counting already-saved offline records) and must keep
 * working even once the token has expired.
 */
export function getUidFromToken(
  token: string | null | undefined,
  ignoreExpiry = false
): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as { sub?: string; exp?: number };
    if (!ignoreExpiry && typeof parsed.exp === 'number' && parsed.exp * 1000 <= Date.now()) {
      return null;
    }
    return typeof parsed.sub === 'string' ? parsed.sub : null;
  } catch {
    return null;
  }
}
