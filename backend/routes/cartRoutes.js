const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const cartController = require('../controllers/cartController');
const { cartValidationRules, validateRequest } = require('../middleware/validationRules');

// All cart routes require authentication
router.get('/', authenticate, cartController.getCart);
router.post('/add', authenticate, cartValidationRules.addToCart(), validateRequest, cartController.addToCart);
router.put('/update/:productId', authenticate, cartValidationRules.updateCartItem(), validateRequest, cartController.updateCartItem);
router.delete('/remove/:productId', authenticate, cartValidationRules.removeFromCart(), validateRequest, cartController.removeFromCart);
router.delete('/clear', authenticate, cartController.clearCart);

module.exports = router;
