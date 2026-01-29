import { getRedisClient } from './redis';
import { config } from '../config';

/**
 * Rate limiting implementation using Redis counters
 * Tracks emails sent per hour for both global and per-sender limits
 *
 * Strategy:
 * - Uses Redis keys with hour-based windows: `emails:hour:{hour_timestamp}`
 * - Each sender has a key: `emails:sender:{senderId}:hour:{hour_timestamp}`
 * - Keys expire after 1 hour to auto-cleanup
 * - Safe across multiple workers/instances (Redis atomic operations)
 */

function getCurrentHourTimestamp(): number {
  // Round to the nearest hour
  return Math.floor(Date.now() / 3600000) * 3600000;
}

function getNextHourTimestamp(fromTimestamp: number): number {
  return fromTimestamp + 3600000;
}

/**
 * Check if we can send an email for a given sender
 * Returns true if within rate limits, false otherwise
 */
export async function checkRateLimit(senderId: string): Promise<boolean> {
  const redis = getRedisClient();
  const hourTs = getCurrentHourTimestamp();

  // Key for global rate limit
  const globalKey = `emails:hour:${hourTs}`;
  // Key for per-sender rate limit
  const senderKey = `emails:sender:${senderId}:hour:${hourTs}`;

  // Get current counts
  const [globalCount, senderCount] = await Promise.all([
    redis.get(globalKey),
    redis.get(senderKey),
  ]);

  const globalEmails = parseInt(globalCount || '0');
  const senderEmails = parseInt(senderCount || '0');

  // Check limits
  if (globalEmails >= config.rateLimit.maxEmailsPerHourGlobal) {
    console.log(
      `[RATE_LIMIT] Global limit reached: ${globalEmails}/${config.rateLimit.maxEmailsPerHourGlobal}`
    );
    return false;
  }

  if (senderEmails >= config.rateLimit.maxEmailsPerHourPerSender) {
    console.log(
      `[RATE_LIMIT] Sender limit reached for ${senderId}: ${senderEmails}/${config.rateLimit.maxEmailsPerHourPerSender}`
    );
    return false;
  }

  return true;
}

/**
 * Increment email count for rate limiting
 * Should be called after successfully sending an email
 */
export async function incrementEmailCount(senderId: string): Promise<void> {
  const redis = getRedisClient();
  const hourTs = getCurrentHourTimestamp();

  const globalKey = `emails:hour:${hourTs}`;
  const senderKey = `emails:sender:${senderId}:hour:${hourTs}`;

  // Increment both counters atomically
  await Promise.all([
    redis.incr(globalKey),
    redis.incr(senderKey),
    // Set expiry to 1 hour + 60 seconds buffer
    redis.expire(globalKey, 3660),
    redis.expire(senderKey, 3660),
  ]);
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(senderId?: string) {
  const redis = getRedisClient();
  const hourTs = getCurrentHourTimestamp();

  const globalKey = `emails:hour:${hourTs}`;

  const globalCount = await redis.get(globalKey);
  const globalEmails = parseInt(globalCount || '0');
  const globalRemaining = Math.max(
    0,
    config.rateLimit.maxEmailsPerHourGlobal - globalEmails
  );

  let senderCount = 0;
  let senderRemaining = config.rateLimit.maxEmailsPerHourPerSender;

  if (senderId) {
    const senderKey = `emails:sender:${senderId}:hour:${hourTs}`;
    const senderCountStr = await redis.get(senderKey);
    senderCount = parseInt(senderCountStr || '0');
    senderRemaining = Math.max(
      0,
      config.rateLimit.maxEmailsPerHourPerSender - senderCount
    );
  }

  return {
    global: {
      sent: globalEmails,
      limit: config.rateLimit.maxEmailsPerHourGlobal,
      remaining: globalRemaining,
      hourWindow: new Date(hourTs).toISOString(),
    },
    sender: senderId
      ? {
          sent: senderCount,
          limit: config.rateLimit.maxEmailsPerHourPerSender,
          remaining: senderRemaining,
          hourWindow: new Date(hourTs).toISOString(),
        }
      : null,
  };
}

/**
 * Calculate next available slot considering rate limits
 * Returns timestamp when next email can be sent
 */
export async function getNextAvailableSlot(senderId: string): Promise<number> {
  const redis = getRedisClient();
  const now = Date.now();
  const hourTs = getCurrentHourTimestamp();

  const globalKey = `emails:hour:${hourTs}`;
  const senderKey = `emails:sender:${senderId}:hour:${hourTs}`;

  const [globalCount, senderCount] = await Promise.all([
    redis.get(globalKey),
    redis.get(senderKey),
  ]);

  const globalEmails = parseInt(globalCount || '0');
  const senderEmails = parseInt(senderCount || '0');

  // If both are within limits, can send immediately
  if (
    globalEmails < config.rateLimit.maxEmailsPerHourGlobal &&
    senderEmails < config.rateLimit.maxEmailsPerHourPerSender
  ) {
    return now;
  }

  // If one is exhausted, wait until next hour
  return getNextHourTimestamp(hourTs);
}
