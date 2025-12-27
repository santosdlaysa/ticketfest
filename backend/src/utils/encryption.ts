import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Encryption utility for sensitive data (CPF, phone, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */

// Use a separate key for data encryption (derived from JWT_SECRET)
const getEncryptionKey = (): Buffer => {
  const secret = env.JWT_SECRET || 'fallback-secret-key-for-development';
  // Derive a 32-byte key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encryptData(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV, auth tag, and encrypted data
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * Expects base64 encoded string: iv:authTag:encryptedData
 */
export function decryptData(encryptedString: string): string {
  if (!encryptedString || !encryptedString.includes(':')) {
    // Not encrypted or invalid format, return as-is
    return encryptedString;
  }

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      return encryptedString; // Not encrypted
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If decryption fails, data might not be encrypted
    return encryptedString;
  }
}

/**
 * Check if a string appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * Mask sensitive data for display (e.g., "123.456.789-00" -> "***.***.***-00")
 */
export function maskCPF(cpf: string): string {
  if (!cpf) return cpf;
  // Remove non-digits
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.***-**';
  // Show only last 2 digits
  return `***.***.***-${digits.slice(-2)}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  // Show only last 4 digits
  return `****-${digits.slice(-4)}`;
}

export function maskEmail(email: string): string {
  if (!email) return email;
  const [local, domain] = email.split('@');
  if (!domain) return '****';
  const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Hash sensitive data for indexing (allows searching without decryption)
 * Uses HMAC-SHA256 with truncation
 */
export function hashForIndex(data: string): string {
  if (!data) return '';
  const secret = env.JWT_SECRET || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(data.toLowerCase()).digest('hex').slice(0, 32);
}
