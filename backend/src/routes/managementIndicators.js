import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getGoals,
  createGoal,
  updateGoalProgress,
  getProjects,
  createProject,
  updateProjectStatus,
  addMilestone,
  completeMilestone,
  getTerritorialIndicators,
  recordIndicator,
  getManagementStats,
  getImpactAnalysis
} from '../controllers/managementIndicatorsController.js';

const router = express.Router();

router.use(authenticate);

// Metas
router.get('/goals', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), validate('pagination'), getGoals);
router.post('/goals', authorize('admin', 'manager', 'operator'), validate('createGoal'), createGoal);
router.put('/goals/:goalId/progress', authorize('admin', 'manager', 'operator'), validate('updateGoalProgress'), updateGoalProgress);

// Proyectos
router.get('/projects', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), validate('pagination'), getProjects);
router.post('/projects', authorize('admin', 'manager', 'operator'), validate('createProject'), createProject);
router.put('/projects/:projectId', authorize('admin', 'manager', 'operator'), validate('updateProjectStatus'), updateProjectStatus);
router.post('/projects/:projectId/milestones', authorize('admin', 'manager', 'operator'), validate('addMilestone'), addMilestone);
router.put('/milestones/:milestoneId/complete', authorize('admin', 'manager', 'operator'), validate('completeMilestone'), completeMilestone);

// Indicadores territoriales
router.get('/indicators', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getTerritorialIndicators);
router.post('/indicators', authorize('admin', 'manager', 'operator'), validate('recordIndicator'), recordIndicator);

// Estadísticas
router.get('/stats/:zoneId', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getManagementStats);
router.get('/stats', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getManagementStats);
router.get('/impact/:projectId', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getImpactAnalysis);

export default router;
