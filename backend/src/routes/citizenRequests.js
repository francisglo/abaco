import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getCitizenRequests,
  getRequestById,
  createCitizenRequest,
  updateCitizenRequest,
  deleteCitizenRequest,
  addCaseTracking,
  getCaseTracking,
  getRequestStats,
  getRequestsByUrgency
} from '../controllers/citizenRequestsController.js';

const router = express.Router();

router.use(authenticate);

// Solicitudes ciudadanas
router.get('/', authorize('admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'), validate('pagination'), getCitizenRequests);
router.get('/urgent/priority', authorize('admin', 'manager', 'operator', 'auditor'), getRequestsByUrgency);
router.get('/stats', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getRequestStats);
router.get('/:id', authorize('admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'), getRequestById);
router.post('/', authorize('admin', 'manager', 'operator', 'visitor'), validate('createCitizenRequest'), createCitizenRequest);
router.put('/:id', authorize('admin', 'manager', 'operator'), validate('updateCitizenRequest'), updateCitizenRequest);
router.delete('/:id', authorize('admin', 'manager'), deleteCitizenRequest);

// Seguimiento de casos
router.post('/:requestId/tracking', authorize('admin', 'manager', 'operator'), validate('addCaseTracking'), addCaseTracking);
router.get('/:requestId/tracking', authorize('admin', 'manager', 'operator', 'auditor'), getCaseTracking);

export default router;
