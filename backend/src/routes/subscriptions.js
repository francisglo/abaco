import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getPlans,
  createPlan,
  updatePlan,
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription,
  recordPayment,
  getRevenueMetrics
} from '../controllers/subscriptionsController.js';

const router = express.Router();

router.use(authenticate);

// Planes
router.get('/plans', getPlans);
router.post('/plans', authorize('admin'), validate('createSubscriptionPlan'), createPlan);
router.put('/plans/:id', authorize('admin'), validate('updateSubscriptionPlan'), updatePlan);

// Métricas
router.get('/metrics/revenue', authorize('admin', 'auditor'), getRevenueMetrics);

// Suscripciones
router.get('/', validate('filterSubscriptions'), getSubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/', authorize('admin', 'operator'), validate('createSubscription'), createSubscription);
router.put('/:id', authorize('admin', 'operator'), validate('updateSubscription'), updateSubscription);
router.post('/:id/cancel', authorize('admin'), validate('cancelSubscription'), cancelSubscription);
router.post('/:id/renew', authorize('admin'), validate('renewSubscription'), renewSubscription);

// Pagos
router.post('/:id/payments', authorize('admin', 'operator'), validate('recordSubscriptionPayment'), recordPayment);

export default router;
