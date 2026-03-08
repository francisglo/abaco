import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getZoneStats
} from '../controllers/zonesController.js';

const router = express.Router();

// Middleware de autenticación
router.use(authenticate);

// GET /api/zones - Listar zonas
router.get('/', authorize('admin', 'manager', 'operator'), validate('pagination'), getZones);

// GET /api/zones/stats - Estadísticas de zonas
router.get('/stats', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getZoneStats);

// GET /api/zones/:id - Obtener zona por ID
router.get('/:id', authorize('admin', 'manager', 'operator'), getZoneById);

// POST /api/zones - Crear zona (solo admin)
router.post('/', authorize('admin', 'manager'), validate('createZone'), createZone);

// PUT /api/zones/:id - Actualizar zona (solo admin)
router.put('/:id', authorize('admin', 'manager'), validate('updateZone'), updateZone);

// DELETE /api/zones/:id - Eliminar zona (solo admin)
router.delete('/:id', authorize('admin', 'manager'), deleteZone);

export default router;
