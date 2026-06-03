const crypto = require('crypto');

// SECURITY: CSRF Token Management
// Simple CSRF protection - in production, use express-csrf or csurf package

const csrfTokens = new Map(); // In production, use Redis
const TOKEN_EXPIRY = 1000 * 60 * 60; // 1 hour

/**
 * Generate a new CSRF token for a session
 * @param {string} sessionId - Unique session identifier
 * @returns {string} CSRF token
 */
const generateCSRFToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  csrfTokens.set(token, { sessionId, expiresAt });
  
  // Clean up expired tokens
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < Date.now()) {
      csrfTokens.delete(key);
    }
  }
  
  return token;
};

/**
 * Verify CSRF token
 * @param {string} token - Token to verify
 * @param {string} sessionId - Session ID
 * @returns {boolean} Token validity
 */
const verifyCSRFToken = (token, sessionId) => {
  const tokenData = csrfTokens.get(token);
  
  if (!tokenData) {
    return false;
  }
  
  if (tokenData.expiresAt < Date.now()) {
    csrfTokens.delete(token);
    return false;
  }
  
  if (tokenData.sessionId !== sessionId) {
    return false;
  }
  
  // Token is one-time use
  csrfTokens.delete(token);
  return true;
};

/**
 * CSRF Protection Middleware
 * Verifies CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = (req, res, next) => {
  // Generate CSRF token for GET requests
  if (req.method === 'GET') {
    const sessionId = req.userId || req.ip;
    const token = generateCSRFToken(sessionId);
    res.locals.csrfToken = token;
    return next();
  }

  // Verify CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    const sessionId = req.userId || req.ip;

    if (!token) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing',
      });
    }

    if (!verifyCSRFToken(token, sessionId)) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token invalid or expired',
      });
    }
  }

  next();
};

module.exports = { csrfProtection, generateCSRFToken, verifyCSRFToken };
