import bcrypt from 'bcryptjs';
import axios from 'axios';
import crypto from 'crypto';
import database from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import {
  changeFallbackPassword,
  getFallbackProfileById,
  isDbUnavailableError,
  loginFallbackUser,
  registerFallbackUser
} from '../services/authFallbackStore.js';

/**
 * Controlador de autenticación
 */

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'operator', phone, zoneId } = req.body;

  try {
    // Verificar si usuario existe
    const existing = await database.queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing) {
      throw new AppError('Email ya registrado', 409, 'EMAIL_EXISTS');
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Insertar usuario
    const user = await database.insert('users', {
      name,
      email,
      password_hash: passwordHash,
      role,
      phone,
      zone_id: zoneId,
      active: true,
      created_at: new Date()
    });

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }

    const fallbackUser = await registerFallbackUser({ name, email, password, role, phone, zoneId });
    const token = generateToken({
      id: fallbackUser.id,
      email: fallbackUser.email,
      role: fallbackUser.role
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      mode: 'degraded',
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role
      },
      token
    });
  }
});

/**
 * Login con email y contraseña
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario
    const user = await database.queryOne(
      'SELECT id, name, email, role, password_hash, active FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.active) {
      throw new AppError('Usuario desactivado', 403, 'USER_INACTIVE');
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS');
    }

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Registrar login
    try {
      await database.insert('audit_logs', {
        user_id: user.id,
        action: 'LOGIN',
        details: JSON.stringify({ ip: req.ip, userAgent: req.get('user-agent') }),
        created_at: new Date()
      });
    } catch (auditError) {
      console.warn('⚠️ No se pudo registrar auditoría de LOGIN:', auditError.message);
    }

    return res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }

    const fallbackUser = await loginFallbackUser({ email, password });
    const token = generateToken({
      id: fallbackUser.id,
      email: fallbackUser.email,
      role: fallbackUser.role
    });

    return res.json({
      message: 'Login exitoso',
      mode: 'degraded',
      user: {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role
      },
      token
    });
  }
});

/**
 * Obtener perfil del usuario logueado
 * GET /api/auth/me
 */
export const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await database.queryOne(
      'SELECT id, name, email, role, phone, zone_id, active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    return res.json({ user });
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }

    const user = await getFallbackProfileById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    return res.json({ user, mode: 'degraded' });
  }
});

/**
 * Cambiar contraseña
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validar contraseña actual
    const user = await database.queryOne(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      throw new AppError('Contraseña actual incorrecta', 401, 'INVALID_PASSWORD');
    }

    // Hashear nueva contraseña
    const newHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Actualizar
    await database.update('users', { password_hash: newHash }, { id: req.user.id });

    // Log de auditoría
    await database.insert('audit_logs', {
      user_id: req.user.id,
      action: 'CHANGE_PASSWORD',
      created_at: new Date()
    });

    return res.json({
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) {
      throw error;
    }

    await changeFallbackPassword({ userId: req.user.id, currentPassword, newPassword });
    return res.json({ message: 'Contraseña actualizada correctamente', mode: 'degraded' });
  }
});

/**
 * Logout (frontend debe eliminar token)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Log de auditoría
  try {
    await database.insert('audit_logs', {
      user_id: req.user.id,
      action: 'LOGOUT',
      created_at: new Date()
    });
  } catch (auditError) {
    console.warn('⚠️ No se pudo registrar auditoría de LOGOUT:', auditError.message);
  }

  res.json({
    message: 'Logout exitoso'
  });
});

/**
 * Login/registro con Google
 * POST /api/auth/google
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, role = 'operator', phone = null, zoneId = null } = req.body;

  if (!idToken) {
    throw new AppError('idToken es requerido', 400, 'GOOGLE_TOKEN_REQUIRED');
  }

  let googleData;
  try {
    const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: idToken },
      timeout: 10000
    });
    googleData = response.data;
  } catch {
    throw new AppError('Token de Google inválido o expirado', 401, 'GOOGLE_TOKEN_INVALID');
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (googleClientId && googleData.aud !== googleClientId) {
    throw new AppError('Token de Google no corresponde a esta aplicación', 401, 'GOOGLE_AUDIENCE_MISMATCH');
  }

  if (!googleData.email || googleData.email_verified !== 'true') {
    throw new AppError('Cuenta de Google no verificada', 401, 'GOOGLE_EMAIL_NOT_VERIFIED');
  }

  let user = await database.queryOne(
    'SELECT id, name, email, role, active FROM users WHERE email = $1',
    [googleData.email]
  );

  if (!user) {
    const randomPassword = `google-${crypto.randomUUID()}-${Date.now()}`;
    const passwordHash = await bcrypt.hash(randomPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    try {
      user = await database.insert('users', {
        name: googleData.name || 'Usuario Google',
        email: googleData.email,
        password_hash: passwordHash,
        role,
        phone,
        zone_id: zoneId,
        auth_provider: 'google',
        google_id: googleData.sub,
        avatar_url: googleData.picture || null,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch {
      user = await database.insert('users', {
        name: googleData.name || 'Usuario Google',
        email: googleData.email,
        password_hash: passwordHash,
        role,
        phone,
        zone_id: zoneId,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } else {
    try {
      await database.update(
        'users',
        {
          auth_provider: 'google',
          google_id: googleData.sub,
          avatar_url: googleData.picture || null,
          updated_at: new Date()
        },
        { id: user.id }
      );
    } catch {
      await database.update(
        'users',
        {
          updated_at: new Date()
        },
        { id: user.id }
      );
    }

    user = {
      ...user,
      name: googleData.name || user.name
    };
  }

  if (!user.active) {
    throw new AppError('Usuario desactivado', 403, 'USER_INACTIVE');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  try {
    await database.insert('audit_logs', {
      user_id: user.id,
      action: 'GOOGLE_LOGIN',
      details: JSON.stringify({
        googleSub: googleData.sub,
        email: googleData.email,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }),
      created_at: new Date()
    });
  } catch (auditError) {
    console.warn('⚠️ No se pudo registrar auditoría de GOOGLE_LOGIN:', auditError.message);
  }

  res.json({
    message: 'Login con Google exitoso',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
});
