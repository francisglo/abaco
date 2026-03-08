import database from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { computeDataQualityScore, computeDescriptiveStats, roundTo } from '../utils/analyticsMath.js';

const VALID_TYPES = ['voters', 'citizen_requests', 'events', 'field_reports'];

const ROLE_PROFILES = {
  admin: {
    label: 'Administrador',
    weights: { pressure: 0.28, executionGap: 0.26, trendRisk: 0.18, engagementGap: 0.12, backlogRisk: 0.16 }
  },
  manager: {
    label: 'Jefe de campaña',
    weights: { pressure: 0.32, executionGap: 0.27, trendRisk: 0.17, engagementGap: 0.10, backlogRisk: 0.14 }
  },
  campaign_manager: {
    label: 'Jefe de campaña',
    weights: { pressure: 0.32, executionGap: 0.27, trendRisk: 0.17, engagementGap: 0.10, backlogRisk: 0.14 }
  },
  visitor: {
    label: 'Visitante',
    weights: { pressure: 0.20, executionGap: 0.15, trendRisk: 0.15, engagementGap: 0.35, backlogRisk: 0.15 }
  },
  viewer: {
    label: 'Visitante',
    weights: { pressure: 0.20, executionGap: 0.15, trendRisk: 0.15, engagementGap: 0.35, backlogRisk: 0.15 }
  },
  auditor: {
    label: 'Monitor de seguridad',
    weights: { pressure: 0.24, executionGap: 0.18, trendRisk: 0.22, engagementGap: 0.10, backlogRisk: 0.26 }
  },
  security_monitor: {
    label: 'Monitor de seguridad',
    weights: { pressure: 0.24, executionGap: 0.18, trendRisk: 0.22, engagementGap: 0.10, backlogRisk: 0.26 }
  },
  operator: {
    label: 'Operador',
    weights: { pressure: 0.30, executionGap: 0.28, trendRisk: 0.14, engagementGap: 0.12, backlogRisk: 0.16 }
  }
};

function parseTypes(rawTypes) {
  if (!rawTypes || rawTypes === 'all') return VALID_TYPES;
  const types = String(rawTypes)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const valid = types.filter((item) => VALID_TYPES.includes(item));
  return valid.length ? valid : VALID_TYPES;
}

function parseZoneId(rawZoneId) {
  if (!rawZoneId) return null;
  const zoneId = Number(rawZoneId);
  return Number.isFinite(zoneId) ? zoneId : null;
}

function clampScore(value, min = 0, max = 100) {
  const numeric = Number(value) || 0;
  return Math.min(Math.max(numeric, min), max);
}

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (!normalized) return 'operator';
  return ROLE_PROFILES[normalized] ? normalized : 'operator';
}

function computeDecisionScore(metrics, weights) {
  return roundTo(
    (metrics.pressure_score * weights.pressure)
      + (metrics.execution_gap_score * weights.executionGap)
      + (metrics.trend_risk_score * weights.trendRisk)
      + (metrics.engagement_gap_score * weights.engagementGap)
      + (metrics.backlog_risk_score * weights.backlogRisk),
    2
  );
}

function classifyPriority(score) {
  if (score >= 70) return 'CRÍTICA';
  if (score >= 50) return 'ALTA';
  if (score >= 30) return 'MEDIA';
  return 'CONTROLADA';
}

function projectFutureValue(currentValue, previousValue, horizonDays) {
  const current = Number(currentValue) || 0;
  const previous = Number(previousValue) || 0;
  const slopePer30Days = current - previous;
  const factor = horizonDays / 30;
  return Math.max(0, roundTo(current + (slopePer30Days * factor), 2));
}

function buildRecommendations(item, roleKey) {
  const recommendations = [];
  if (item.metrics.pressure_score >= 65) {
    recommendations.push('Activar intervención territorial focalizada en solicitudes pendientes de alta urgencia.');
  }
  if (item.metrics.execution_gap_score >= 55) {
    recommendations.push('Reasignar capacidad operativa para aumentar cierre de tareas y reducir brecha de ejecución.');
  }
  if (item.metrics.trend_risk_score >= 60) {
    recommendations.push('Implementar plan preventivo de 30 días para frenar crecimiento de riesgo en la zona.');
  }
  if (item.metrics.engagement_gap_score >= 55) {
    recommendations.push('Incrementar actividades territoriales y comunicación de proximidad para mejorar participación.');
  }
  if (item.metrics.backlog_risk_score >= 55) {
    recommendations.push('Configurar célula de respuesta rápida para disminuir el backlog operativo acumulado.');
  }

  if (roleKey === 'visitor' || roleKey === 'viewer') {
    recommendations.unshift('Priorizar acciones de visibilidad pública y seguimiento ciudadano del estado de servicio.');
  }
  if (roleKey === 'auditor' || roleKey === 'security_monitor') {
    recommendations.unshift('Aumentar trazabilidad y revisión de consistencia de datos para minimizar riesgo operativo.');
  }

  if (!recommendations.length) {
    recommendations.push('Mantener estrategia actual y monitorear semanalmente los indicadores para decisiones tempranas.');
  }

  return recommendations.slice(0, 4);
}

