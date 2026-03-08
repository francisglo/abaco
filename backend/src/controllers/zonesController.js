/**
 * Controlador de Zonas
 * Gestiona la división territorial
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const getZones = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy = 'priority', order = 'ASC' } = req.query;
  const offset = (page - 1) * limit;

  const result = await database.query(
    `SELECT * FROM zones ORDER BY ${sortBy} ${order} LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await database.query('SELECT COUNT(*) as count FROM zones');
  const total = parseInt(countResult.rows[0].count);
  const pages = Math.ceil(total / limit);

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const getZoneById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query(
    'SELECT * FROM zones WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Zona no encontrada', 404, 'ZONE_NOT_FOUND');
  }

  // Agregar estadísticas de votantes en esa zona
  const votersStats = await database.query(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority
     FROM voters WHERE zone_id = $1`,
    [id]
  );

  res.json({
    zone: {
      ...result.rows[0],
      votersStats: {
        total: parseInt(votersStats.rows[0].total),
        confirmed: parseInt(votersStats.rows[0].confirmed),
        highPriority: parseInt(votersStats.rows[0].high_priority)
      }
    }
  });
});

export const createZone = asyncHandler(async (req, res) => {
  const { name, priority = 3, manager, description } = req.body;

  // Verificar si ya existe
  const existing = await database.query(
    'SELECT id FROM zones WHERE name = $1',
    [name]
  );

  if (existing.rows.length > 0) {
    throw new AppError('Una zona con ese nombre ya existe', 409, 'ZONE_EXISTS');
  }

  const result = await database.query(
    `INSERT INTO zones (name, priority, manager, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, priority, manager, description]
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'CREATE', 'ZONE', result.rows[0].id, { name }, req.ip]
  );

  res.status(201).json({
    message: 'Zona creada correctamente',
    zone: result.rows[0]
  });
});

export const updateZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, priority, manager, description } = req.body;

  const existing = await database.query('SELECT id FROM zones WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Zona no encontrada', 404, 'ZONE_NOT_FOUND');
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }
  if (priority !== undefined) {
    updates.push(`priority = $${paramCount}`);
    values.push(priority);
    paramCount++;
  }
  if (manager !== undefined) {
    updates.push(`manager = $${paramCount}`);
    values.push(manager);
    paramCount++;
  }
  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No hay datos para actualizar', 400, 'NO_DATA');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await database.query(
    `UPDATE zones SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'UPDATE', 'ZONE', id, { updated: Object.keys(req.body) }, req.ip]
  );

  res.json({
    message: 'Zona actualizada correctamente',
    zone: result.rows[0]
  });
});

export const deleteZone = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si hay votantes en la zona
  const voters = await database.query(
    'SELECT COUNT(*) as count FROM voters WHERE zone_id = $1',
    [id]
  );

  if (parseInt(voters.rows[0].count) > 0) {
    throw new AppError('No se puede eliminar una zona con votantes', 409, 'ZONE_HAS_VOTERS');
  }

  const result = await database.query('DELETE FROM zones WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Zona no encontrada', 404, 'ZONE_NOT_FOUND');
  }

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.id || null, 'DELETE', 'ZONE', id, req.ip]
  );

  res.json({ message: 'Zona eliminada correctamente' });
});

export const getZoneStats = asyncHandler(async (req, res) => {
  const result = await database.query(`
    SELECT 
      COUNT(*) as total_zones,
      AVG(priority) as avg_priority,
      (SELECT COUNT(*) FROM voters) as total_voters
    FROM zones
  `);

  res.json({
    stats: {
      totalZones: parseInt(result.rows[0].total_zones),
      averagePriority: parseFloat(result.rows[0].avg_priority),
      totalVoters: parseInt(result.rows[0].total_voters)
    }
  });
});
