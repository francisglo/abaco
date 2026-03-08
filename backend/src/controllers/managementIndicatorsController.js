/**
 * Controlador de Indicadores de Gestión
 * Metas, proyectos, avance y análisis de impacto
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ===== METAS =====

export const getGoals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, zone_id, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM goals WHERE 1=1';
  const values = [];

  if (zone_id) {
    values.push(zone_id);
    query += ` AND zone_id = $${values.length}`;
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
    query + ` ORDER BY due_date ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const createGoal = asyncHandler(async (req, res) => {
  const { title, description, zoneId, managerId, targetValue, unit, startDate, dueDate, priority } = req.body;

  const result = await database.query(
    `INSERT INTO goals (title, description, zone_id, manager_id, target_value, unit, start_date, due_date, priority, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
     RETURNING *`,
    [title, description, zoneId, managerId, targetValue, unit, startDate, dueDate, priority]
  );

  res.status(201).json({
    message: 'Meta creada',
    goal: result.rows[0]
  });
});

export const updateGoalProgress = asyncHandler(async (req, res) => {
  const { goalId } = req.params;
  const { currentValue } = req.body;

  // Calcular descripción del avance basada en progreso
  const existing = await database.query('SELECT target_value FROM goals WHERE id = $1', [goalId]);
  if (existing.rows.length === 0) {
    throw new AppError('Meta no encontrada', 404, 'GOAL_NOT_FOUND');
  }

  const progress = (currentValue / existing.rows[0].target_value) * 100;

  const result = await database.query(
    `UPDATE goals SET current_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [currentValue, goalId]
  );

  res.json({
    message: 'Meta actualizada',
    goal: result.rows[0],
    progress: progress.toFixed(2) + '%'
  });
});

// ===== PROYECTOS =====

export const getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, zone_id, status } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM projects WHERE 1=1';
  const values = [];

  if (zone_id) {
    values.push(zone_id);
    query += ` AND zone_id = $${values.length}`;
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
    query + ` ORDER BY due_date ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, zoneId, managerId, budget, startDate, dueDate, priority, expectedImpact } = req.body;

  const result = await database.query(
    `INSERT INTO projects (name, description, zone_id, manager_id, budget, start_date, due_date, priority, expected_impact, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'planning')
     RETURNING *`,
    [name, description, zoneId, managerId, budget, startDate, dueDate, priority, expectedImpact]
  );

  res.status(201).json({
    message: 'Proyecto creado',
    project: result.rows[0]
  });
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, spent, completionDate, actualImpact } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }
  if (spent !== undefined) {
    updates.push(`spent = $${paramCount}`);
    values.push(spent);
    paramCount++;
  }
  if (completionDate !== undefined) {
    updates.push(`completion_date = $${paramCount}`);
    values.push(completionDate);
    paramCount++;
  }
  if (actualImpact !== undefined) {
    updates.push(`actual_impact = $${paramCount}`);
    values.push(actualImpact);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new AppError('No hay datos para actualizar', 400, 'NO_DATA');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(projectId);

  const result = await database.query(
    `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Proyecto no encontrado', 404, 'PROJECT_NOT_FOUND');
  }

  res.json({
    message: 'Proyecto actualizado',
    project: result.rows[0]
  });
});

export const addMilestone = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { milestone, description, plannedDate, progressPercent } = req.body;

  const result = await database.query(
    `INSERT INTO project_progress (project_id, milestone, description, planned_date, progress_percent, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [projectId, milestone, description, plannedDate, progressPercent]
  );

  res.status(201).json({
    message: 'Hito agregado',
    milestone: result.rows[0]
  });
});

export const completeMilestone = asyncHandler(async (req, res) => {
  const { milestoneId } = req.params;
  const { notes } = req.body;

  const result = await database.query(
    `UPDATE project_progress SET status = 'completed', actual_date = CURRENT_DATE, notes = $1 WHERE id = $2 RETURNING *`,
    [notes, milestoneId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Hito no encontrado', 404, 'MILESTONE_NOT_FOUND');
  }

  res.json({
    message: 'Hito completado',
    milestone: result.rows[0]
  });
});

// ===== INDICADORES TERRITORIALES =====

export const getTerritorialIndicators = asyncHandler(async (req, res) => {
  const { zoneId, indicatorType } = req.query;

  let query = 'SELECT * FROM territorial_indicators WHERE 1=1';
  const values = [];

  if (zoneId) {
    values.push(zoneId);
    query += ` AND zone_id = $${values.length}`;
  }
  if (indicatorType) {
    values.push(indicatorType);
    query += ` AND indicator_type = $${values.length}`;
  }

  const result = await database.query(query + ' ORDER BY measurement_date DESC', values);

  res.json({ data: result.rows });
});

export const recordIndicator = asyncHandler(async (req, res) => {
  const { zoneId, indicatorName, indicatorType, value, baseline, target, unit, dataSource } = req.body;

  // Determinar tendencia
  let trend = 'stable';
  if (target && baseline) {
    const progress = (value - baseline) / (target - baseline);
    trend = progress > 0.5 ? 'positive' : progress < 0.3 ? 'negative' : 'stable';
  }

  const result = await database.query(
    `INSERT INTO territorial_indicators 
     (zone_id, indicator_name, indicator_type, value, baseline, target, unit, measurement_date, data_source, trend)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9)
     RETURNING *`,
    [zoneId, indicatorName, indicatorType, value, baseline, target, unit, dataSource, trend]
  );

  res.status(201).json({
    message: 'Indicador registrado',
    indicator: result.rows[0]
  });
});

// ===== ESTADÍSTICAS =====

export const getManagementStats = asyncHandler(async (req, res) => {
  const { zoneId } = req.params || {};

  let whereClause = '';
  const values = [];

  if (zoneId) {
    whereClause = 'WHERE zone_id = $1';
    values.push(zoneId);
  }

  // Goals
  const goalsResult = await database.query(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
       AVG(CASE WHEN target_value > 0 THEN (current_value::float / target_value) * 100 ELSE 0 END) as avg_progress
     FROM goals ${whereClause}`,
    values
  );

  // Projects
  const projectsResult = await database.query(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       COALESCE(SUM(spent), 0) as total_spent,
       COALESCE(SUM(budget), 0) as total_budget
     FROM projects ${whereClause}`,
    values
  );

  res.json({
    stats: {
      goals: {
        total: parseInt(goalsResult.rows[0].total),
        active: parseInt(goalsResult.rows[0].active),
        averageProgress: parseFloat(goalsResult.rows[0].avg_progress || 0).toFixed(2)
      },
      projects: {
        total: parseInt(projectsResult.rows[0].total),
        completed: parseInt(projectsResult.rows[0].completed),
        budgetExecution: parseFloat(
          projectsResult.rows[0].total_budget > 0 
            ? (projectsResult.rows[0].total_spent / projectsResult.rows[0].total_budget) * 100 
            : 0
        ).toFixed(2) + '%'
      }
    }
  });
});

export const getImpactAnalysis = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await database.query(
    'SELECT * FROM projects WHERE id = $1',
    [projectId]
  );

  if (project.rows.length === 0) {
    throw new AppError('Proyecto no encontrado', 404, 'PROJECT_NOT_FOUND');
  }

  const milestones = await database.query(
    'SELECT * FROM project_progress WHERE project_id = $1 ORDER BY planned_date',
    [projectId]
  );

  res.json({
    project: project.rows[0],
    milestones: milestones.rows,
    impactSummary: {
      expectedImpact: project.rows[0].expected_impact,
      actualImpact: project.rows[0].actual_impact,
      budgetExecution: project.rows[0].budget > 0 ? 
        ((project.rows[0].spent / project.rows[0].budget) * 100).toFixed(2) + '%' : 'N/A'
    }
  });
});
