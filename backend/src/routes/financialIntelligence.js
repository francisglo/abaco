import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getFinancialTerritorialSummary } from '../controllers/financialIntelligenceController.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getFinancialTerritorialSummary);

export default router;
