import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY not configured. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string containing: IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Pack: IV (12) + encrypted + tag (16)
  const packed = Buffer.concat([iv, encrypted, tag]);
  return packed.toString('base64');
}

/**
 * Decrypts a base64-encoded string produced by encrypt().
 * Returns the original plaintext.
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const packed = Buffer.from(encoded, 'base64');

  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(packed.length - TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH, packed.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Encrypts if TOKEN_ENCRYPTION_KEY is set, otherwise returns plaintext.
 * Allows gradual adoption without breaking existing tokens.
 */
export function encryptIfConfigured(plaintext: string): string {
  if (!process.env.TOKEN_ENCRYPTION_KEY) return plaintext;
  return encrypt(plaintext);
}

/**
 * Decrypts if the value looks like a base64-encoded encrypted token,
 * otherwise returns it as-is (backwards compatible with plain text tokens).
 */
export function decryptIfNeeded(value: string): string {
  if (!process.env.TOKEN_ENCRYPTION_KEY) return value;

  // Heuristic: encrypted tokens are base64 and > 40 chars (IV + min content + tag)
  // Plain IG/TT tokens are typically alphanumeric with underscores/hyphens
  try {
    const buf = Buffer.from(value, 'base64');
    // Minimum size: 12 (IV) + 1 (ciphertext) + 16 (tag) = 29 bytes
    if (buf.length >= 29 && value.length > 40 && !value.includes('EAAG') && !value.includes('act_')) {
      return decrypt(value);
    }
  } catch {
    // Not encrypted, return as-is
  }
  return value;
}
