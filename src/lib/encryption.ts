import crypto from 'crypto';

const key = Buffer.from(process.env.PII_ENC_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');

export function encryptPII(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptPII(encrypted: string): string {
  const data = Buffer.from(encrypted, 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const enc = data.subarray(28);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export function maskAccount(encOrPlain?: string | null): string | null {
  if (!encOrPlain) return null;
  
  let accountNumber: string;
  try {
    // Try to decrypt first
    accountNumber = decryptPII(encOrPlain);
  } catch {
    // If decryption fails, assume it's plain text
    accountNumber = encOrPlain;
  }
  
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `•••• ${digits.slice(-4)}`;
}
