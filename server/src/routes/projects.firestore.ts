import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
} from '../controllers/projects.firestore.js';
import { protect } from '../middleware/auth.firestore.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Member management routes
router
  .route('/:id/members')
  .post(addProjectMember);

router
  .route('/:id/members/:userId')
  .delete(removeProjectMember);

export default router;