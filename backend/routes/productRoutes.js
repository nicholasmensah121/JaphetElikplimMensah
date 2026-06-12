const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');
const { productValidationRules, validateRequest } = require('../middleware/validationRules');
const createRateLimit = require('../middleware/rateLimit');
const config = require('../config/config');

// Rate limiting for public endpoints
const publicRateLimit = createRateLimit({
  keyPrefix: 'products-public',
  maxRequests: 300, // Higher limit for read operations
  message: 'Too many requests. Please try again later.',
});

// Public routes
router.get('/', publicRateLimit, productValidationRules.searchProducts(), validateRequest, productController.getAllProducts);
router.get('/:id', publicRateLimit, productValidationRules.getProductById(), validateRequest, productController.getProductById);

// Protected routes
router.post('/:id/reviews', authenticate, productValidationRules.addReview(), validateRequest, productController.addReview);

// Admin routes
router.post('/', authenticate, authorize('admin'), productValidationRules.createProduct(), validateRequest, productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), productValidationRules.updateProduct(), validateRequest, productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router;
