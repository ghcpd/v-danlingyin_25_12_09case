// input_backup.ts — insecure original

export const STRIPE_API_KEY = 'sk_test_51HcFAKEKEY_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
export const DB_URI = 'postgres://dbuser:DBPass123@localhost:5432/mydb';
export const JWT_SECRET = 'supersecretjwtkey';

export const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA7FAKEPRIVATEKEYDATAEXAMPLE...IDAQABAoIBAQDX
FAKEPRIVATEKEYDATAEXAMPLE...+
-----END RSA PRIVATE KEY-----`;

export const ADMIN_USER = 'admin';
export const ADMIN_PASSWORD = 'password123';

export function login(user: string, pass: string): string {
  if (user !== ADMIN_USER) return 'Login failed.';
  return pass === ADMIN_PASSWORD ? 'Login success!' : 'Login failed.';
}