export const getGeoStatSummary = asyncHandler(async (req, res) => {
  const types = parseTypes(req.query.types);
  const zoneId = parseZoneId(req.query.zone_id);

  const summaryQuery = `
    WITH filtered AS (
      SELECT entity_type, zone_id, geom
      FROM geo_entities
      WHERE entity_type = ANY($1::text[])
        AND ($2::int IS NULL OR zone_id = $2)
    ),
    centroid AS (
      SELECT ST_Centroid(ST_Collect(geom)) AS centroid_geom
      FROM filtered
    ),
    distances AS (
      SELECT
        f.entity_type,
        ST_Distance(f.geom::geography, c.centroid_geom::geography) AS distance_meters
      FROM filtered f
      CROSS JOIN centroid c
      WHERE c.centroid_geom IS NOT NULL
    )
    SELECT
      (SELECT COUNT(*)::int FROM filtered) AS total_points,
      (SELECT COUNT(DISTINCT zone_id)::int FROM filtered WHERE zone_id IS NOT NULL) AS total_zones,
      (SELECT jsonb_object_agg(entity_type, cnt)
       FROM (
         SELECT entity_type, COUNT(*)::int AS cnt
         FROM filtered
         GROUP BY entity_type
       ) grouped) AS distribution,
      (SELECT ST_X(centroid_geom) FROM centroid) AS centroid_lng,
      (SELECT ST_Y(centroid_geom) FROM centroid) AS centroid_lat,
      (SELECT ST_Extent(geom)::text FROM filtered) AS bbox,
      (SELECT AVG(distance_meters) FROM distances) AS avg_distance_m,
      (SELECT STDDEV_POP(distance_meters) FROM distances) AS stddev_distance_m,
      (SELECT MAX(distance_meters) FROM distances) AS max_distance_m
  `;

  const summaryResult = await database.queryOne(summaryQuery, [types, zoneId]);
  const totalPoints = Number(summaryResult?.total_points || 0);

  if (totalPoints === 0) {
    return res.json({
      filters: { types, zone_id: zoneId },
      summary: {
        total_points: 0,
        total_zones: 0,
        distribution: {},
        centroid: null,
        bbox: null,
        compactness: {
          avg_distance_m: 0,
          stddev_distance_m: 0,
          max_distance_m: 0
        }
      }
    });
  }

  res.json({
    filters: { types, zone_id: zoneId },
    summary: {
      total_points: totalPoints,
      total_zones: Number(summaryResult?.total_zones || 0),
      distribution: summaryResult?.distribution || {},
      centroid: {
        lat: roundTo(summaryResult?.centroid_lat, 8),
        lng: roundTo(summaryResult?.centroid_lng, 8)
      },
      bbox: summaryResult?.bbox || null,
      compactness: {
        avg_distance_m: roundTo(summaryResult?.avg_distance_m, 2),
        stddev_distance_m: roundTo(summaryResult?.stddev_distance_m, 2),
        max_distance_m: roundTo(summaryResult?.max_distance_m, 2)
      }
    }
  });
});

export const getGeoDensityGrid = asyncHandler(async (req, res) => {
  const types = parseTypes(req.query.types);
  const zoneId = parseZoneId(req.query.zone_id);
  const cellMeters = Math.min(Math.max(parseInt(req.query.cell_meters, 10) || 500, 100), 5000);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 300, 1), 2000);

  const densityQuery = `
    WITH filtered AS (
      SELECT geom
      FROM geo_entities
      WHERE entity_type = ANY($1::text[])
        AND ($2::int IS NULL OR zone_id = $2)
    ),
    gridded AS (
      SELECT ST_SnapToGrid(ST_Transform(geom, 3857), $3) AS cell_geom
      FROM filtered
    )
    SELECT
      ST_Y(ST_Transform(cell_geom, 4326)) AS lat,
      ST_X(ST_Transform(cell_geom, 4326)) AS lng,
      COUNT(*)::int AS point_count
    FROM gridded
    GROUP BY cell_geom
    ORDER BY point_count DESC
    LIMIT $4
  `;

  const { rows } = await database.query(densityQuery, [types, zoneId, cellMeters, limit]);

  const counts = rows.map((item) => Number(item.point_count || 0));
  const stats = computeDescriptiveStats(counts);

  res.json({
    filters: { types, zone_id: zoneId, cell_meters: cellMeters, limit },
    grid: rows.map((item, index) => ({
      id: `grid-${index + 1}`,
      lat: roundTo(item.lat, 8),
      lng: roundTo(item.lng, 8),
      point_count: Number(item.point_count || 0)
    })),
    stats
  });
});

