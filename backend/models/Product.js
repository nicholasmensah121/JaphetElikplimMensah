const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      maxlength: [255, 'Product name cannot exceed 255 characters'],
      trim: true,
      index: true, // Index for search
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: (value) => value >= 0,
        message: 'Price must be a non-negative number',
      },
    },
    category: {
      type: String,
      enum: [
        'Formal Wear',
        'Business Wear',
        'Footwear',
        'Accessories',
        'Casual Wear',
      ],
      required: [true, 'Please provide a category'],
      index: true, // Index for category filtering
    },
    image: {
      type: String,
      required: [true, 'Please provide an image'],
    },
    images: [
      {
        type: String,
        maxlength: [500, 'Image URL too long'],
      },
    ],
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        userName: {
          type: String,
          maxlength: [100, 'Reviewer name too long'],
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: [1000, 'Review comment too long'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sku: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: [50, 'SKU too long'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
