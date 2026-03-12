import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDemographicSocialSummary } from '../controllers/demographicSocialController.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', authorize('admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'), getDemographicSocialSummary);

export default router;
