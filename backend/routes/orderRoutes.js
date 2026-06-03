const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const { orderValidationRules, validateRequest } = require('../middleware/validationRules');

// All order routes require authentication
router.post('/', authenticate, orderValidationRules.createOrder(), validateRequest, orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/:id', authenticate, orderValidationRules.getOrderById(), validateRequest, orderController.getOrderById);
router.put('/:id/status', authenticate, authorize('admin'), orderController.updateOrderStatus);
router.put('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
