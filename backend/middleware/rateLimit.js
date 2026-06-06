const config = require('../config/config');

const buckets = new Map();

const cleanupExpiredEntries = (now) => {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

const getClientKey = (req, prefix) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const source = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown');

  return `${prefix}:${source}`;
};

const createRateLimit = ({
  windowMs = config.RATE_LIMIT_WINDOW_MS,
  maxRequests = config.RATE_LIMIT_MAX_REQUESTS,
  keyPrefix = 'global',
  message = 'Too many requests. Please try again later.',
} = {}) => {
  return (req, res, next) => {
    if (!config.RATE_LIMIT_ENABLED) {
      return next();
    }

    const now = Date.now();
    cleanupExpiredEntries(now);

    const key = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (current.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
      });
    }

    current.count += 1;
    return next();
  };
};

module.exports = createRateLimit;
