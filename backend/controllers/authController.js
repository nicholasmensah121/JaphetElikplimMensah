const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookies');

// SECURITY: Validate password strength
const validatePasswordStrength = (password) => {
  // Must contain: uppercase, lowercase, number, special character, and be at least 8 chars
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&\-_#]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumber) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character (@$!%*?&\\-_#)' };
  }

  return { valid: true };
};

const buildAuthResponse = (user, token, message) => ({
  success: true,
  message,
  token,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  },
});

// Register User
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!firstName || !lastName || !normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // SECURITY: Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      password,
    });

    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });
    setAuthCookie(res, token);

    res.status(201).json(buildAuthResponse(user, token, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });
    setAuthCookie(res, token);

    res.status(200).json(buildAuthResponse(user, token, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

// Logout User
exports.logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Get User Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Update User Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};
