/**
 * Controlador de Solicitudes Ciudadanas
 * Peticiones, quejas, seguimiento y priorización
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const getCitizenRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, zone_id, type } = req.query;
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM citizen_requests WHERE 1=1`;
  const values = [];

  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
  }
  if (priority) {
    values.push(priority);
    query += ` AND priority = $${values.length}`;
  }
  if (zone_id) {
    values.push(zone_id);
    query += ` AND zone_id = $${values.length}`;
  }
  if (type) {
    values.push(type);
    query += ` AND request_type = $${values.length}`;
  }

  const countResult = await database.query(
    query.replace('SELECT *', 'SELECT COUNT(*) as count'),
    values
  );

  const total = parseInt(countResult.rows[0].count);
  const pages = Math.ceil(total / limit);

  values.push(limit);
  values.push(offset);
  const result = await database.query(
    query + ` ORDER BY urgency DESC, created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const getRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query(
    `SELECT r.*, z.name as zone_name, u.name as assigned_to_name
     FROM citizen_requests r
     LEFT JOIN zones z ON r.zone_id = z.id
     LEFT JOIN users u ON r.assigned_to = u.id
     WHERE r.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Solicitud no encontrada', 404, 'REQUEST_NOT_FOUND');
  }

  res.json({ request: result.rows[0] });
});

export const createCitizenRequest = asyncHandler(async (req, res) => {
  const {
    requestType,
    title,
    description,
    citizenName,
    citizenPhone,
    citizenEmail,
    zoneId,
    priority = 'medium',
    urgency = 3,
    latitude,
    longitude
  } = req.body;

  const result = await database.query(
    `INSERT INTO citizen_requests 
     (request_type, title, description, citizen_name, citizen_phone, citizen_email, 
      zone_id, priority, urgency, latitude, longitude, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
     RETURNING *`,
    [
      requestType, title, description, citizenName, citizenPhone, citizenEmail,
      zoneId, priority, urgency, latitude, longitude
    ]
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'CREATE', 'CITIZEN_REQUEST', result.rows[0].id, { type: requestType }, req.ip]
  );

  res.status(201).json({
    message: 'Solicitud creada correctamente',
    request: result.rows[0]
  });
});

export const updateCitizenRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority, assignedTo, urgency, resolutionDate, resolutionNotes } = req.body;

  const existing = await database.query('SELECT id FROM citizen_requests WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Solicitud no encontrada', 404, 'REQUEST_NOT_FOUND');
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

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
  if (assignedTo !== undefined) {
    updates.push(`assigned_to = $${paramCount}`);
    values.push(assignedTo);
    paramCount++;
  }
  if (urgency !== undefined) {
    updates.push(`urgency = $${paramCount}`);
    values.push(urgency);
    paramCount++;
  }
  if (resolutionDate !== undefined) {
    updates.push(`resolution_date = $${paramCount}`);
    values.push(resolutionDate);
    paramCount++;
  }
  if (resolutionNotes !== undefined) {
    updates.push(`resolution_notes = $${paramCount}`);
    values.push(resolutionNotes);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No hay datos para actualizar', 400, 'NO_DATA');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await database.query(
    `UPDATE citizen_requests SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, 'UPDATE', 'CITIZEN_REQUEST', id, { updated: Object.keys(req.body) }, req.ip]
  );

  res.json({
    message: 'Solicitud actualizada correctamente',
    request: result.rows[0]
  });
});

export const deleteCitizenRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query('DELETE FROM citizen_requests WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Solicitud no encontrada', 404, 'REQUEST_NOT_FOUND');
  }

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.id || null, 'DELETE', 'CITIZEN_REQUEST', id, req.ip]
  );

  res.json({ message: 'Solicitud eliminada correctamente' });
});

export const addCaseTracking = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { activity, description, statusBefore, statusAfter, notes } = req.body;

  // Verificar que la solicitud existe
  const request = await database.query('SELECT id, status FROM citizen_requests WHERE id = $1', [requestId]);
  if (request.rows.length === 0) {
    throw new AppError('Solicitud no encontrada', 404, 'REQUEST_NOT_FOUND');
  }

  const result = await database.query(
    `INSERT INTO case_tracking (request_id, activity, description, status_before, status_after, modified_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [requestId, activity, description, statusBefore || request.rows[0].status, statusAfter, req.user?.id, notes]
  );

  res.status(201).json({
    message: 'Seguimiento agregado',
    tracking: result.rows[0]
  });
});

export const getCaseTracking = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const result = await database.query(
    `SELECT ct.*, u.name as modified_by_name
     FROM case_tracking ct
     LEFT JOIN users u ON ct.modified_by = u.id
     WHERE ct.request_id = $1
     ORDER BY ct.created_at DESC`,
    [requestId]
  );

  res.json({
    data: result.rows
  });
});

export const getRequestStats = asyncHandler(async (req, res) => {
  const result = await database.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN request_type = 'petition' THEN 1 ELSE 0 END) as petitions,
      SUM(CASE WHEN request_type = 'complaint' THEN 1 ELSE 0 END) as complaints,
      SUM(CASE WHEN urgency >= 4 THEN 1 ELSE 0 END) as urgent,
      AVG(urgency) as avg_urgency
    FROM citizen_requests
  `);

  res.json({
    stats: {
      total: parseInt(result.rows[0].total),
      byStatus: {
        pending: parseInt(result.rows[0].pending),
        inProgress: parseInt(result.rows[0].in_progress),
        resolved: parseInt(result.rows[0].resolved)
      },
      byType: {
        petitions: parseInt(result.rows[0].petitions),
        complaints: parseInt(result.rows[0].complaints)
      },
      urgent: parseInt(result.rows[0].urgent),
      averageUrgency: parseFloat(result.rows[0].avg_urgency)
    }
  });
});

export const getRequestsByUrgency = asyncHandler(async (req, res) => {
  const result = await database.query(`
    SELECT 
      cr.*,
      z.name as zone_name,
      u.name as assigned_to_name
    FROM citizen_requests cr
    LEFT JOIN zones z ON cr.zone_id = z.id
    LEFT JOIN users u ON cr.assigned_to = u.id
    WHERE cr.status != 'resolved'
    ORDER BY cr.urgency DESC, cr.created_at ASC
    LIMIT 20
  `);

  res.json({
    data: result.rows
  });
});
