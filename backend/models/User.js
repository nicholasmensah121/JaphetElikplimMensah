const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      maxlength: [100, 'First name cannot exceed 100 characters'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      maxlength: [100, 'Last name cannot exceed 100 characters'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email',
      ],
      index: true, // Index for fast lookups
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    address: {
      street: {
        type: String,
        maxlength: [255, 'Street cannot exceed 255 characters'],
      },
      city: {
        type: String,
        maxlength: [100, 'City cannot exceed 100 characters'],
      },
      state: {
        type: String,
        maxlength: [100, 'State cannot exceed 100 characters'],
      },
      zip: {
        type: String,
        maxlength: [20, 'Zip code cannot exceed 20 characters'],
      },
      country: {
        type: String,
        maxlength: [100, 'Country cannot exceed 100 characters'],
      },
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: 'Role must be either customer or admin',
      },
      default: 'customer',
      index: true, // Index for admin queries
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
