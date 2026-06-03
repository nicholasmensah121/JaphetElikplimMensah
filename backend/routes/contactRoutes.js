const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const contactController = require('../controllers/contactController');
const createRateLimit = require('../middleware/rateLimit');
const config = require('../config/config');
const { contactValidationRules, validateRequest } = require('../middleware/validationRules');

// Public routes
router.post(
  '/',
  createRateLimit({
    keyPrefix: 'contact',
    maxRequests: config.CONTACT_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many contact submissions. Please try again later.',
  }),
  contactValidationRules.submitContact(),
  validateRequest,
  contactController.submitContact
);

// Admin routes
router.get('/', authenticate, authorize('admin'), contactController.getAllContactMessages);
router.get('/:id', authenticate, authorize('admin'), contactController.getContactMessageById);
router.delete('/:id', authenticate, authorize('admin'), contactController.deleteContactMessage);

module.exports = router;
