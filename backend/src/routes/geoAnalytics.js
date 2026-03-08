import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getGeoStatSummary,
  getGeoDensityGrid,
  getGeoQualityReport,
  saveAnalyticsSnapshot,
  getStrategicDecisionEngine
} from '../controllers/geoAnalyticsController.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', authorize('admin', 'manager', 'auditor', 'viewer'), getGeoStatSummary);
router.get('/density-grid', authorize('admin', 'manager', 'auditor', 'viewer'), getGeoDensityGrid);
router.get('/quality-report', authorize('admin', 'manager', 'auditor', 'viewer'), getGeoQualityReport);
router.get('/decision-engine', authorize('admin', 'manager', 'auditor', 'viewer', 'operator'), getStrategicDecisionEngine);
router.post('/snapshots', authorize('admin', 'manager'), saveAnalyticsSnapshot);

export default router;
