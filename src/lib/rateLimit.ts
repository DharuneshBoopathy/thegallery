/**
 * In-Memory Sliding Window Rate Limiter & Security Anomaly Tracker
 * Suitable for serverless / edge runtime or local cluster deployment.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const anomalyLog = new Map<string, number>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  isAnomaly: boolean;
}

/**
 * Checks request limits against key (IP or User ID)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 60, prefix: "api" }
): RateLimitResult {
  const now = Date.now();
  const key = `${options.prefix || "rl"}:${identifier}`;

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
      isAnomaly: false,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, options.maxRequests - record.count);
  const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);

  // Anomaly detection: Flag if user exceeds 2.5x the normal rate window
  const isAnomaly = record.count > options.maxRequests * 2.5;
  if (isAnomaly) {
    const currentFlags = anomalyLog.get(identifier) || 0;
    anomalyLog.set(identifier, currentFlags + 1);
  }

  return {
    allowed: record.count <= options.maxRequests,
    remaining,
    resetInSeconds,
    isAnomaly,
  };
}

/**
 * Clean expired keys periodically
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
