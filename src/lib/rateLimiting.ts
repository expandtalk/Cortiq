/**
 * Rate Limiting Module
 * Implements rate limiting to prevent abuse and DoS attacks
 * Supports different limits for authenticated vs. anonymous users
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit data
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimitStore {
  private store: Map<string, RequestRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private windowMs: number) {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Increment request count for a key
   * Returns true if within limit, false if exceeded
   */
  increment(key: string, limit: number): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    // Check if window has expired
    if (!record || record.resetTime <= now) {
      // Create new window
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Increment count
    record.count++;

    // Check if exceeded limit
    if (record.count > limit) {
      return false;
    }

    return true;
  }

  /**
   * Get current count and reset time for a key
   */
  get(key: string): { count: number; resetTime: number; remaining: number } | null {
    const record = this.store.get(key);
    if (!record) {
      return null;
    }

    const now = Date.now();
    if (record.resetTime <= now) {
      // Window has expired
      return null;
    }

    return {
      count: record.count,
      resetTime: record.resetTime,
      remaining: Math.max(0, record.resetTime - now),
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, record] of this.store.entries()) {
      if (record.resetTime <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Shutdown cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Create a rate limiting middleware for Express-like frameworks
 */
export function createRateLimiter(config: RateLimitConfig) {
  const store = new RateLimitStore(config.windowMs);

  return (req: any, res: any, next: any) => {
    // Skip check if specified
    if (config.skip && config.skip(req)) {
      return next();
    }

    // Generate key based on IP or user ID
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';

    // Check rate limit
    const isAllowed = store.increment(key, config.maxRequests);

    // Get current state for headers
    const state = store.get(key);

    // Set rate limit headers
    if (res.set) {
      res.set('X-RateLimit-Limit', config.maxRequests.toString());
      res.set('X-RateLimit-Remaining',
        state ? Math.max(0, config.maxRequests - state.count).toString() :
        config.maxRequests.toString());
      res.set('X-RateLimit-Reset',
        state ? Math.ceil(state.resetTime / 1000).toString() :
        Math.ceil((Date.now() + config.windowMs) / 1000).toString());
    }

    if (!isAllowed) {
      // Return 429 Too Many Requests
      const resetTime = state ? Math.ceil(state.resetTime / 1000) : Date.now() + config.windowMs;
      const retryAfter = state ? Math.ceil((state.resetTime - Date.now()) / 1000) : Math.ceil(config.windowMs / 1000);

      if (res.status) {
        res.status(429).set('Retry-After', retryAfter.toString());
        if (res.json) {
          res.json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Please try again after ${retryAfter} seconds.`,
            retryAfter,
            resetTime,
          });
        } else {
          res.send('Too Many Requests');
        }
      }
      return;
    }

    next();
  };
}

/**
 * Predefined rate limiting configurations
 */
export const RateLimitPresets = {
  /**
   * Public API rate limiting
   * 100 requests per minute per IP
   */
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  /**
   * Authenticated API rate limiting
   * 1,000 requests per minute per user
   */
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },

  /**
   * Tracking endpoint rate limiting
   * 10,000 events per minute per site
   */
  tracking: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10000,
  },

  /**
   * Login rate limiting
   * 5 attempts per 15 minutes per IP
   */
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },

  /**
   * Email sending rate limiting
   * 10 emails per hour per user
   */
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },

  /**
   * File upload rate limiting
   * 10 uploads per 10 minutes per user
   */
  upload: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
  },

  /**
   * Strict rate limiting for sensitive operations
   * 5 requests per minute per user
   */
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
};

/**
 * Key generator function for extracting IP address
 */
export function getIpFromRequest(req: any): string {
  return req.ip ||
         req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.connection?.remoteAddress ||
         'unknown';
}

/**
 * Key generator function for authenticated users
 */
export function getUserKeyFromRequest(req: any): string {
  // If user is authenticated, use user ID, otherwise use IP
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${getIpFromRequest(req)}`;
}

/**
 * Create a rate limiter specifically for tracking endpoints
 */
export function createTrackingRateLimiter(siteIdExtractor: (req: any) => string) {
  return createRateLimiter({
    windowMs: RateLimitPresets.tracking.windowMs,
    maxRequests: RateLimitPresets.tracking.maxRequests,
    keyGenerator: (req: any) => {
      const siteId = siteIdExtractor(req);
      return `tracking:${siteId || 'unknown'}`;
    },
  });
}

/**
 * Create a rate limiter for login attempts
 */
export function createLoginRateLimiter() {
  return createRateLimiter({
    windowMs: RateLimitPresets.login.windowMs,
    maxRequests: RateLimitPresets.login.maxRequests,
    keyGenerator: (req: any) => `login:${getIpFromRequest(req)}`,
  });
}

/**
 * Create a rate limiter for API endpoints
 */
export function createApiRateLimiter(authenticated: boolean = false) {
  const config = authenticated ? RateLimitPresets.authenticated : RateLimitPresets.public;

  return createRateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    keyGenerator: authenticated ? getUserKeyFromRequest : getIpFromRequest,
  });
}

/**
 * Simple in-memory throttle for synchronous operations
 * Useful for limiting rapid-fire requests within a single request handler
 */
export class ThrottleManager {
  private lastCall: Map<string, number> = new Map();

  /**
   * Check if action is allowed (returns true if enough time has passed)
   */
  isAllowed(key: string, minimumIntervalMs: number): boolean {
    const now = Date.now();
    const lastTime = this.lastCall.get(key) || 0;

    if (now - lastTime >= minimumIntervalMs) {
      this.lastCall.set(key, now);
      return true;
    }

    return false;
  }

  /**
   * Get time until next allowed call
   */
  getRetryAfterMs(key: string, minimumIntervalMs: number): number {
    const lastTime = this.lastCall.get(key) || 0;
    const nextAllowed = lastTime + minimumIntervalMs;
    const now = Date.now();

    return Math.max(0, nextAllowed - now);
  }

  /**
   * Clear all throttle data
   */
  clear(): void {
    this.lastCall.clear();
  }
}

export default createRateLimiter;
