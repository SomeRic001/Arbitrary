import crypto from 'crypto';

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('TOKEN_ENCRYPTION_KEY or NEXTAUTH_SECRET is required to encrypt tokens');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptToken(stored: string | null): string | null {
  if (!stored) return null;
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) return stored;
  const [, encodedIv, encodedAuthTag, encodedEncrypted] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(encodedIv, 'base64url'), { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encodedEncrypted, 'base64url')), decipher.final()]).toString('utf8');
}
