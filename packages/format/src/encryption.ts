/**
 * Encryption utilities for .agent files
 *
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';
import { scryptSync } from 'crypto';

// ============================================================================
// Constants
// ============================================================================

/** Encryption algorithm */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/** Key derivation function */
const KDF_ALGORITHM = 'pbkdf2';

/** Default iterations for PBKDF2 (OWASP recommendation) */
const DEFAULT_ITERATIONS = 600000;

/** Key length in bytes (256 bits) */
const KEY_LENGTH = 32;

/** IV length in bytes (96 bits for GCM) */
const IV_LENGTH = 12;

/** Salt length in bytes */
const SALT_LENGTH = 16;

/** Auth tag length in bytes (128 bits) */
const AUTH_TAG_LENGTH = 16;

// ============================================================================
// Types
// ============================================================================

export interface EncryptionOptions {
  password: string;
  iterations?: number;
  salt?: Buffer;
}

export interface EncryptedData {
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  salt: string; // hex-encoded
  iv: string; // hex-encoded
  authTag: string; // hex-encoded
  data: string; // hex-encoded
}

// ============================================================================
// Encryption Functions
// ============================================================================

/**
 * Derive a key from password using PBKDF2
 */
function deriveKey(
  password: string,
  salt: Buffer,
  iterations: number = DEFAULT_ITERATIONS
): Buffer {
  return pbkdf2Sync(password, salt, iterations, KEY_LENGTH, 'sha256');
}

/**
 * Derive a key from password using scrypt (more secure but slower)
 */
function deriveKeyScrypt(
  password: string,
  salt: Buffer,
  iterations: number = DEFAULT_ITERATIONS
): Buffer {
  // scrypt parameters (N, r, p)
  const N = 2 ** 16; // CPU/memory cost parameter
  const r = 8; // Block size parameter
  const p = 1; // Parallelization parameter

  return scryptSync(password, salt, KEY_LENGTH, { N, r, p });
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(
  data: Buffer,
  options: EncryptionOptions
): EncryptedData {
  const iterations = options.iterations || DEFAULT_ITERATIONS;
  const salt = options.salt || randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from password
  const key = deriveKey(options.password, salt, iterations);

  // Create cipher
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  // Encrypt data
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  return {
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2',
    iterations,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex')
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(
  encryptedData: EncryptedData,
  password: string
): Buffer {
  // Validate algorithm
  if (encryptedData.algorithm !== 'AES-256-GCM') {
    throw new Error(`Unsupported algorithm: ${encryptedData.algorithm}`);
  }

  // Validate KDF
  if (encryptedData.kdf !== 'PBKDF2') {
    throw new Error(`Unsupported KDF: ${encryptedData.kdf}`);
  }

  // Decode hex values
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const encrypted = Buffer.from(encryptedData.data, 'hex');

  // Derive key from password
  const key = deriveKey(password, salt, encryptedData.iterations);

  // Create decipher
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);

  // Set auth tag
  decipher.setAuthTag(authTag);

  // Decrypt data
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted;
}

/**
 * Generate a random password
 */
export function generatePassword(length: number = 32): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = require('crypto').randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Estimate encryption time (for progress indicators)
 */
export function estimateEncryptionTime(dataSize: number): number {
  // Rough estimate: 100MB/s on modern hardware
  return Math.ceil(dataSize / 100_000_000); // in seconds
}

/**
 * Validate encrypted data structure
 */
export function validateEncryptedData(data: unknown): data is EncryptedData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as Record<string, unknown>;

  return (
    d.algorithm === 'AES-256-GCM' &&
    d.kdf === 'PBKDF2' &&
    typeof d.iterations === 'number' &&
    d.iterations >= 100000 &&
    typeof d.salt === 'string' &&
    typeof d.iv === 'string' &&
    typeof d.authTag === 'string' &&
    typeof d.data === 'string'
  );
}
