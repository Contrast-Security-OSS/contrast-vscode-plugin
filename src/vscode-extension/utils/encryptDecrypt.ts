import * as crypto from 'crypto';
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.ENCRYPTION_SECRET ?? 'default_secret')) // Use nullish coalescing to handle null/undefined
  .digest('base64')
  .substr(0, 32); // AES-256 key (32 bytes)

const IV_LENGTH = 16; // AES block size (16 bytes)

// Encrypt function
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt function
function decrypt(text: string): string {
  const [iv, encrypted] = text.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export { encrypt, decrypt };
