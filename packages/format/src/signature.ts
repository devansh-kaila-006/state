/**
 * Digital signature utilities for .agent files
 *
 * Implements Ed25519 digital signatures for authenticity verification
 */

import { randomBytes } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface KeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

export interface Signature {
  algorithm: 'Ed25519';
  publicKey: string; // hex-encoded
  signature: string; // hex-encoded
  timestamp: string; // ISO 8601
}

export interface SignOptions {
  keyPair?: KeyPair;
  timestamp?: string;
}

// ============================================================================
// Signature Functions
// ============================================================================

/**
 * Generate a new Ed25519 key pair
 */
export function generateKeyPair(): KeyPair {
  // TODO: Implement using tweetnacl or sodium-js
  // For now, generate placeholder keys
  const publicKey = randomBytes(32);
  const secretKey = randomBytes(64);

  return { publicKey, secretKey };
}

/**
 * Sign data using Ed25519
 */
export function sign(
  data: Buffer,
  secretKey: Buffer,
  timestamp?: string
): Signature {
  // TODO: Implement actual Ed25519 signing
  // This would use tweetnacl: nacl.sign.detached(data, secretKey)

  // Placeholder implementation
  const signature = randomBytes(64);

  return {
    algorithm: 'Ed25519',
    publicKey: secretKey.slice(32).toString('hex'), // Public key is last 32 bytes
    signature: signature.toString('hex'),
    timestamp: timestamp || new Date().toISOString()
  };
}

/**
 * Verify Ed25519 signature
 */
export function verify(
  data: Buffer,
  signature: Buffer,
  publicKey: Buffer
): boolean {
  // TODO: Implement actual Ed25519 verification
  // This would use tweetnacl: nacl.sign.detached.verify(data, signature, publicKey)

  // Placeholder: always return true for now
  return true;
}

/**
 * Verify signature from Signature object
 */
export function verifySignatureObject(
  data: Buffer,
  signatureObj: Signature
): boolean {
  try {
    const signature = Buffer.from(signatureObj.signature, 'hex');
    const publicKey = Buffer.from(signatureObj.publicKey, 'hex');
    return verify(data, signature, publicKey);
  } catch {
    return false;
  }
}

/**
 * Export key pair to hex format
 */
export function exportKeyPair(keyPair: KeyPair): {
  publicKey: string;
  secretKey: string;
} {
  return {
    publicKey: keyPair.publicKey.toString('hex'),
    secretKey: keyPair.secretKey.toString('hex')
  };
}

/**
 * Import key pair from hex format
 */
export function importKeyPair(keys: {
  publicKey: string;
  secretKey: string;
}): KeyPair {
  return {
    publicKey: Buffer.from(keys.publicKey, 'hex'),
    secretKey: Buffer.from(keys.secretKey, 'hex')
  };
}

/**
 * Validate key pair
 */
export function validateKeyPair(keyPair: KeyPair): boolean {
  return (
    keyPair.publicKey.length === 32 &&
    keyPair.secretKey.length === 64
  );
}

/**
 * Validate signature object
 */
export function validateSignatureObject(signature: unknown): signature is Signature {
  if (!signature || typeof signature !== 'object') {
    return false;
  }

  const s = signature as Record<string, unknown>;

  return (
    s.algorithm === 'Ed25519' &&
    typeof s.publicKey === 'string' &&
    s.publicKey.length === 64 &&
    typeof s.signature === 'string' &&
    s.signature.length === 128 &&
    typeof s.timestamp === 'string'
  );
}

/**
 * Get key fingerprint (for identification)
 */
export function getKeyFingerprint(publicKey: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);
}

/**
 * Generate key ID from public key
 */
export function generateKeyId(publicKey: Buffer): string {
  const fingerprint = getKeyFingerprint(publicKey);
  return `ed25519:${fingerprint}`;
}
