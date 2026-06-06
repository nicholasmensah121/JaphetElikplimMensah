const Cart = require('../models/Cart');
const Product = require('../models/Product');

const buildProductLookup = ({ productId, productSku, productName }) => {
  if (productId) {
    return { _id: productId };
  }

  if (productSku) {
    return { sku: productSku };
  }

  if (productName) {
    return { name: productName };
  }

  return null;
};

const recalculateCart = async (cart) => {
  await cart.populate('items.productId');
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce((sum, item) => {
    const itemPrice = item.productId?.price || 0;
    return sum + itemPrice * item.quantity;
  }, 0);
};

// Get Cart
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId }).populate(
      'items.productId'
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Add to Cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, productSku, productName, quantity } = req.body;

    const productLookup = buildProductLookup({ productId, productSku, productName });

    if (!productLookup) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product ID, SKU, or name',
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const product = await Product.findOne(productLookup);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      cart = await Cart.create({
        userId: req.userId,
        items: [{ productId: product._id, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === product._id.toString()
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId: product._id, quantity });
      }
    }

    await recalculateCart(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Remove from Cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await recalculateCart(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Update Cart Item Quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
      });
    }

    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart',
      });
    }

    item.quantity = quantity;
    await recalculateCart(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

// Clear Cart
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ userId: req.userId });

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
};