export const getGeoQualityReport = asyncHandler(async (_req, res) => {
  const qualityQuery = `
    WITH metrics AS (
      SELECT
        'voters'::text AS entity_type,
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::int AS missing_coordinates,
        COUNT(*) FILTER (
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            AND (latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180)
        )::int AS invalid_coordinates,
        (
          SELECT COUNT(*)::int
          FROM (
            SELECT latitude, longitude
            FROM voters
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            GROUP BY latitude, longitude
            HAVING COUNT(*) > 1
          ) dup
        ) AS duplicated_coordinates
      FROM voters

      UNION ALL

      SELECT
        'citizen_requests'::text AS entity_type,
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::int AS missing_coordinates,
        COUNT(*) FILTER (
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            AND (latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180)
        )::int AS invalid_coordinates,
        (
          SELECT COUNT(*)::int
          FROM (
            SELECT latitude, longitude
            FROM citizen_requests
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            GROUP BY latitude, longitude
            HAVING COUNT(*) > 1
          ) dup
        ) AS duplicated_coordinates
      FROM citizen_requests

      UNION ALL

      SELECT
        'events'::text AS entity_type,
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::int AS missing_coordinates,
        COUNT(*) FILTER (
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            AND (latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180)
        )::int AS invalid_coordinates,
        (
          SELECT COUNT(*)::int
          FROM (
            SELECT latitude, longitude
            FROM events
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            GROUP BY latitude, longitude
            HAVING COUNT(*) > 1
          ) dup
        ) AS duplicated_coordinates
      FROM events

      UNION ALL

      SELECT
        'field_reports'::text AS entity_type,
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL)::int AS missing_coordinates,
        COUNT(*) FILTER (
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            AND (latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180)
        )::int AS invalid_coordinates,
        (
          SELECT COUNT(*)::int
          FROM (
            SELECT latitude, longitude
            FROM field_reports
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            GROUP BY latitude, longitude
            HAVING COUNT(*) > 1
          ) dup
        ) AS duplicated_coordinates
      FROM field_reports
    )
    SELECT * FROM metrics
    ORDER BY entity_type ASC
  `;

  const { rows } = await database.query(qualityQuery);

  const modules = rows.map((row) => ({
    entity_type: row.entity_type,
    total_records: Number(row.total_records || 0),
    missing_coordinates: Number(row.missing_coordinates || 0),
    invalid_coordinates: Number(row.invalid_coordinates || 0),
    duplicated_coordinates: Number(row.duplicated_coordinates || 0),
    score: computeDataQualityScore({
      totalRecords: row.total_records,
      missingCoordinates: row.missing_coordinates,
      invalidCoordinates: row.invalid_coordinates,
      duplicatedCoordinates: row.duplicated_coordinates
    })
  }));

  const globalTotals = modules.reduce((acc, item) => {
    acc.total_records += item.total_records;
    acc.missing_coordinates += item.missing_coordinates;
    acc.invalid_coordinates += item.invalid_coordinates;
    acc.duplicated_coordinates += item.duplicated_coordinates;
    return acc;
  }, {
    total_records: 0,
    missing_coordinates: 0,
    invalid_coordinates: 0,
    duplicated_coordinates: 0
  });

  const globalScore = computeDataQualityScore({
    totalRecords: globalTotals.total_records,
    missingCoordinates: globalTotals.missing_coordinates,
    invalidCoordinates: globalTotals.invalid_coordinates,
    duplicatedCoordinates: globalTotals.duplicated_coordinates
  });

  res.json({
    generated_at: new Date().toISOString(),
    modules,
    global: {
      ...globalTotals,
      score: globalScore
    }
  });
});

