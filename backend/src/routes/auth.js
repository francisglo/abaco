import express from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Rutas de autenticación
 */

// Registro público
router.post('/register', validate('createUser'), authController.register);

// Login público
router.post('/login', validate('loginUser'), authController.login);

// Login/registro con Google
router.post('/google', validate('googleAuth'), authController.googleAuth);

// Rutas protegidas (requieren token)
router.get('/me', authenticate, authController.getProfile);
router.patch('/me', authenticate, authController.updateProfile);
router.delete('/me', authenticate, authController.deleteAccount);
router.post('/change-password', authenticate, validate('changePassword'), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
