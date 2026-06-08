const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const createRateLimit = require('../middleware/rateLimit');
const { validateRequest } = require('../middleware/validationRules');
const config = require('../config/config');

const authValidationRules = {
  register: () => [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('First name is required and must be between 2 and 100 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Last name is required and must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Please confirm your password')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
  ],

  login: () => [
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
};

// Public routes
router.post(
  '/register',
  createRateLimit({
    keyPrefix: 'auth-register',
    maxRequests: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many registration attempts. Please try again later.',
  }),
  authValidationRules.register(),
  validateRequest,
  authController.register
);
router.post(
  '/login',
  createRateLimit({
    keyPrefix: 'auth-login',
    maxRequests: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many login attempts. Please try again later.',
  }),
  authValidationRules.login(),
  validateRequest,
  authController.login
);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
