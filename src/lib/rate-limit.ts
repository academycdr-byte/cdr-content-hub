const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs = 60_000, max = 30 } = options;

  return {
    check: (identifier: string): { success: boolean; remaining: number } => {
      const now = Date.now();
      const entry = rateLimitMap.get(identifier);

      if (!entry || now > entry.resetAt) {
        rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: max - 1 };
      }

      if (entry.count >= max) {
        return { success: false, remaining: 0 };
      }

      entry.count++;
      return { success: true, remaining: max - entry.count };
    },
  };
}

// Pre-configured limiters
export const aiLimiter = rateLimit({ windowMs: 60_000, max: 20 });
export const syncLimiter = rateLimit({ windowMs: 60_000, max: 10 });
