import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} from '../controllers/usersController.js';

const router = express.Router();

// Middleware de autenticación
router.use(authenticate);

// GET /api/users - Listar usuarios (solo admin)
router.get('/', authorize('admin'), validate('pagination'), getUsers);

// GET /api/users/stats - Estadísticas de usuarios
router.get('/stats', getUserStats);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', getUserById);

// POST /api/users - Crear usuario (solo admin)
router.post('/', authorize('admin'), validate('createUser'), createUser);

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put('/:id', authorize('admin'), validate('updateUser'), updateUser);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
