import express from 'express';
import * as votersController from '../controllers/votersController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * Rutas de Votantes
 */

// GET all voters con paginación
router.get('/', authorize('admin', 'manager', 'operator'), validate('pagination'), votersController.getVoters);

// GET voter stats
router.get('/stats', authorize('admin', 'manager', 'operator'), votersController.getVoterStats);

// GET voter by ID
router.get('/:id', authorize('admin', 'manager', 'operator'), votersController.getVoterById);

// POST crear votante
router.post('/', authorize('admin', 'manager', 'operator'), validate('createVoter'), votersController.createVoter);

// POST importar votantes en lote
router.post('/batch/import', authorize('admin', 'manager'), votersController.importVoters);

// PUT actualizar votante
router.put('/:id', authorize('admin', 'manager', 'operator'), validate('updateVoter'), votersController.updateVoter);

// DELETE votante
router.delete('/:id', authorize('admin', 'manager'), votersController.deleteVoter);

export default router;
