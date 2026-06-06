const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Rules for Cart Operations
 */
const cartValidationRules = {
  addToCart: () => [
    body('productId')
      .optional()
      .trim()
      .isMongoId().withMessage('Invalid product ID'),
    body('productSku')
      .optional()
      .trim()
      .matches(/^[A-Z0-9\-]+$/)
      .withMessage('Invalid product SKU'),
    body('productName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Invalid product name'),
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1, max: 999 })
      .withMessage('Quantity must be a number between 1 and 999'),    body().custom((body) => {
      if (!body.productId && !body.productSku && !body.productName) {
        throw new Error('Please provide productId, productSku, or productName');
      }
      return true;
    }),  ],

  updateCartItem: () => [
    param('productId')
      .trim()
      .isMongoId().withMessage('Invalid product ID'),
    body('quantity')
      .isInt({ min: 1, max: 999 })
      .withMessage('Quantity must be a number between 1 and 999'),
  ],

  removeFromCart: () => [
    param('productId')
      .trim()
      .isMongoId().withMessage('Invalid product ID'),
  ],
};

/**
 * Validation Rules for Order Operations
 */
const orderValidationRules = {
  createOrder: () => [
    body('paymentMethod')
      .trim()
      .notEmpty().withMessage('Payment method is required')
      .isIn(['card', 'paypal', 'bank_transfer'])
      .withMessage('Invalid payment method'),
    body('shippingAddress.street')
      .trim()
      .notEmpty().withMessage('Street is required')
      .isLength({ min: 5, max: 255 })
      .withMessage('Street must be between 5 and 255 characters'),
    body('shippingAddress.city')
      .trim()
      .notEmpty().withMessage('City is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('shippingAddress.state')
      .trim()
      .notEmpty().withMessage('State is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),
    body('shippingAddress.zip')
      .trim()
      .notEmpty().withMessage('Zip code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Zip code must be between 2 and 20 characters'),
    body('shippingAddress.country')
      .trim()
      .notEmpty().withMessage('Country is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
  ],

  getOrderById: () => [
    param('id')
      .trim()
      .isMongoId().withMessage('Invalid order ID'),
  ],

  updateOrderStatus: () => [
    param('id')
      .trim()
      .isMongoId().withMessage('Invalid order ID'),
    body('orderStatus')
      .optional()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid order status'),
    body('paymentStatus')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid payment status'),
    body('trackingNumber')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Tracking number cannot exceed 100 characters'),
  ],
};

/**
 * Validation Rules for Product Operations
 */
const productValidationRules = {
  createProduct: () => [
    body('name')
      .trim()
      .notEmpty().withMessage('Product name is required')
      .isLength({ min: 3, max: 255 })
      .withMessage('Product name must be between 3 and 255 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Description must be between 10 and 5000 characters'),
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be a positive number'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category must be between 2 and 100 characters'),
    body('sku')
      .trim()
      .notEmpty().withMessage('SKU is required')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
  ],

  updateProduct: () => [
    param('id')
      .trim()
      .isMongoId().withMessage('Invalid product ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Product name must be between 3 and 255 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
  ],

  getProductById: () => [
    param('id')
      .trim()
      .isMongoId().withMessage('Invalid product ID'),
  ],

  addReview: () => [
    param('id')
      .trim()
      .isMongoId().withMessage('Invalid product ID'),
    body('rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  ],

  searchProducts: () => [
    query('search')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search query too long'),
    query('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category filter too long'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
};

/**
 * Validation Rules for Contact Operations
 */
const contactValidationRules = {
  submitContact: () => [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail().withMessage('Invalid email address'),
    body('phone')
      .trim()
      .optional({ checkFalsy: true })
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/)
      .withMessage('Invalid phone number format'),
    body('subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Subject must be between 3 and 200 characters'),
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Message must be between 10 and 5000 characters'),
  ],
};

/**
 * Centralized error handling for validation
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.param || err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  cartValidationRules,
  orderValidationRules,
  productValidationRules,
  contactValidationRules,
  validateRequest,
};
