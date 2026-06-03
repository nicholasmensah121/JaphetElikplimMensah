const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const createRateLimit = require('../middleware/rateLimit');
const config = require('../config/config');

// Public routes
router.post(
  '/register',
  createRateLimit({
    keyPrefix: 'auth-register',
    maxRequests: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many registration attempts. Please try again later.',
  }),
  authController.register
);
router.post(
  '/login',
  createRateLimit({
    keyPrefix: 'auth-login',
    maxRequests: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many login attempts. Please try again later.',
  }),
  authController.login
);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
