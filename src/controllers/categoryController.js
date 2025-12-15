import Category from '../models/Category.js';
import Task from '../models/Task.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

// @desc    Get all user categories
// @route   GET /api/categories
// @access  Private
export const getCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: { categories }
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private
export const createCategory = catchAsync(async (req, res, next) => {
  const { name, color } = req.body;

  const category = await Category.create({
    name,
    color,
    user: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ApiError('Category not found', 404, 'NOT_FOUND'));
  }

  if (category.user.toString() !== req.user.id) {
    return next(new ApiError('Not authorized', 403, 'FORBIDDEN'));
  }

  // Set category to null for all tasks with this category
  await Task.updateMany(
    { category: req.params.id },
    { $set: { category: null } }
  );

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});