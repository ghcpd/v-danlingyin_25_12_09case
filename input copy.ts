// input.ts — secure version with security enhancements

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

// Security: Rate limiting state for brute force protection
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Helper: Check rate limiting
function checkRateLimit(user: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(user);
  
  if (!attempt) {
    return true; // First attempt
  }
  
  // Reset counter if lockout period expired
  if (now - attempt.timestamp > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(user);
    return true;
  }
  
  // Reject if max attempts exceeded
  return attempt.count < MAX_ATTEMPTS;
}

// Helper: Record failed login attempt
function recordFailedAttempt(user: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(user);
  
  if (!attempt) {
    loginAttempts.set(user, { count: 1, timestamp: now });
  } else {
    attempt.count++;
    attempt.timestamp = now;
  }
}

// Security: Validate input parameters (prevent injection/overflow)
function validateLoginInput(user: string, pass: string): { valid: boolean; error?: string } {
  if (!user || typeof user !== 'string') {
    return { valid: false, error: 'Invalid username' };
  }
  if (!pass || typeof pass !== 'string') {
    return { valid: false, error: 'Invalid password' };
  }
  // Prevent excessively long inputs
  if (user.length > 256 || pass.length > 1024) {
    return { valid: false, error: 'Input too long' };
  }
  return { valid: true };
}

// A simple password verify function using PBKDF2 (example). Applications should use a well-tested library like bcrypt.
export function verifyPassword(password: string, storedHash: string): boolean {
  // storedHash expected format: iterations$salt$derivedHex
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    // Security: Validate iterations is within acceptable range (10000-1000000)
    if (!Number.isFinite(iterations) || iterations < 10000 || iterations > 1000000) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const derived = parts[2];
    
    // Validate salt length (should be 32 bytes = 64 hex chars)
    if (salt.length !== 32) return false;
    // Validate derived length (should be 64 hex chars = 32 bytes)
    if (derived.length !== 64) return false;

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
  // Security: Validate input parameters
  const validation = validateLoginInput(user, pass);
  if (!validation.valid) {
    return 'Login failed.';
  }
  
  // Security: Enforce rate limiting to prevent brute force attacks
  if (!checkRateLimit(user)) {
    return 'Account temporarily locked. Try again later.';
  }
  
  // Use getters to retrieve the admin credentials when needed
  const adminUser = getAdminUser();
  const adminHash = getAdminPasswordHash();

  if (user !== adminUser) {
    recordFailedAttempt(user);
    return 'Login failed.';
  }
  
  const ok = verifyPassword(pass, adminHash);
  
  if (!ok) {
    recordFailedAttempt(user);
    return 'Login failed.';
  }
  
  // Clear attempt counter on successful login
  loginAttempts.delete(user);
  return 'Login success!';
}

