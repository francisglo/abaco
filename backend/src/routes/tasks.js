import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} from '../controllers/tasksController.js';

const router = express.Router();

// Middleware de autenticación
router.use(authenticate);

// GET /api/tasks - Listar tareas
router.get('/', authorize('admin', 'manager', 'operator'), validate('pagination'), getTasks);

// GET /api/tasks/stats - Estadísticas de tareas
router.get('/stats', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getTaskStats);

// GET /api/tasks/:id - Obtener tarea por ID
router.get('/:id', authorize('admin', 'manager', 'operator'), getTaskById);

// POST /api/tasks - Crear tarea
router.post('/', authorize('admin', 'manager', 'operator'), validate('createTask'), createTask);

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', authorize('admin', 'manager', 'operator'), validate('updateTask'), updateTask);

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

export default router;
