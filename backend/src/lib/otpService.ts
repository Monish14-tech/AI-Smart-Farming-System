import crypto from 'crypto';

/**
 * AgriNova Secure OTP Service
 * - Cryptographically secure pseudo-random number generator (CSPRNG)
 * - Timing-safe constant time comparison to prevent side-channel leaks
 * - Brute-force attempt tracking and lockout
 */

const MAX_DELIVERY_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

interface AttemptRecord {
  count: number;
  lockedUntil?: Date;
}

const deliveryAttempts = new Map<string, AttemptRecord>();

// Periodic cleanup of stale attempt records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of deliveryAttempts.entries()) {
    if (record.lockedUntil && record.lockedUntil.getTime() < now) {
      deliveryAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generates a cryptographically secure numeric OTP of specified length.
 * Default length is 6 digits (range: 100000 - 999999).
 */
export function generateSecureOtp(length: number = 6): string {
  if (length < 4 || length > 10) {
    throw new Error('OTP length must be between 4 and 10 digits');
  }
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  return crypto.randomInt(min, max).toString();
}

/**
 * Constant-time comparison between two OTP strings to prevent timing attacks.
 */
export function timingSafeOtpEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const bufA = Buffer.from(a.trim());
  const bufB = Buffer.from(b.trim());

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Checks if a verification target (e.g. jobId) is currently locked out due to excessive failed attempts.
 */
export function isDeliveryVerificationLocked(jobId: string): { locked: boolean; waitMinutes?: number } {
  const record = deliveryAttempts.get(jobId);
  if (!record || !record.lockedUntil) {
    return { locked: false };
  }

  const now = Date.now();
  if (record.lockedUntil.getTime() > now) {
    const remainingMs = record.lockedUntil.getTime() - now;
    return { locked: true, waitMinutes: Math.ceil(remainingMs / 60000) };
  }

  // Lockout expired
  deliveryAttempts.delete(jobId);
  return { locked: false };
}

/**
 * Records a failed verification attempt.
 * Returns the number of attempts remaining, and whether lockout was triggered.
 */
export function recordDeliveryFailedAttempt(jobId: string): {
  attemptsLeft: number;
  locked: boolean;
  waitMinutes?: number;
} {
  const now = new Date();
  let record = deliveryAttempts.get(jobId);

  if (!record) {
    record = { count: 0 };
    deliveryAttempts.set(jobId, record);
  }

  record.count += 1;

  if (record.count >= MAX_DELIVERY_ATTEMPTS) {
    record.lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
    return {
      attemptsLeft: 0,
      locked: true,
      waitMinutes: Math.ceil(LOCKOUT_MS / 60000),
    };
  }

  return {
    attemptsLeft: MAX_DELIVERY_ATTEMPTS - record.count,
    locked: false,
  };
}

/**
 * Clears attempt tracking upon successful verification.
 */
export function clearDeliveryAttempts(jobId: string): void {
  deliveryAttempts.delete(jobId);
}
