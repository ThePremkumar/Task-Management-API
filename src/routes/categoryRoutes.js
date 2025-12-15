import express from 'express';
import {
  getCategories,
  createCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all category routes
router.use(protect);

router.route('/')
  .get(getCategories)
  .post(createCategory);

router.delete('/:id', deleteCategory);

export default router;