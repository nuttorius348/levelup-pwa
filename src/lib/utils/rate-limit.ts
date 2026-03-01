// =============================================================
// Rate Limiter — Sliding window per user
// =============================================================

/**
 * Simple in-memory rate limiter for serverless.
 * For production at scale, swap to Redis (Upstash) or Supabase Edge.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,   // 1 minute
  maxRequests: 30,
};

/**
 * Check if a request is within rate limits.
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]!;
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + config.windowMs - now,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: config.windowMs,
  };
}

/**
 * Pre-defined rate limit configs for different endpoints.
 */
export const RATE_LIMITS = {
  ai: { windowMs: 60_000, maxRequests: 10 },        // 10 AI calls/min
  xp: { windowMs: 60_000, maxRequests: 60 },         // 60 XP grants/min
  upload: { windowMs: 60_000, maxRequests: 5 },       // 5 uploads/min
  auth: { windowMs: 300_000, maxRequests: 10 },       // 10 auth attempts/5min
  general: { windowMs: 60_000, maxRequests: 100 },    // 100 requests/min
} as const;
