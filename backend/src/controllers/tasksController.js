/**
 * Controlador de Tareas
 * Gestiona las actividades asignadas a operadores
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const getTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, assignedTo, sortBy = 'due_date', order = 'ASC' } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const values = [];

  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
  }

  if (assignedTo) {
    values.push(assignedTo);
    query += ` AND assigned_to = $${values.length}`;
  }

  // Contar total
  const countResult = await database.query(
    query.replace('SELECT *', 'SELECT COUNT(*) as count'),
    values
  );

  const total = parseInt(countResult.rows[0].count);
  const pages = Math.ceil(total / limit);

  // Obtener datos
  values.push(limit);
  values.push(offset);
  const result = await database.query(
    query + ` ORDER BY ${sortBy} ${order} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query(
    `SELECT t.*, u.name as assigned_to_name 
     FROM tasks t 
     LEFT JOIN users u ON t.assigned_to = u.id 
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tarea no encontrada', 404, 'TASK_NOT_FOUND');
  }

  res.json({ task: result.rows[0] });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status = 'pending', priority = 'medium', dueDate, type } = req.body;

  // Verificar si el usuario asignado existe
  if (assignedTo) {
    const userResult = await database.query('SELECT id FROM users WHERE id = $1', [assignedTo]);
    if (userResult.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }
  }

  const result = await database.query(
    `INSERT INTO tasks (title, description, assigned_to, status, priority, due_date, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [title, description, assignedTo, status, priority, dueDate, type]
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'CREATE', 'TASK', result.rows[0].id, { title }, req.ip]
  );

  res.status(201).json({
    message: 'Tarea creada correctamente',
    task: result.rows[0]
  });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, assignedTo, status, priority, dueDate, type, completed } = req.body;

  const existing = await database.query('SELECT id FROM tasks WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Tarea no encontrada', 404, 'TASK_NOT_FOUND');
  }

  // Verificar usuario si se asigna
  if (assignedTo) {
    const userResult = await database.query('SELECT id FROM users WHERE id = $1', [assignedTo]);
    if (userResult.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (title !== undefined) {
    updates.push(`title = $${paramCount}`);
    values.push(title);
    paramCount++;
  }
  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }
  if (assignedTo !== undefined) {
    updates.push(`assigned_to = $${paramCount}`);
    values.push(assignedTo);
    paramCount++;
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }
  if (priority !== undefined) {
    updates.push(`priority = $${paramCount}`);
    values.push(priority);
    paramCount++;
  }
  if (dueDate !== undefined) {
    updates.push(`due_date = $${paramCount}`);
    values.push(dueDate);
    paramCount++;
  }
  if (type !== undefined) {
    updates.push(`type = $${paramCount}`);
    values.push(type);
    paramCount++;
  }
  if (completed !== undefined) {
    updates.push(`completed = $${paramCount}`);
    values.push(completed);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No hay datos para actualizar', 400, 'NO_DATA');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await database.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'UPDATE', 'TASK', id, { updated: Object.keys(req.body) }, req.ip]
  );

  res.json({
    message: 'Tarea actualizada correctamente',
    task: result.rows[0]
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Tarea no encontrada', 404, 'TASK_NOT_FOUND');
  }

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.id || null, 'DELETE', 'TASK', id, req.ip]
  );

  res.json({ message: 'Tarea eliminada correctamente' });
});

export const getTaskStats = asyncHandler(async (req, res) => {
  const result = await database.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority
    FROM tasks
  `);

  res.json({
    stats: {
      total: parseInt(result.rows[0].total),
      pending: parseInt(result.rows[0].pending),
      inProgress: parseInt(result.rows[0].in_progress),
      completed: parseInt(result.rows[0].completed),
      highPriority: parseInt(result.rows[0].high_priority)
    }
  });
});
