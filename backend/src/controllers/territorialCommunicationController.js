/**
 * Controlador de Comunicación Territorial
 * Eventos, actividades, voluntarios y reportes de campo
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ===== EVENTOS =====

export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, zone_id, type, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM events WHERE 1=1';
  const values = [];

  if (zone_id) {
    values.push(zone_id);
    query += ` AND zone_id = $${values.length}`;
  }
  if (type) {
    values.push(type);
    query += ` AND event_type = $${values.length}`;
  }
  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
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
    query + ` ORDER BY event_date DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    eventType,
    zoneId,
    location,
    eventDate,
    eventTime,
    organizerId,
    expectedAttendees,
    latitude,
    longitude
  } = req.body;

  const result = await database.query(
    `INSERT INTO events (title, description, event_type, zone_id, location, event_date, event_time, 
      organizer_id, expected_attendees, latitude, longitude, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'scheduled')
     RETURNING *`,
    [title, description, eventType, zoneId, location, eventDate, eventTime, organizerId, expectedAttendees, latitude, longitude]
  );

  res.status(201).json({
    message: 'Evento creado correctamente',
    event: result.rows[0]
  });
});

export const updateEventAttendance = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { actualAttendees, report } = req.body;

  const result = await database.query(
    `UPDATE events SET actual_attendees = $1, report = $2, status = 'completed', updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [actualAttendees, report, eventId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
  }

  res.json({
    message: 'Evento actualizado',
    event: result.rows[0]
  });
});

// ===== ACTIVIDADES =====

export const createActivity = asyncHandler(async (req, res) => {
  const { eventId, activityType, description, assignedTo, scheduledDate } = req.body;

  const result = await database.query(
    `INSERT INTO activities (event_id, activity_type, description, assigned_to, scheduled_date, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [eventId, activityType, description, assignedTo, scheduledDate]
  );

  res.status(201).json({
    message: 'Actividad creada',
    activity: result.rows[0]
  });
});

export const getActivities = asyncHandler(async (req, res) => {
  const { eventId, status, assignedTo } = req.query;

  let query = 'SELECT * FROM activities WHERE 1=1';
  const values = [];

  if (eventId) {
    values.push(eventId);
    query += ` AND event_id = $${values.length}`;
  }
  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
  }
  if (assignedTo) {
    values.push(assignedTo);
    query += ` AND assigned_to = $${values.length}`;
  }

  const result = await database.query(query + ' ORDER BY scheduled_date ASC', values);

  res.json({ data: result.rows });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const { status, progressPercent, completionDate, notes } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }
  if (progressPercent !== undefined) {
    updates.push(`progress_percent = $${paramCount}`);
    values.push(progressPercent);
    paramCount++;
  }
  if (completionDate !== undefined) {
    updates.push(`completion_date = $${paramCount}`);
    values.push(completionDate);
    paramCount++;
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramCount}`);
    values.push(notes);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No hay datos para actualizar', 400, 'NO_DATA');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(activityId);

  const result = await database.query(
    `UPDATE activities SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Actividad no encontrada', 404, 'ACTIVITY_NOT_FOUND');
  }

  res.json({
    message: 'Actividad actualizada',
    activity: result.rows[0]
  });
});

// ===== VOLUNTARIOS =====

export const getVolunteers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, zone_id, skill_area, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM volunteers WHERE 1=1';
  const values = [];

  if (zone_id) {
    values.push(zone_id);
    query += ` AND zone_id = $${values.length}`;
  }
  if (skill_area) {
    values.push(skill_area);
    query += ` AND skill_area = $${values.length}`;
  }
  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
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
    query + ` ORDER BY name ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const createVolunteer = asyncHandler(async (req, res) => {
  const { name, email, phone, skillArea, availability, zoneId, organization, startDate } = req.body;

  const result = await database.query(
    `INSERT INTO volunteers (name, email, phone, skill_area, availability, zone_id, organization, start_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
     RETURNING *`,
    [name, email, phone, skillArea, availability, zoneId, organization, startDate]
  );

  res.status(201).json({
    message: 'Voluntario registrado',
    volunteer: result.rows[0]
  });
});

export const assignVolunteer = asyncHandler(async (req, res) => {
  const { volunteerId } = req.params;
  const { activityId, hoursWorked } = req.body;

  const result = await database.query(
    `INSERT INTO volunteer_assignments (volunteer_id, activity_id, assigned_date, status)
     VALUES ($1, $2, CURRENT_DATE, 'assigned')
     RETURNING *`,
    [volunteerId, activityId]
  );

  res.status(201).json({
    message: 'Voluntario asignado',
    assignment: result.rows[0]
  });
});

export const recordVolunteerHours = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { hoursWorked, feedback, status } = req.body;

  const result = await database.query(
    `UPDATE volunteer_assignments SET hours_worked = $1, feedback = $2, status = $3, completion_date = CURRENT_DATE
     WHERE id = $4
     RETURNING *`,
    [hoursWorked, feedback, status || 'completed', assignmentId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Asignación no encontrada', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  res.json({
    message: 'Horas registradas',
    assignment: result.rows[0]
  });
});

// ===== REPORTES DE CAMPO =====

export const getFieldReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, zone_id, status, reporterId } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM field_reports WHERE 1=1';
  const values = [];

  if (zone_id) {
    values.push(zone_id);
    query += ` AND zone_id = $${values.length}`;
  }
  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
  }
  if (reporterId) {
    values.push(reporterId);
    query += ` AND reporter_id = $${values.length}`;
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
    query + ` ORDER BY report_date DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const submitFieldReport = asyncHandler(async (req, res) => {
  const {
    reportType,
    title,
    observations,
    findings,
    photosCount,
    location,
    latitude,
    longitude,
    zoneId
  } = req.body;

  const result = await database.query(
    `INSERT INTO field_reports 
     (reporter_id, zone_id, report_date, report_type, title, observations, findings, photos_count, location, latitude, longitude, status)
     VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, 'submitted')
     RETURNING *`,
    [req.user.id, zoneId, reportType, title, observations, findings, photosCount, location, latitude, longitude]
  );

  // Auditoría
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.id, 'CREATE', 'FIELD_REPORT', result.rows[0].id, { type: reportType }, req.ip]
  );

  res.status(201).json({
    message: 'Reporte de campo enviado',
    report: result.rows[0]
  });
});

export const reviewFieldReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { status, reviewNotes } = req.body;

  const result = await database.query(
    `UPDATE field_reports SET status = $1, review_notes = $2, reviewer_id = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, reviewNotes, req.user.id, reportId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Reporte no encontrado', 404, 'REPORT_NOT_FOUND');
  }

  res.json({
    message: 'Reporte revisado',
    report: result.rows[0]
  });
});

// ===== ESTADÍSTICAS =====

export const getTerritorialStats = asyncHandler(async (req, res) => {
  const { zoneId } = req.params || {};

  let whereClause = '';
  const values = [];

  if (zoneId) {
    whereClause = 'WHERE zone_id = $1';
    values.push(zoneId);
  }

  const queries = [
    { label: 'events', sql: `SELECT COUNT(*) as total FROM events ${whereClause}` },
    { label: 'activities', sql: `SELECT COUNT(*) as total FROM activities ${whereClause}` },
    { label: 'volunteers', sql: `SELECT COUNT(*) as total FROM volunteers ${whereClause}` },
    { label: 'reports', sql: `SELECT COUNT(*) as total FROM field_reports ${whereClause}` }
  ];

  const stats = {};
  for (const { label, sql } of queries) {
    const result = await database.query(sql, values);
    stats[label] = parseInt(result.rows[0].total);
  }

  res.json({ stats });
});
