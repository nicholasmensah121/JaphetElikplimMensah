const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for user-specific queries
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          maxlength: [255, 'Product name too long'],
        },
        price: {
          type: Number,
          min: [0, 'Price cannot be negative'],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
          max: [999, 'Quantity cannot exceed 999'],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
      validate: {
        validator: (value) => value >= 0,
        message: 'Total amount must be non-negative',
      },
    },
    shippingAddress: {
      street: {
        type: String,
        maxlength: [255, 'Street too long'],
      },
      city: {
        type: String,
        maxlength: [100, 'City name too long'],
      },
      state: {
        type: String,
        maxlength: [100, 'State name too long'],
      },
      zip: {
        type: String,
        maxlength: [20, 'Zip code too long'],
      },
      country: {
        type: String,
        maxlength: [100, 'Country name too long'],
      },
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['card', 'paypal', 'bank_transfer'],
        message: 'Invalid payment method',
      },
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'cancelled'],
        message: 'Invalid payment status',
      },
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        message: 'Invalid order status',
      },
      default: 'pending',
      index: true,
    },
    trackingNumber: {
      type: String,
      maxlength: [100, 'Tracking number too long'],
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes too long'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
