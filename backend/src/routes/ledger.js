import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  appendLedgerBlock,
  getLedgerBlocks,
  getLedgerBlockDecrypted,
  verifyLedgerIntegrity,
  anchorLatestLedgerBlock,
  getLedgerAnchorStatus,
  anchorPendingLedgerBlocks
} from '../controllers/ledgerController.js';
import { getLedgerAnchorSchedulerMetrics } from '../services/ledgerAnchorScheduler.js';

const router = express.Router();

router.use(authenticate);

router.get('/blocks', authorize('admin', 'manager', 'operator', 'auditor', 'viewer', 'campaign_manager', 'visitor', 'security_monitor'), getLedgerBlocks);
router.get('/verify', authorize('admin', 'manager', 'auditor', 'security_monitor'), verifyLedgerIntegrity);
router.get('/anchor-status', authorize('admin', 'manager', 'auditor', 'security_monitor'), getLedgerAnchorStatus);
router.get('/anchor-metrics', authorize('admin', 'manager', 'auditor', 'security_monitor'), (_req, res) => {
  res.json({
    scheduler: getLedgerAnchorSchedulerMetrics()
  });
});
router.post('/anchor-latest', authorize('admin', 'manager', 'auditor', 'security_monitor'), anchorLatestLedgerBlock);
router.post('/anchor-pending', authorize('admin', 'manager', 'auditor', 'security_monitor'), anchorPendingLedgerBlocks);
router.get('/blocks/:blockId/decrypt', authorize('admin', 'manager', 'auditor', 'security_monitor'), getLedgerBlockDecrypted);
router.post('/blocks', authorize('admin', 'manager', 'operator', 'auditor', 'campaign_manager', 'security_monitor'), appendLedgerBlock);

export default router;
