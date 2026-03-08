/**
 * Controlador de Usuarios
 * Gestiona operaciones CRUD de usuarios
 */

import database from '../config/database.js';
import bcrypt from 'bcryptjs';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, name, email, role, phone, zone_id, active, created_at FROM users WHERE 1=1';
  const values = [];

  if (role) {
    values.push(role);
    query += ` AND role = $${values.length}`;
  }

  if (search) {
    values.push(`%${search}%`);
    query += ` AND (name ILIKE $${values.length} OR email ILIKE $${values.length})`;
  }

  // Contar total
  const countResult = await database.query(
    query.replace('SELECT id, name, email, role, phone, zone_id, active, created_at FROM users', 'SELECT COUNT(*) as count FROM users'),
    values
  );

  const total = parseInt(countResult.rows[0].count);
  const pages = Math.ceil(total / limit);

  // Obtener datos con paginación
  const result = await database.query(
    query + ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query(
    'SELECT id, name, email, role, phone, zone_id, active, created_at FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  res.json({ user: result.rows[0] });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, zoneId } = req.body;

  // Verificar si el email ya existe
  const existing = await database.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('El email ya está registrado', 409, 'EMAIL_EXISTS');
  }

  // Hash de contraseña
  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

  const result = await database.query(
    `INSERT INTO users (name, email, password_hash, role, phone, zone_id, active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, name, email, role, phone, zone_id, active, created_at`,
    [name, email, passwordHash, role, phone, zoneId]
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'CREATE', 'USER', result.rows[0].id, { email }, req.ip]
  );

  res.status(201).json({
    message: 'Usuario creado correctamente',
    user: result.rows[0]
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, zoneId, active } = req.body;

  // Verificar existencia
  const existing = await database.query('SELECT id FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  // Construir query dinámica
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramCount}`);
    values.push(phone);
    paramCount++;
  }
  if (role !== undefined) {
    updates.push(`role = $${paramCount}`);
    values.push(role);
    paramCount++;
  }
  if (zoneId !== undefined) {
    updates.push(`zone_id = $${paramCount}`);
    values.push(zoneId);
    paramCount++;
  }
  if (active !== undefined) {
    updates.push(`active = $${paramCount}`);
    values.push(active);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No hay datos para actualizar', 400, 'NO_DATA');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await database.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, phone, zone_id, active, updated_at`,
    values
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'UPDATE', 'USER', id, { updated: Object.keys(req.body) }, req.ip]
  );

  res.json({
    message: 'Usuario actualizado correctamente',
    user: result.rows[0]
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.id || null, 'DELETE', 'USER', id, req.ip]
  );

  res.json({ message: 'Usuario eliminado correctamente' });
});

export const getUserStats = asyncHandler(async (req, res) => {
  const result = await database.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
      SUM(CASE WHEN role = 'operator' THEN 1 ELSE 0 END) as operators,
      SUM(CASE WHEN active = true THEN 1 ELSE 0 END) as active_users
    FROM users
  `);

  res.json({
    stats: {
      total: parseInt(result.rows[0].total),
      admins: parseInt(result.rows[0].admins),
      operators: parseInt(result.rows[0].operators),
      activeUsers: parseInt(result.rows[0].active_users)
    }
  });
});
