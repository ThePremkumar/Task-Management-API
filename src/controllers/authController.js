import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Validate password strength
  if (!/\d/.test(password)) {
    return next(new ApiError('Password must contain at least one number', 400, 'VALIDATION_ERROR'));
  }

  const user = await User.create({ username, email, password });

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError('Please provide email and password', 400, 'VALIDATION_ERROR'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new ApiError('Invalid credentials', 401, 'UNAUTHORIZED'));
  }

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = catchAsync(async (req, res, next) => {
  // In a production app, you would blacklist the token here
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});