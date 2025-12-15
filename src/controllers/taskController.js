import Task from '../models/Task.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

// @desc    Get all user tasks with filters
// @route   GET /api/tasks
// @access  Private
export const getTasks = catchAsync(async (req, res, next) => {
  const { status, priority, category, search, page = 1, limit = 10, sortBy = 'createdAt:desc' } = req.query;

  const query = { user: req.user.id };

  if (status) query.status = { $in: status.split(',') };
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (req.query['dueDate[gte]'] || req.query['dueDate[lte]']) {
    query.dueDate = {};
    if (req.query['dueDate[gte]']) query.dueDate.$gte = new Date(req.query['dueDate[gte]']);
    if (req.query['dueDate[lte]']) query.dueDate.$lte = new Date(req.query['dueDate[lte]']);
  }

  const [sortField, sortOrder] = sortBy.split(':');
  const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

  const skip = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate('category', 'name color')
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Task.countDocuments(query);

  const stats = await Task.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const statsObj = { todo: 0, 'in-progress': 0, completed: 0, archived: 0 };
  stats.forEach(s => statsObj[s._id] = s.count);

  res.status(200).json({
    success: true,
    data: {
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats: {
        todo: statsObj.todo,
        inProgress: statsObj['in-progress'],
        completed: statsObj.completed,
        archived: statsObj.archived
      }
    }
  });
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = catchAsync(async (req, res, next) => {
  const { title, description, priority, dueDate, category, tags, estimatedHours } = req.body;

  if (!title || !priority) {
    return next(new ApiError('Title and priority are required', 400, 'VALIDATION_ERROR'));
  }

  if (!['low', 'medium', 'high'].includes(priority)) {
    return next(new ApiError('Invalid priority value', 400, 'VALIDATION_ERROR'));
  }

  if (dueDate && new Date(dueDate) < new Date()) {
    return next(new ApiError('Due date must be in the future', 400, 'VALIDATION_ERROR'));
  }

  let categoryDoc = null;

  if (category) {
    categoryDoc = await Category.findById(category);
    if (!categoryDoc) return next(new ApiError('Category not found', 404, 'NOT_FOUND'));
    // Optional: remove user check if categories are global
    if (categoryDoc.user && categoryDoc.user.toString() !== req.user.id) {
      return next(new ApiError('Not authorized for this category', 403, 'FORBIDDEN'));
    }
    categoryDoc.taskCount = (categoryDoc.taskCount || 0) + 1;
    await categoryDoc.save();
  }

  const task = await Task.create({
    title,
    description,
    priority,
    dueDate,
    category,
    tags,
    estimatedHours,
    user: req.user.id
  });

  await task.populate('category', 'name color');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task }
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('category', 'name color');
  if (!task) return next(new ApiError('Task not found', 404, 'NOT_FOUND'));
  if (task.user.toString() !== req.user.id && !task.sharedWith.includes(req.user.id)) {
    return next(new ApiError('Not authorized to access this task', 403, 'FORBIDDEN'));
  }

  res.status(200).json({ success: true, data: { task } });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = catchAsync(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404, 'NOT_FOUND'));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorized', 403, 'FORBIDDEN'));

  if (req.body.category && req.body.category !== task.category?.toString()) {
    if (task.category) await Category.findByIdAndUpdate(task.category, { $inc: { taskCount: -1 } });

    const newCategory = await Category.findById(req.body.category);
    if (!newCategory) return next(new ApiError('Category not found', 404, 'NOT_FOUND'));
    if (newCategory.user && newCategory.user.toString() !== req.user.id) {
      return next(new ApiError('Not authorized for this category', 403, 'FORBIDDEN'));
    }
    await Category.findByIdAndUpdate(req.body.category, { $inc: { taskCount: 1 } });
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('category', 'name color');

  res.status(200).json({ success: true, message: 'Task updated successfully', data: { task } });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404, 'NOT_FOUND'));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorized', 403, 'FORBIDDEN'));

  if (task.category) await Category.findByIdAndUpdate(task.category, { $inc: { taskCount: -1 } });
  await task.deleteOne();

  res.status(204).json({ success: true, message: 'Task deleted successfully' });
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ['todo', 'in-progress', 'completed', 'archived'];
  if (!allowedStatuses.includes(status)) return next(new ApiError('Invalid status', 400, 'VALIDATION_ERROR'));

  const task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404, 'NOT_FOUND'));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorized', 403, 'FORBIDDEN'));

  const allowedTransitions = {
    'todo': ['in-progress', 'archived'],
    'in-progress': ['todo', 'completed', 'archived'],
    'completed': ['todo', 'archived'],
    'archived': ['todo']
  };

  if (!allowedTransitions[task.status].includes(status)) {
    return next(new ApiError(`Cannot transition from ${task.status} to ${status}`, 400, 'INVALID_TRANSITION'));
  }

  task.status = status;
  task.completedAt = status === 'completed' ? new Date() : null;
  await task.save();

  res.status(200).json({ success: true, message: 'Task status updated', data: { task } });
});

// @desc    Update task priority
// @route   PUT /api/tasks/:id/priority
// @access  Private
export const updateTaskPriority = catchAsync(async (req, res, next) => {
  const { priority } = req.body;
  if (!['low', 'medium', 'high'].includes(priority)) return next(new ApiError('Invalid priority value', 400, 'VALIDATION_ERROR'));

  const task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404, 'NOT_FOUND'));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorized', 403, 'FORBIDDEN'));

  task.priority = priority;
  await task.save();

  res.status(200).json({ success: true, message: 'Task priority updated', data: { task } });
});

// @desc    Share task with another user
// @route   POST /api/tasks/:id/share
// @access  Private
export const shareTask = catchAsync(async (req, res, next) => {
  const { userEmail } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) return next(new ApiError('Task not found', 404, 'NOT_FOUND'));
  if (task.user.toString() !== req.user.id) return next(new ApiError('Not authorized', 403, 'FORBIDDEN'));

  const userToShare = await User.findOne({ email: userEmail });
  if (!userToShare) return next(new ApiError('User not found', 404, 'NOT_FOUND'));

  if (!task.sharedWith.includes(userToShare._id)) {
    task.sharedWith.push(userToShare._id);
    await task.save();
  }

  res.status(200).json({ success: true, message: 'Task shared successfully', data: { task } });
});

// @desc    Get shared tasks
// @route   GET /api/tasks/shared
// @access  Private
export const getSharedTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ sharedWith: req.user.id })
    .populate('category', 'name color')
    .populate('user', 'username email');

  res.status(200).json({ success: true, data: { tasks } });
});
