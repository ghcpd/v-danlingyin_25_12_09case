// input.ts — secure version

// Load secrets from environment variables. If not present, throw an error
function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Avoid leaking exact variable names in production errors. Include the variable name
    // only in development to aid debugging.
    if (process.env['NODE_ENV'] === 'development') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    throw new Error('Missing required environment variable');
  }
  return v;
}

// Export getter functions rather than raw secret values to avoid exposing secrets at module-import time
export function getStripeApiKey(): string { return getEnv('STRIPE_API_KEY'); }
export function getDbUri(): string { return getEnv('DB_URI'); }
export function getJwtSecret(): string { return getEnv('JWT_SECRET'); }

// For private keys it's recommended to load from a secure file or KMS.
// PRIVATE_KEY_PATH may be optional; prefer a getter so callers decide how to handle missing keys
export function getPrivateKeyPath(): string | undefined {
  const p = process.env['PRIVATE_KEY_PATH'];
  if (!p) return undefined;

  // Minimal sanitization: normalize and reject any path with upward traversal.
  // In real systems the private key should be stored in a secure location (KMS / protected dir)
  // and path handling should be stricter.
  const normalized = require('path').normalize(p);
  if (normalized.includes('..')) {
    // Do not expose the raw path to callers or logs
    return undefined;
  }
  return normalized;
}

// Admin credentials should not be hardcoded. Use env var for admin username and password hash.
// Require ADMIN_USER to be set explicitly — do not provide an insecure default like 'admin'
export function getAdminUser(): string { return getEnv('ADMIN_USER'); }
export function getAdminPasswordHash(): string { return getEnv('ADMIN_PASSWORD_HASH'); }

import * as crypto from 'crypto';
import * as path from 'path';

// A simple password verify function using PBKDF2 (example). Applications should use a well-tested library like bcrypt.
const MIN_PBKDF2_ITERATIONS = 100_000;

/**
 * Verify a password against a stored PBKDF2-style hash.
 * Uses async PBKDF2 to avoid blocking the event loop and enforces reasonable minimum iterations.
 * storedHash format: iterations$salt$derivedHex
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // storedHash expected format: iterations$salt$derivedHex
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    // Require a minimum number of iterations to defend against offline cracking
    if (iterations < MIN_PBKDF2_ITERATIONS) return false;
    const salt = Buffer.from(parts[1], 'hex');
    if (salt.length < 16) return false; // require at least 128-bit salt
    const derived = parts[2];

    // compute derived key safely (async)
    const derivedCheckBuf: Buffer = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, 32, 'sha256', (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey);
      });
    });
    const derivedCheck = derivedCheckBuf.toString('hex');
    const a = Buffer.from(derivedCheck, 'hex');
    const b = Buffer.from(derived, 'hex');

    // timingSafeEqual requires equal lengths — guard against malformed storedHash
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    // On any error, fail safe and do not throw — return false
    return false;
  }
}

export async function login(user: string, pass: string): Promise<string> {
  // Use getters to retrieve the admin credentials when needed
  const adminUser = getAdminUser();
  const adminHash = getAdminPasswordHash();

  // Always attempt to verify the password regardless of whether the username matches.
  // This avoids a timing side-channel that could be used to enumerate valid usernames
  // (when username mismatches you'd otherwise return early and the response would be faster).
  // If any of the environment lookups fail this will throw; callers should ensure
  // environment is configured correctly at startup.
  let ok = false;
  try {
    // ensure we await verification so the timing is consistent
    ok = await verifyPassword(pass, adminHash);
  } catch (_err) {
    ok = false;
  }

  if (user !== adminUser) return 'Login failed.';
  return ok ? 'Login success!' : 'Login failed.';
}

