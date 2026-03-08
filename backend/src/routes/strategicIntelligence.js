import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  compareZones,
  getTerritorialTrends,
  analyzePoliticalRisks,
  createStrategicAlert,
  getActiveAlerts,
  acknowledgeAlert,
  getSocialLeaders,
  recordSocialLeader,
  getCommitments,
  recordCommitment,
  completeCommitment
} from '../controllers/strategicIntelligenceController.js';

const router = express.Router();

router.use(authenticate);

// Análisis comparativo
router.post('/compare-zones', authorize('admin', 'manager', 'auditor'), validate('compareZones'), compareZones);

// Tendencias territoriales
router.get('/trends', authorize('admin', 'manager', 'auditor', 'viewer'), validate('pagination'), getTerritorialTrends);

// Análisis de riesgos políticos
router.get('/risk-analysis/:zoneId', authorize('admin', 'manager', 'auditor'), validate('analyzePoliticalRisks'), analyzePoliticalRisks);

// Alertas estratégicas
router.get('/alerts', authorize('admin', 'manager', 'auditor'), getActiveAlerts);
router.post('/alerts', authorize('admin', 'manager', 'auditor'), validate('createStrategicAlert'), createStrategicAlert);
router.put('/alerts/:alertId/acknowledge', authorize('admin', 'manager', 'auditor'), validate('acknowledgeAlert'), acknowledgeAlert);

// Líderes sociales
router.get('/social-leaders', authorize('admin', 'manager', 'auditor', 'viewer'), validate('pagination'), getSocialLeaders);
router.post('/social-leaders', authorize('admin', 'manager', 'auditor'), validate('recordSocialLeader'), recordSocialLeader);

// Compromisos
router.get('/commitments', authorize('admin', 'manager', 'auditor', 'viewer'), validate('pagination'), getCommitments);
router.post('/commitments', authorize('admin', 'manager', 'auditor'), validate('recordCommitment'), recordCommitment);
router.put('/commitments/:commitmentId/complete', authorize('admin', 'manager', 'auditor'), validate('completeCommitment'), completeCommitment);

export default router;
