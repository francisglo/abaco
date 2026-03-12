import bcrypt from 'bcryptjs';
import axios from 'axios';
import crypto from 'crypto';
import database from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Controlador de autenticación
 */

function sanitizeUsername(raw = '') {
  const normalized = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.slice(0, 24);
}

async function ensureUniqueUsername(baseSeed) {
  const base = sanitizeUsername(baseSeed) || 'user';
  let candidate = base;
  let suffix = 1;

  while (true) {
    const exists = await database.queryOne(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [candidate]
    );

    if (!exists) return candidate;

    suffix += 1;
    const trimmedBase = base.slice(0, Math.max(1, 24 - String(suffix).length));
    candidate = `${trimmedBase}${suffix}`;
  }
}

async function ensureUniqueEmail(baseSeed) {
  const local = sanitizeUsername(baseSeed) || `user${Date.now()}`;
  let candidate = `${local}@abaco.local`;
  let suffix = 1;

  while (true) {
    const exists = await database.queryOne(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [candidate]
    );

    if (!exists) return candidate;

    suffix += 1;
    const trimmedLocal = local.slice(0, Math.max(1, 24 - String(suffix).length));
    candidate = `${trimmedLocal}${suffix}@abaco.local`;
  }
}

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, username, password, role = 'operator', phone, zoneId } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUsernameRaw = sanitizeUsername(username || normalizedEmail.split('@')[0] || name);
  const normalizedUsername = await ensureUniqueUsername(normalizedUsernameRaw || `user${Date.now()}`);

  const effectiveEmail = normalizedEmail || await ensureUniqueEmail(normalizedUsername);

  if (normalizedEmail) {
    const existingEmail = await database.queryOne(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );
    if (existingEmail) {
      throw new AppError('Email ya registrado', 409, 'EMAIL_EXISTS');
    }
  }

  const existingUsername = await database.queryOne(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
    [normalizedUsername]
  );

  if (existingUsername) {
    throw new AppError('Nombre de usuario ya registrado', 409, 'USERNAME_EXISTS');
  }

  // Hashear contraseña
  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

  // Insertar usuario
  const user = await database.insert('users', {
    name,
    email: effectiveEmail,
    username: normalizedUsername,
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
    username: user.username,
    role: user.role
  });

  res.status(201).json({
    message: 'Usuario registrado correctamente',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role
    },
    token
  });
});

/**
 * Login con email y contraseña
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, username, identifier, password } = req.body;
  const rawIdentifier = String(identifier || email || username || '').trim();
  const normalizedIdentifier = rawIdentifier.toLowerCase();

  if (!normalizedIdentifier) {
    throw new AppError('Debes indicar email o username', 400, 'AUTH_IDENTIFIER_REQUIRED');
  }

  // Buscar usuario
  const user = await database.queryOne(
    `SELECT id, name, email, username, role, password_hash, active
     FROM users
     WHERE LOWER(email) = $1 OR LOWER(username) = $1`,
    [normalizedIdentifier]
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
    username: user.username,
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

  res.json({
    message: 'Login exitoso',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role
    },
    token
  });
});

/**
 * Obtener perfil del usuario logueado
 * GET /api/auth/me
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await database.queryOne(
    'SELECT id, name, email, username, role, phone, zone_id, active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  res.json({
    user
  });
});

/**
 * Actualizar perfil del usuario autenticado
 * PATCH /api/auth/me
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    role,
    username
  } = req.body || {};

  const allowedRoles = new Set([
    'admin',
    'manager',
    'operator',
    'auditor',
    'viewer',
    'campaign_manager',
    'visitor',
    'security_monitor',
    'administrador',
    'administrador_del_sistema',
    'system_admin',
    'analista',
    'analyst',
    'consultor',
    'consultant',
    'cliente',
    'cliente_institucional',
    'institutional_client',
    'publico',
    'usuario_publico',
    'public_user'
  ]);
  if (role !== undefined && !allowedRoles.has(String(role).trim().toLowerCase())) {
    throw new AppError('Rol inválido', 400, 'INVALID_ROLE');
  }

  const updates = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (typeof phone === 'string') updates.phone = phone.trim();
  if (typeof role === 'string') updates.role = role.trim().toLowerCase();
  if (typeof username === 'string' && username.trim()) {
    const normalizedUsername = sanitizeUsername(username);
    if (!normalizedUsername) {
      throw new AppError('Username inválido', 400, 'INVALID_USERNAME');
    }
    const existingUsername = await database.queryOne(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2',
      [normalizedUsername, req.user.id]
    );
    if (existingUsername) {
      throw new AppError('Nombre de usuario ya registrado', 409, 'USERNAME_EXISTS');
    }
    updates.username = normalizedUsername;
  }

  if (!Object.keys(updates).length) {
    throw new AppError('No hay campos válidos para actualizar', 400, 'NO_UPDATES');
  }

  updates.updated_at = new Date();

  const rows = await database.update('users', updates, { id: req.user.id });
  const user = rows?.[0];

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  });

  res.json({
    message: 'Perfil actualizado correctamente',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      phone: user.phone,
      zone_id: user.zone_id,
      active: user.active,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token
  });
});

/**
 * Eliminación lógica de cuenta del usuario autenticado
 * DELETE /api/auth/me
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    throw new AppError('Contraseña requerida', 400, 'PASSWORD_REQUIRED');
  }

  const user = await database.queryOne(
    'SELECT id, email, password_hash FROM users WHERE id = $1',
    [req.user.id]
  );

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Contraseña incorrecta', 401, 'INVALID_PASSWORD');
  }

  const tombstonePassword = await bcrypt.hash(`deleted-${Date.now()}-${user.id}`, parseInt(process.env.BCRYPT_ROUNDS, 10) || 10);

  await database.update(
    'users',
    {
      active: false,
      email: `deleted_${user.id}_${Date.now()}@deleted.local`,
      name: 'Cuenta eliminada',
      phone: null,
      password_hash: tombstonePassword,
      updated_at: new Date()
    },
    { id: req.user.id }
  );

  res.status(204).send();
});

/**
 * Cambiar contraseña
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

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

  res.json({
    message: 'Contraseña actualizada correctamente'
  });
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
    'SELECT id, name, email, username, role, active FROM users WHERE LOWER(email) = LOWER($1)',
    [googleData.email]
  );

  if (!user) {
    const randomPassword = `google-${crypto.randomUUID()}-${Date.now()}`;
    const passwordHash = await bcrypt.hash(randomPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    try {
      const generatedUsername = await ensureUniqueUsername(googleData.email.split('@')[0] || googleData.name || `google${Date.now()}`);
      user = await database.insert('users', {
        name: googleData.name || 'Usuario Google',
        email: googleData.email,
        username: generatedUsername,
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
      const generatedUsername = await ensureUniqueUsername(googleData.email.split('@')[0] || googleData.name || `google${Date.now()}`);
      user = await database.insert('users', {
        name: googleData.name || 'Usuario Google',
        email: googleData.email,
        username: generatedUsername,
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
    username: user.username,
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
      username: user.username,
      role: user.role
    },
    token
  });
});
