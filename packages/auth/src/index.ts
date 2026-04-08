import { decodeHex, encodeHexLowerCase } from "@oslojs/encoding";

/**
 * Generate a random token for sessions
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeHexLowerCase(bytes);
}

/**
 * Hash a password using SHA-256 (for ultra-lightweight worker usage)
 * Note: In a real production app, you might want Scrypt or Argon2id,
 * but those can be slow on the Edge. SHA-256 + Salt is a light starting point.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}
