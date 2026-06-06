// Database Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gentlemen-parlor';

// Server Configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// JWT Configuration
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
let JWT_SECRET = process.env.JWT_SECRET;

// In development, generate a temporary JWT secret if none provided to avoid
// crashing the server during local testing. Do NOT use this in production.
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV !== 'production') {
    const crypto = require('crypto');
    JWT_SECRET = crypto.randomBytes(48).toString('hex');
    // eslint-disable-next-line no-console
    console.warn('Warning: JWT_SECRET not provided. Using a temporary development secret.');
  } else {
    throw new Error('JWT_SECRET must be set to a strong value with at least 32 characters');
  }
}

// CORS Configuration
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

const CORS_ORIGINS = (process.env.CORS_ORIGINS || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Cookie Configuration
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'gp_auth';
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : IS_PRODUCTION;
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || (IS_PRODUCTION ? 'strict' : 'lax');

// Rate Limit Configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const AUTH_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10);
const CONTACT_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.CONTACT_RATE_LIMIT_MAX_REQUESTS || '5', 10);
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED
  ? process.env.RATE_LIMIT_ENABLED.toLowerCase() === 'true'
  : IS_PRODUCTION;

// Stripe Configuration
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;

module.exports = {
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRE,
  PORT,
  NODE_ENV,
  IS_PRODUCTION,
  CORS_ORIGINS,
  AUTH_COOKIE_NAME,
  COOKIE_SECURE,
  COOKIE_SAME_SITE,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  AUTH_RATE_LIMIT_MAX_REQUESTS,
  CONTACT_RATE_LIMIT_MAX_REQUESTS,
  STRIPE_API_KEY,
};
