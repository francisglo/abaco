import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { globalSearch } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), validate('globalSearch'), globalSearch);

export default router;