export const saveAnalyticsSnapshot = asyncHandler(async (req, res) => {
  const { snapshot_type, zone_id, payload } = req.body || {};

  if (!snapshot_type || typeof snapshot_type !== 'string') {
    throw new AppError('snapshot_type es requerido', 400, 'VALIDATION_ERROR');
  }

  if (!payload || typeof payload !== 'object') {
    throw new AppError('payload es requerido', 400, 'VALIDATION_ERROR');
  }

  const result = await database.queryOne(
    `
      INSERT INTO analytics_snapshots (snapshot_type, zone_id, payload, created_by)
      VALUES ($1, $2, $3::jsonb, $4)
      RETURNING id, snapshot_type, zone_id, payload, created_by, created_at
    `,
    [snapshot_type.trim(), zone_id || null, JSON.stringify(payload), req.user?.id || null]
  );

  res.status(201).json({
    message: 'Snapshot analítico guardado',
    snapshot: result
  });
});

export const getStrategicDecisionEngine = asyncHandler(async (req, res) => {
  const roleKey = normalizeRole(req.query.role || req.user?.role);
  const roleProfile = ROLE_PROFILES[roleKey];
  const zoneId = parseZoneId(req.query.zone_id);
  const horizonDays = Math.min(Math.max(parseInt(req.query.horizon_days, 10) || 45, 15), 180);
  const maxScenarios = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);

  const decisionQuery = `
    WITH requests_curr AS (
      SELECT zone_id,
             COUNT(*)::int AS total_curr,
             COUNT(*) FILTER (WHERE status <> 'resolved')::int AS pending_curr,
             COUNT(*) FILTER (WHERE urgency >= 4)::int AS high_urgency_curr
      FROM citizen_requests
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY zone_id
    ),
    requests_prev AS (
      SELECT zone_id,
             COUNT(*)::int AS total_prev
      FROM citizen_requests
      WHERE created_at >= NOW() - INTERVAL '60 days'
        AND created_at < NOW() - INTERVAL '30 days'
      GROUP BY zone_id
    ),
    tasks_curr AS (
      SELECT zone_id,
             COUNT(*)::int AS tasks_curr,
             COUNT(*) FILTER (WHERE status = 'completed' OR completed = true)::int AS tasks_completed_curr,
             COUNT(*) FILTER (WHERE status <> 'completed' AND completed = false)::int AS tasks_open_curr
      FROM tasks t
      JOIN users u ON u.id = t.assigned_to
      GROUP BY zone_id
    ),
    events_curr AS (
      SELECT zone_id,
             COUNT(*)::int AS events_curr
      FROM events
      WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY zone_id
    ),
    reports_curr AS (
      SELECT zone_id,
             COUNT(*)::int AS reports_curr
      FROM field_reports
      WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY zone_id
    ),
    voters_base AS (
      SELECT zone_id,
             COUNT(*)::int AS voters_total
      FROM voters
      GROUP BY zone_id
    )
    SELECT
      z.id AS zone_id,
      z.name AS zone_name,
      z.priority AS zone_priority,
      COALESCE(rc.total_curr, 0) AS requests_curr,
      COALESCE(rp.total_prev, 0) AS requests_prev,
      COALESCE(rc.pending_curr, 0) AS pending_curr,
      COALESCE(rc.high_urgency_curr, 0) AS high_urgency_curr,
      COALESCE(tc.tasks_curr, 0) AS tasks_curr,
      COALESCE(tc.tasks_completed_curr, 0) AS tasks_completed_curr,
      COALESCE(tc.tasks_open_curr, 0) AS tasks_open_curr,
      COALESCE(ec.events_curr, 0) AS events_curr,
      COALESCE(fc.reports_curr, 0) AS reports_curr,
      COALESCE(vb.voters_total, 0) AS voters_total
    FROM zones z
    LEFT JOIN requests_curr rc ON rc.zone_id = z.id
    LEFT JOIN requests_prev rp ON rp.zone_id = z.id
    LEFT JOIN tasks_curr tc ON tc.zone_id = z.id
    LEFT JOIN events_curr ec ON ec.zone_id = z.id
    LEFT JOIN reports_curr fc ON fc.zone_id = z.id
    LEFT JOIN voters_base vb ON vb.zone_id = z.id
    WHERE ($1::int IS NULL OR z.id = $1)
    ORDER BY z.priority ASC, z.id ASC
  `;

  const { rows } = await database.query(decisionQuery, [zoneId]);

  if (!rows.length) {
    throw new AppError('No hay datos de zonas para análisis estratégico', 404, 'NO_ZONE_DATA');
  }

  const scenarioItems = rows.map((item) => {
    const requestsCurr = Number(item.requests_curr || 0);
    const requestsPrev = Number(item.requests_prev || 0);
    const pendingCurr = Number(item.pending_curr || 0);
    const highUrgencyCurr = Number(item.high_urgency_curr || 0);
    const tasksCurr = Number(item.tasks_curr || 0);
    const tasksCompletedCurr = Number(item.tasks_completed_curr || 0);
    const tasksOpenCurr = Number(item.tasks_open_curr || 0);
    const eventsCurr = Number(item.events_curr || 0);
    const reportsCurr = Number(item.reports_curr || 0);
    const votersTotal = Number(item.voters_total || 0);

    const executionRate = tasksCurr > 0 ? (tasksCompletedCurr / tasksCurr) * 100 : 50;
    const trendPercent = requestsPrev > 0
      ? ((requestsCurr - requestsPrev) / requestsPrev) * 100
      : (requestsCurr > 0 ? 100 : 0);

    const metrics = {
      pressure_score: clampScore((pendingCurr * 4.2) + (highUrgencyCurr * 6.5)),
      execution_gap_score: clampScore(100 - executionRate),
      trend_risk_score: clampScore(Math.max(0, trendPercent)),
      engagement_gap_score: clampScore(100 - Math.min(100, (eventsCurr * 8) + (reportsCurr * 5))),
      backlog_risk_score: clampScore((tasksOpenCurr * 5) + (pendingCurr * 2.5))
    };

    const decisionScore = computeDecisionScore(metrics, roleProfile.weights);
    const forecast = {
      requests_next_horizon: projectFutureValue(requestsCurr, requestsPrev, horizonDays),
      pending_next_horizon: projectFutureValue(pendingCurr, Math.max(0, pendingCurr - Math.round(tasksCompletedCurr / 2)), horizonDays),
      engagement_next_horizon: Math.max(0, roundTo((eventsCurr + reportsCurr) + ((eventsCurr - Math.max(0, eventsCurr - 2)) * (horizonDays / 30)), 2))
    };

    const confidence = clampScore(
      40
      + (Math.min(votersTotal, 1500) / 1500) * 25
      + (Math.min(requestsCurr + tasksCurr + eventsCurr, 300) / 300) * 25
      - (Math.abs(trendPercent) > 80 ? 8 : 0)
    );

    return {
      zone_id: Number(item.zone_id),
      zone_name: item.zone_name,
      zone_priority: Number(item.zone_priority || 0),
      decision_score: decisionScore,
      priority_level: classifyPriority(decisionScore),
      confidence_percent: roundTo(confidence, 2),
      metrics: {
        ...metrics,
        requests_curr: requestsCurr,
        requests_prev: requestsPrev,
        trend_percent: roundTo(trendPercent, 2),
        execution_rate_percent: roundTo(executionRate, 2),
        voters_total: votersTotal,
        events_curr: eventsCurr,
        reports_curr: reportsCurr,
        tasks_open_curr: tasksOpenCurr,
        pending_curr: pendingCurr
      },
      forecast,
      recommendations: []
    };
  });

  const decisionScores = scenarioItems.map((item) => item.decision_score);
  const stats = computeDescriptiveStats(decisionScores);

  const prioritized = scenarioItems
    .sort((a, b) => {
      if (b.decision_score !== a.decision_score) return b.decision_score - a.decision_score;
      return a.zone_priority - b.zone_priority;
    })
    .slice(0, maxScenarios)
    .map((item) => ({
      ...item,
      recommendations: buildRecommendations(item, roleKey)
    }));

  const timeline = [
    { horizon_days: 15 },
    { horizon_days: Math.round(horizonDays / 2) },
    { horizon_days: horizonDays }
  ].map((point) => {
    const projectedRiskIndex = roundTo(
      prioritized.reduce((acc, item) => {
        const factor = point.horizon_days / horizonDays;
        return acc + (item.decision_score * factor);
      }, 0) / Math.max(prioritized.length, 1),
      2
    );

    return {
      horizon_days: point.horizon_days,
      projected_risk_index: projectedRiskIndex,
      projected_priority: classifyPriority(projectedRiskIndex)
    };
  });

  res.json({
    generated_at: new Date().toISOString(),
    role_context: {
      role: roleKey,
      label: roleProfile.label,
      weights: roleProfile.weights
    },
    filters: {
      zone_id: zoneId,
      horizon_days: horizonDays,
      limit: maxScenarios
    },
    score_distribution: stats,
    scenarios: prioritized,
    future_timeline: timeline
  });
});
