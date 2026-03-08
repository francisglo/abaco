/**
 * Controlador de Inteligencia Estratégica
 * Análisis comparativo, tendencias, riesgos políticos y alertas
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ===== ANÁLISIS COMPARATIVO =====

export const compareZones = asyncHandler(async (req, res) => {
  const { zoneAId, zoneBId, metric } = req.body;

  // Obtener datos comparativos
  const comparison = await database.query(
    `SELECT 
       z1.name as zone_a, z1.id as zone_a_id,
       z2.name as zone_b, z2.id as zone_b_id,
       
       (SELECT COUNT(*) FROM voters WHERE zone_id = z1.id) as voters_a,
       (SELECT COUNT(*) FROM voters WHERE zone_id = z2.id) as voters_b,
       
       (SELECT COUNT(*) FROM events WHERE zone_id = z1.id) as events_a,
       (SELECT COUNT(*) FROM events WHERE zone_id = z2.id) as events_b,
       
       (SELECT COUNT(*) FROM citizen_requests WHERE zone_id = z1.id AND status != 'resolved') as pending_requests_a,
       (SELECT COUNT(*) FROM citizen_requests WHERE zone_id = z2.id AND status != 'resolved') as pending_requests_b,
       
       (SELECT COUNT(*) FROM volunteers WHERE zone_id = z1.id) as volunteers_a,
       (SELECT COUNT(*) FROM volunteers WHERE zone_id = z2.id) as volunteers_b,
       
       (SELECT AVG(urgency) FROM citizen_requests WHERE zone_id = z1.id) as avg_urgency_a,
       (SELECT AVG(urgency) FROM citizen_requests WHERE zone_id = z2.id) as avg_urgency_b
       
     FROM zones z1, zones z2
     WHERE z1.id = $1 AND z2.id = $2`,
    [zoneAId, zoneBId]
  );

  if (comparison.rows.length === 0) {
    throw new AppError('Una o ambas zonas no existen', 404, 'ZONE_NOT_FOUND');
  }

  const data = comparison.rows[0];

  // Guardar en BD para histórico
  await database.query(
    `INSERT INTO zone_comparison (zone_a_id, zone_b_id, comparison_type, metric, analysis)
     VALUES ($1, $2, 'metric', $3, $4)`,
    [zoneAId, zoneBId, metric, JSON.stringify(data)]
  );

  res.json({
    comparison: {
      zones: {
        zoneA: data.zone_a,
        zoneB: data.zone_b
      },
      metrics: {
        voters: {
          zoneA: parseInt(data.voters_a),
          zoneB: parseInt(data.voters_b),
          difference: parseInt(data.voters_b) - parseInt(data.voters_a)
        },
        events: {
          zoneA: parseInt(data.events_a),
          zoneB: parseInt(data.events_b),
          difference: parseInt(data.events_b) - parseInt(data.events_a)
        },
        pendingRequests: {
          zoneA: parseInt(data.pending_requests_a),
          zoneB: parseInt(data.pending_requests_b),
          difference: parseInt(data.pending_requests_b) - parseInt(data.pending_requests_a)
        },
        volunteers: {
          zoneA: parseInt(data.volunteers_a),
          zoneB: parseInt(data.volunteers_b),
          difference: parseInt(data.volunteers_b) - parseInt(data.volunteers_a)
        },
        averageUrgency: {
          zoneA: parseFloat(data.avg_urgency_a || 0).toFixed(2),
          zoneB: parseFloat(data.avg_urgency_b || 0).toFixed(2)
        }
      }
    }
  });
});

// ===== TENDENCIAS TERRITORIALES =====

export const getTerritorialTrends = asyncHandler(async (req, res) => {
  const { zoneId, timeframe = '30' } = req.query;

  const daysBack = parseInt(timeframe);

  const queries = {
    requests: `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM citizen_requests
      WHERE zone_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '${daysBack} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    events: `
      SELECT DATE(event_date) as date, COUNT(*) as count
      FROM events
      WHERE zone_id = $1 AND event_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
      GROUP BY DATE(event_date)
      ORDER BY date ASC
    `,
    volunteers: `
      SELECT DATE(start_date) as date, COUNT(*) as count
      FROM volunteers
      WHERE zone_id = $1 AND start_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
      GROUP BY DATE(start_date)
      ORDER BY date ASC
    `
  };

  const trends = {};

  for (const [key, sql] of Object.entries(queries)) {
    const result = await database.query(sql, [zoneId]);
    trends[key] = result.rows;
  }

  res.json({
    zone_id: zoneId,
    timeframe: `Last ${daysBack} days`,
    trends
  });
});

// ===== ANÁLISIS DE RIESGOS POLÍTICOS =====

export const analyzePoliticalRisks = asyncHandler(async (req, res) => {
  const { zoneId } = req.params;

  // Análisis de urgencia y negatividad
  const riskAnalysis = await database.query(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(CASE WHEN request_type = 'complaint' THEN 1 ELSE 0 END) as complaints,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      AVG(urgency) as avg_urgency,
      (SUM(CASE WHEN request_type = 'complaint' THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as complaint_rate
    FROM citizen_requests
    WHERE zone_id = $1
  `, [zoneId]);

  // Análisis de sentimiento negativo en reportes
  const sentimentAnalysis = await database.query(`
    SELECT 
      COUNT(*) as total_reports,
      SUM(CASE WHEN observations LIKE '%problema%' OR observations LIKE '%riesgo%' THEN 1 ELSE 0 END) as negative_reports
    FROM field_reports
    WHERE zone_id = $1 AND report_date >= CURRENT_DATE - INTERVAL '30 days'
  `, [zoneId]);

  const data = riskAnalysis.rows[0];
  const negative = sentimentAnalysis.rows[0];

  // Calcular índice de riesgo (0-100)
  let riskScore = 0;
  if (data.total_requests > 0) {
    riskScore += (data.complaint_rate / 100) * 40; // 40% del peso
    riskScore += ((data.avg_urgency || 0) / 5) * 30; // 30% del peso
    riskScore += (data.pending / data.total_requests * 100 / 100) * 30; // 30% del peso
  }

  const riskLevel = riskScore > 70 ? 'CRITICAL' : riskScore > 50 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW';

  res.json({
    zone_id: zoneId,
    risk_index: parseFloat(riskScore.toFixed(2)),
    risk_level: riskLevel,
    analysis: {
      totalRequests: parseInt(data.total_requests),
      complaints: parseInt(data.complaints || 0),
      complaintRate: parseFloat(data.complaint_rate || 0).toFixed(2) + '%',
      pendingRequests: parseInt(data.pending || 0),
      averageUrgency: parseFloat(data.avg_urgency || 0).toFixed(2),
      negativeReports: parseInt(negative.negative_reports || 0)
    },
    recommendations: generateRiskRecommendations(riskLevel)
  });
});

function generateRiskRecommendations(riskLevel) {
  switch (riskLevel) {
    case 'CRITICAL':
      return [
        'Activar equipo de respuesta inmediata',
        'Aumentar presencia territorial',
        'Intensificar comunicación con líderes',
        'Monitor 24/7 de nuevos casos'
      ];
    case 'HIGH':
      return [
        'Aumentar frecuencia de reportes',
        'Reforzar presencia en territorio',
        'Análisis de causas raíz',
        'Plan de acción inmediato'
      ];
    case 'MEDIUM':
      return [
        'Monitoreo constante',
        'Plan de intervención preventiva',
        'Comunicación regular',
        'Evaluación semanal'
      ];
    default:
      return [
        'Continuar monitoreo normal',
        'Mantener actividades planeadas',
        'Reportes mensuales'
      ];
  }
}

// ===== ALERTAS ESTRATÉGICAS =====

export const createStrategicAlert = asyncHandler(async (req, res) => {
  const { title, alertType, severity, zoneId, description, thresholdValue, currentValue, recommendation } = req.body;

  const result = await database.query(
    `INSERT INTO strategic_alerts 
     (title, alert_type, severity, zone_id, description, threshold_value, current_value, recommendation, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
     RETURNING *`,
    [title, alertType, severity, zoneId, description, thresholdValue, currentValue, recommendation]
  );

  res.status(201).json({
    message: 'Alerta creada',
    alert: result.rows[0]
  });
});

export const getActiveAlerts = asyncHandler(async (req, res) => {
  const { zoneId, severity } = req.query;

  let query = 'SELECT * FROM strategic_alerts WHERE status = "active"';
  const values = [];

  if (zoneId) {
    values.push(zoneId);
    query += ` AND zone_id = $${values.length}`;
  }
  if (severity) {
    values.push(severity);
    query += ` AND severity = $${values.length}`;
  }

  const result = await database.query(query + ' ORDER BY created_at DESC', values);

  res.json({
    data: result.rows,
    total: result.rows.length
  });
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  const result = await database.query(
    `UPDATE strategic_alerts SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [req.user.id, alertId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Alerta no encontrada', 404, 'ALERT_NOT_FOUND');
  }

  res.json({
    message: 'Alerta reconocida',
    alert: result.rows[0]
  });
});

// ===== LÍDERES SOCIALES =====

export const getSocialLeaders = asyncHandler(async (req, res) => {
  const { zoneId, influenceLevel } = req.query;

  let query = 'SELECT * FROM social_leaders WHERE 1=1';
  const values = [];

  if (zoneId) {
    values.push(zoneId);
    query += ` AND zone_id = $${values.length}`;
  }
  if (influenceLevel) {
    values.push(influenceLevel);
    query += ` AND influence_level = $${values.length}`;
  }

  const result = await database.query(query + ' ORDER BY influence_level DESC', values);

  res.json({ data: result.rows });
});

export const recordSocialLeader = asyncHandler(async (req, res) => {
  const { name, organization, zoneId, influenceLevel, contactPhone, contactEmail, areaOfInfluence } = req.body;

  const result = await database.query(
    `INSERT INTO social_leaders (name, organization, zone_id, influence_level, contact_phone, contact_email, area_of_influence, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     RETURNING *`,
    [name, organization, zoneId, influenceLevel, contactPhone, contactEmail, areaOfInfluence]
  );

  res.status(201).json({
    message: 'Líder registrado',
    leader: result.rows[0]
  });
});

// ===== SEGUIMIENTO DE COMPROMISOS =====

export const getCommitments = asyncHandler(async (req, res) => {
  const { zoneId, status } = req.query;

  let query = 'SELECT * FROM commitments WHERE 1=1';
  const values = [];

  if (zoneId) {
    values.push(zoneId);
    query += ` AND zone_id = $${values.length}`;
  }
  if (status) {
    values.push(status);
    query += ` AND status = $${values.length}`;
  }

  const result = await database.query(query + ' ORDER BY due_date ASC', values);

  res.json({ data: result.rows });
});

export const recordCommitment = asyncHandler(async (req, res) => {
  const { commitmentType, title, description, committedTo, zoneId, dueDate } = req.body;

  const result = await database.query(
    `INSERT INTO commitments (commitment_type, title, description, committed_to, committed_by, zone_id, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [commitmentType, title, description, committedTo, req.user.id, zoneId, dueDate]
  );

  res.status(201).json({
    message: 'Compromiso registrado',
    commitment: result.rows[0]
  });
});

export const completeCommitment = asyncHandler(async (req, res) => {
  const { commitmentId } = req.params;
  const { notes } = req.body;

  const result = await database.query(
    `UPDATE commitments SET status = 'completed', completion_date = CURRENT_DATE, notes = $1 WHERE id = $2 RETURNING *`,
    [notes, commitmentId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Compromiso no encontrado', 404, 'COMMITMENT_NOT_FOUND');
  }

  res.json({
    message: 'Compromiso completado',
    commitment: result.rows[0]
  });
});
