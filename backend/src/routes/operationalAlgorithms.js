import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getZonePrioritization,
  getBrigadeAssignmentPlan,
  getTerritorialRoutingPlan,
  getSemaphoreAlerts,
  getOperationalLoadBalance,
  evaluatePermissionRules,
  getRulesCatalog,
  getAdvancedAlgorithmsCatalog,
  runAdvancedAlgorithmsSuite,
  getAdvancedActivationLogs,
  getPredictiveModelsCatalog,
  runPredictiveModelsSuite,
  getOptimizationModelsCatalog,
  runOptimizationModelsSuite
} from '../controllers/operationalAlgorithmsController.js';
import {
  runWhatIfSimulation,
  getActionCenterRecommendations,
  getEarlyAlerts,
  createDecisionLogEntry,
  getDecisionLogEntries,
  updateDecisionLogEntry,
  getTemporalComparison,
  getDailyOperationsBoard,
  getOperationalDataQualityReport,
  triggerEarlyAlertsNotifications,
  getEarlyAlertsNotificationStatus
} from '../controllers/operationalIntelligenceController.js';

const router = express.Router();

router.use(authenticate);

router.get('/zone-prioritization', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getZonePrioritization);
router.post('/brigade-assignment', authorize('admin', 'manager', 'operator'), getBrigadeAssignmentPlan);
router.get('/territorial-routing', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getTerritorialRoutingPlan);
router.get('/semaphore-alerts', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getSemaphoreAlerts);
router.get('/load-balance', authorize('admin', 'manager', 'operator', 'auditor'), getOperationalLoadBalance);
router.get('/rules-engine/catalog', authorize('admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'), getRulesCatalog);
router.post('/rules-engine/evaluate', authorize('admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'), evaluatePermissionRules);
router.get('/advanced-suite/catalog', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getAdvancedAlgorithmsCatalog);
router.get('/advanced-suite/run', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), runAdvancedAlgorithmsSuite);
router.get('/advanced-suite/activation-logs', authorize('admin', 'manager', 'auditor', 'viewer'), getAdvancedActivationLogs);
router.get('/predictive-models/catalog', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getPredictiveModelsCatalog);
router.get('/predictive-models/run', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), runPredictiveModelsSuite);
router.get('/optimization-models/catalog', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getOptimizationModelsCatalog);
router.get('/optimization-models/run', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), runOptimizationModelsSuite);
router.get('/what-if/simulate', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), runWhatIfSimulation);
router.get('/action-center/recommendations', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getActionCenterRecommendations);
router.get('/early-alerts', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getEarlyAlerts);
router.get('/early-alerts/notify/status', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getEarlyAlertsNotificationStatus);
router.post('/early-alerts/notify', authorize('admin', 'manager', 'operator'), triggerEarlyAlertsNotifications);
router.get('/decision-log', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getDecisionLogEntries);
router.post('/decision-log', authorize('admin', 'manager', 'operator'), createDecisionLogEntry);
router.patch('/decision-log/:id', authorize('admin', 'manager', 'operator'), updateDecisionLogEntry);
router.get('/temporal-comparison', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getTemporalComparison);
router.get('/daily-operations/board', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getDailyOperationsBoard);
router.get('/data-quality/report', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getOperationalDataQualityReport);

export default router;
