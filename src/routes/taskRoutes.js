import express from 'express';
import {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
  shareTask,
  getSharedTasks
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all task routes
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.get('/shared', getSharedTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.put('/:id/status', updateTaskStatus);
router.put('/:id/priority', updateTaskPriority);
router.post('/:id/share', shareTask);

export default router;
