// input.ts — secure version

// Load secrets from environment variables. If not present, throw an error
function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
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
  return process.env['PRIVATE_KEY_PATH'] || undefined;
}

// Admin credentials should not be hardcoded. Use env var for admin username and password hash.
// Require ADMIN_USER to be set explicitly — do not provide an insecure default like 'admin'
export function getAdminUser(): string { return getEnv('ADMIN_USER'); }
export function getAdminPasswordHash(): string { return getEnv('ADMIN_PASSWORD_HASH'); }

import * as crypto from 'crypto';

// A simple password verify function using PBKDF2 (example). Applications should use a well-tested library like bcrypt.
export function verifyPassword(password: string, storedHash: string): boolean {
  // storedHash expected format: iterations$salt$derivedHex
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const derived = parts[2];

    // compute derived key safely
    const derivedCheck = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
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

export function login(user: string, pass: string): string {
  // Use getters to retrieve the admin credentials when needed
  const adminUser = getAdminUser();
  const adminHash = getAdminPasswordHash();

  if (user !== adminUser) return 'Login failed.';
  const ok = verifyPassword(pass, adminHash);
  return ok ? 'Login success!' : 'Login failed.';
}

