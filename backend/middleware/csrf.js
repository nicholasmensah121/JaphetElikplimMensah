const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

// SECURITY: CSRF Token Management with Redis Storage
// Tokens are stored in Redis with automatic expiration (TTL)
const TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

/**
 * Generate a new CSRF token for a session
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<string>} CSRF token
 */
const generateCSRFToken = async (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.error('Redis client unavailable');
      throw new Error('Redis client unavailable');
    }
    // Store token with automatic expiration
    const result = await redis.setex(`csrf:${token}`, TOKEN_EXPIRY, sessionId);
    if (result === 'OK' || result === 1) {
      return token;
    }
    throw new Error('Failed to store CSRF token');
  } catch (error) {
    console.warn('Error storing CSRF token:', error.message);
    // Return token anyway - it will be re-validated on next use
    // This ensures the app doesn't break when Redis is down
    console.log('Returning token anyway for resilience:', token.substring(0, 8) + '...');
    return token;
  }
};

/**
 * Verify CSRF token
 * @param {string} token - Token to verify
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Token validity
 */
const verifyCSRFToken = async (token, sessionId) => {
  try {
    const redis = await getRedisClient();
    const storedSessionId = await redis.get(`csrf:${token}`);
    
    if (!storedSessionId) {
      return false;
    }
    
    if (storedSessionId !== sessionId) {
      return false;
    }
    
    // Delete token after verification (single-use)
    await redis.del(`csrf:${token}`);
    
    return true;
  } catch (error) {
    console.error('Error verifying CSRF token:', error.message);
    return false;
  }
};

/**
 * CSRF Protection Middleware
 * Verifies CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = (req, res, next) => {
  // Handle GET requests asynchronously
  if (req.method === 'GET') {
    return (async () => {
      try {
        const sessionId = req.userId || req.ip;
        const token = await generateCSRFToken(sessionId);
        res.locals.csrfToken = token;
        res.setHeader('X-CSRF-Token', token);
        console.log(`CSRF token generated for GET ${req.path}: ${token.substring(0, 8)}...`);

        const exposeHeaderName = 'Access-Control-Expose-Headers';
        const existingExpose = res.getHeader(exposeHeaderName);
        const exposeValue = 'X-CSRF-Token';

        if (!existingExpose) {
          res.setHeader(exposeHeaderName, exposeValue);
        } else if (Array.isArray(existingExpose)) {
          if (!existingExpose.includes(exposeValue)) {
            res.setHeader(exposeHeaderName, [...existingExpose, exposeValue]);
          }
        } else if (typeof existingExpose === 'string') {
          const headers = existingExpose.split(',').map((v) => v.trim());
          if (!headers.includes(exposeValue)) {
            res.setHeader(exposeHeaderName, `${existingExpose}, ${exposeValue}`);
          }
        }
        return next();
      } catch (error) {
        console.error('CSRF token generation error:', error.message);
        // Still allow GET requests to proceed even if token generation fails
        // This ensures the app doesn't break when Redis is down
        return next();
      }
    })();
  }

  // Handle state-changing requests asynchronously
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return (async () => {
      try {
        const headerToken = req.headers['x-csrf-token'];
        const tokenFromHeader = Array.isArray(headerToken) ? headerToken[0] : headerToken;
        const token = (req.body && req.body._csrf) || tokenFromHeader;
        const sessionId = req.userId || req.ip;

        if (!token) {
          console.warn(`CSRF token missing for ${req.method} ${req.path}`);
          return res.status(403).json({
            success: false,
            message: 'CSRF token missing',
          });
        }

        const isValid = await verifyCSRFToken(token, sessionId);
        if (!isValid) {
          console.warn(`CSRF token invalid/expired for ${req.method} ${req.path}: ${token.substring(0, 8)}...`);
          return res.status(403).json({
            success: false,
            message: 'CSRF token invalid or expired',
          });
        }

        console.log(`CSRF token verified for ${req.method} ${req.path}`);
        return next();
      } catch (error) {
        console.error('CSRF protection error:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Security validation failed',
        });
      }
    })();
  }

  next();
};

module.exports = { csrfProtection, generateCSRFToken, verifyCSRFToken };
