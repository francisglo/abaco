import database from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import axios from 'axios';
import nodemailer from 'nodemailer';

function clamp(value, min = 0, max = 100) {
  const numeric = Number(value) || 0;
  return Math.max(min, Math.min(max, numeric));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNum(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeRatio(a, b) {
  const denominator = Number(b || 0);
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return Number(a || 0) / denominator;
}

function classifyBand(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'controlled';
}

function severityToPriority(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function normalizeAgainstMax(value, maxValue) {
  const numericMax = Number(maxValue || 0);
  if (!Number.isFinite(numericMax) || numericMax <= 0) return 0;
  return clamp((Number(value || 0) / numericMax) * 100);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const numbers = [lat1, lng1, lat2, lng2].map((item) => Number(item));
  if (numbers.some((item) => !Number.isFinite(item))) return null;

  const [aLat, aLng, bLat, bLng] = numbers;
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const q = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  return R * c;
}

async function fetchZoneRows(zoneIdFilter = null) {
  const query = `
    WITH voter_stats AS (
      SELECT
        zone_id,
        COUNT(*)::int AS padron_total,
        COUNT(*) FILTER (WHERE status IS NOT NULL AND LOWER(status) <> 'pending')::int AS participants
      FROM voters
      GROUP BY zone_id
    ),
    request_stats AS (
      SELECT
        zone_id,
        COUNT(*)::int AS requests_total,
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress'))::int AS requests_open,
        AVG(COALESCE(urgency, 3))::numeric AS avg_urgency
      FROM citizen_requests
      GROUP BY zone_id
    ),
    task_stats AS (
      SELECT
        u.zone_id,
        COUNT(t.*)::int AS tasks_total,
        COUNT(*) FILTER (WHERE t.status IN ('pending', 'in_progress') OR t.completed = false)::int AS tasks_open,
        COUNT(*) FILTER (
          WHERE (t.status IN ('pending', 'in_progress') OR t.completed = false)
            AND t.due_date IS NOT NULL
            AND t.due_date < CURRENT_DATE
        )::int AS overdue_tasks
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id
      GROUP BY u.zone_id
    ),
    operator_stats AS (
      SELECT
        zone_id,
        COUNT(*) FILTER (WHERE active = true AND role IN ('operator', 'manager'))::int AS active_operators
      FROM users
      GROUP BY zone_id
    ),
    centroids AS (
      SELECT
        zone_id,
        ST_Y(ST_Centroid(ST_Collect(geom)))::double precision AS center_lat,
        ST_X(ST_Centroid(ST_Collect(geom)))::double precision AS center_lng
      FROM geo_entities
      WHERE zone_id IS NOT NULL
      GROUP BY zone_id
    )
    SELECT
      z.id AS zone_id,
      z.name AS zone_name,
      COALESCE(v.padron_total, 0) AS padron_total,
      COALESCE(v.participants, 0) AS participants,
      COALESCE(r.requests_total, 0) AS requests_total,
      COALESCE(r.requests_open, 0) AS requests_open,
      COALESCE(r.avg_urgency, 0) AS avg_urgency,
      COALESCE(t.tasks_total, 0) AS tasks_total,
      COALESCE(t.tasks_open, 0) AS tasks_open,
      COALESCE(t.overdue_tasks, 0) AS overdue_tasks,
      COALESCE(o.active_operators, 0) AS active_operators,
      c.center_lat,
      c.center_lng
    FROM zones z
    LEFT JOIN voter_stats v ON v.zone_id = z.id
    LEFT JOIN request_stats r ON r.zone_id = z.id
    LEFT JOIN task_stats t ON t.zone_id = z.id
    LEFT JOIN operator_stats o ON o.zone_id = z.id
    LEFT JOIN centroids c ON c.zone_id = z.id
    WHERE ($1::int IS NULL OR z.id = $1)
    ORDER BY z.id ASC
  `;

  const { rows } = await database.query(query, [zoneIdFilter]);
  return rows || [];
}

function buildMetrics(row, expectedTurnoutDelta = 0) {
  const padronTotal = Number(row.padron_total || 0);
  const participants = Number(row.participants || 0);
  const requestsOpen = Number(row.requests_open || 0);
  const tasksOpen = Number(row.tasks_open || 0);
  const overdueTasks = Number(row.overdue_tasks || 0);
  const avgUrgency = Number(row.avg_urgency || 0);
  const operators = Number(row.active_operators || 0);
  const participationRate = padronTotal > 0 ? (participants / padronTotal) * 100 : 0;
  const baselineGap = clamp(100 - participationRate);
  const participationGap = clamp(baselineGap - Number(expectedTurnoutDelta || 0));
  const openPressure = requestsOpen + tasksOpen;
  const coveragePressure = operators > 0 ? openPressure / operators : openPressure;

  return {
    padronTotal,
    participants,
    requestsOpen,
    tasksOpen,
    overdueTasks,
    avgUrgency,
    operators,
    participationRate,
    participationGap,
    openPressure,
    coveragePressure,
    centerLat: toNum(row.center_lat, null),
    centerLng: toNum(row.center_lng, null)
  };
}

function buildGlobal(zoneData) {
  return {
    maxRequestsOpen: Math.max(1, ...zoneData.map((item) => item.metrics.requestsOpen)),
    maxOverdueTasks: Math.max(1, ...zoneData.map((item) => item.metrics.overdueTasks)),
    maxOpenPressure: Math.max(1, ...zoneData.map((item) => item.metrics.openPressure)),
    maxCoveragePressure: Math.max(1, ...zoneData.map((item) => item.metrics.coveragePressure)),
    maxTaskPerOperator: Math.max(1, ...zoneData.map((item) => (item.metrics.operators > 0 ? item.metrics.tasksOpen / item.metrics.operators : item.metrics.tasksOpen))),
    maxOpenPerOperator: Math.max(1, ...zoneData.map((item) => (item.metrics.operators > 0 ? item.metrics.openPressure / item.metrics.operators : item.metrics.openPressure)))
  };
}

function computePredictiveRisk(metrics, global, horizonDays = 45) {
  const demand = normalizeAgainstMax(metrics.requestsOpen, global.maxRequestsOpen);
  const backlog = normalizeAgainstMax(metrics.overdueTasks, global.maxOverdueTasks);
  const coverage = normalizeAgainstMax(metrics.coveragePressure, global.maxCoveragePressure);
  const urgency = clamp((metrics.avgUrgency / 5) * 100);
  const turnoutGap = clamp(metrics.participationGap);
  const horizonFactor = clamp(horizonDays / 45, 0.5, 3);

  return round(clamp(
    (demand * 0.25)
    + (backlog * 0.23)
    + (coverage * 0.2)
    + (urgency * 0.17)
    + (turnoutGap * 0.15)
    + ((horizonFactor - 1) * 8)
  ));
}

function computeOptimizationScore(metrics, global, brigades = 12, budget = 120000) {
  const demand = normalizeAgainstMax(metrics.requestsOpen, global.maxRequestsOpen);
  const backlog = normalizeAgainstMax(metrics.overdueTasks, global.maxOverdueTasks);
  const turnoutGap = clamp(metrics.participationGap);
  const coverage = normalizeAgainstMax(metrics.coveragePressure, global.maxCoveragePressure);

  const brigadeRelief = clamp((Number(brigades || 0) / 12) * 100, 0, 220);
  const budgetRelief = clamp((Number(budget || 0) / 120000) * 100, 0, 300);

  return round(clamp(
    (demand * 0.34)
    + (backlog * 0.29)
    + (turnoutGap * 0.2)
    + (coverage * 0.17)
    - (brigadeRelief * 0.06)
    - (budgetRelief * 0.04)
  ));
}

function estimateActionCost(priority, optimizationScore) {
  const base = priority === 'critical' ? 35000 : priority === 'high' ? 18000 : priority === 'medium' ? 9000 : 4000;
  return round(base + (Number(optimizationScore || 0) * 140), 2);
}

function buildRecommendations(zoneScored, limit = 10) {
  return zoneScored
    .sort((a, b) => b.composite_score - a.composite_score)
    .slice(0, limit)
    .map((item, index) => {
      const priority = severityToPriority(item.composite_score);
      const ownerRole = priority === 'critical' ? 'manager' : priority === 'high' ? 'operator' : 'viewer';
      const estimatedCost = estimateActionCost(priority, item.optimization_score);
      return {
        recommendation_id: `rec-${item.zone_id}-${index + 1}`,
        priority,
        zone_id: item.zone_id,
        zone_name: item.zone_name,
        action_title: `Intervención focalizada en ${item.zone_name}`,
        rationale: `Riesgo ${item.predictive_risk_score} y presión operativa ${item.optimization_score}.`,
        estimated_cost: estimatedCost,
        owner_role: ownerRole,
        expected_impact_score: round(clamp((item.predictive_risk_score * 0.45) + (item.optimization_score * 0.55))),
        due_window_hours: priority === 'critical' ? 6 : priority === 'high' ? 24 : 72
      };
    });
}

function buildAlerts(zoneScored, options = {}) {
  const riskThreshold = clamp(options.riskThreshold ?? 70);
  const coverageThreshold = clamp(options.coverageThreshold ?? 60);

  return zoneScored
    .filter((item) => item.predictive_risk_score >= riskThreshold && item.coverage_signal >= coverageThreshold)
    .sort((a, b) => b.predictive_risk_score - a.predictive_risk_score)
    .map((item, index) => {
      const severity = classifyBand(item.predictive_risk_score);
      return {
        alert_id: `alert-${item.zone_id}-${index + 1}`,
        zone_id: item.zone_id,
        zone_name: item.zone_name,
        severity,
        predictive_risk_score: item.predictive_risk_score,
        coverage_signal: item.coverage_signal,
        trigger_rule: `risk >= ${riskThreshold} AND coverage >= ${coverageThreshold}`,
        notify_roles: severity === 'critical' ? ['admin', 'manager', 'operator', 'auditor'] : ['manager', 'operator', 'auditor'],
        created_at: new Date().toISOString()
      };
    });
}

function parseListEnv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildNotificationText(alerts) {
  const header = `ÁBACO · Alertas críticas detectadas: ${alerts.length}`;
  const lines = alerts.slice(0, 8).map((item, index) => (
    `${index + 1}. ${item.zone_name} | Riesgo ${item.predictive_risk_score} | Cobertura ${item.coverage_signal} | Severidad ${item.severity}`
  ));
  return [header, ...lines].join('\n');
}

function getNotificationChannelConfigStatus() {
  const webhookUrls = parseListEnv(process.env.ALERT_WEBHOOK_URLS);

  const smtp = {
    host: String(process.env.ALERT_SMTP_HOST || '').trim(),
    port: Number(process.env.ALERT_SMTP_PORT || 587),
    user: String(process.env.ALERT_SMTP_USER || '').trim(),
    pass: String(process.env.ALERT_SMTP_PASS || '').trim(),
    from: String(process.env.ALERT_EMAIL_FROM || '').trim(),
    recipients: parseListEnv(process.env.ALERT_EMAIL_TO)
  };

  const twilio = {
    sid: String(process.env.ALERT_TWILIO_ACCOUNT_SID || '').trim(),
    token: String(process.env.ALERT_TWILIO_AUTH_TOKEN || '').trim(),
    from: String(process.env.ALERT_WHATSAPP_FROM || '').trim(),
    recipients: parseListEnv(process.env.ALERT_WHATSAPP_TO)
  };

  return {
    webhook: {
      configured: webhookUrls.length > 0,
      targets: webhookUrls.length
    },
    email: {
      configured: Boolean(smtp.host && smtp.port && smtp.user && smtp.pass && smtp.from && smtp.recipients.length > 0),
      recipients: smtp.recipients.length,
      smtp_host: smtp.host || null,
      smtp_port: Number.isFinite(smtp.port) ? smtp.port : null
    },
    whatsapp: {
      configured: Boolean(twilio.sid && twilio.token && twilio.from && twilio.recipients.length > 0),
      recipients: twilio.recipients.length
    }
  };
}

async function dispatchWebhookNotifications(alerts, text, dispatchEnabled) {
  const webhookUrls = parseListEnv(process.env.ALERT_WEBHOOK_URLS);
  if (!dispatchEnabled) {
    return {
      channel: 'webhook',
      configured: webhookUrls.length > 0,
      sent: 0,
      skipped: webhookUrls.length,
      failed: 0,
      dry_run: true
    };
  }

  if (webhookUrls.length === 0) {
    return {
      channel: 'webhook',
      configured: false,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: 'missing_webhook_urls'
    };
  }

  let sent = 0;
  let failed = 0;

  for (const url of webhookUrls) {
    try {
      await axios.post(url, {
        source: 'abaco_early_alerts_v1',
        generated_at: new Date().toISOString(),
        critical_alerts_count: alerts.length,
        message: text,
        alerts
      }, {
        timeout: 10000
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    channel: 'webhook',
    configured: true,
    sent,
    skipped: 0,
    failed
  };
}

async function dispatchEmailNotifications(alerts, text, dispatchEnabled) {
  const host = String(process.env.ALERT_SMTP_HOST || '').trim();
  const port = Number(process.env.ALERT_SMTP_PORT || 587);
  const user = String(process.env.ALERT_SMTP_USER || '').trim();
  const pass = String(process.env.ALERT_SMTP_PASS || '').trim();
  const from = String(process.env.ALERT_EMAIL_FROM || '').trim();
  const recipients = parseListEnv(process.env.ALERT_EMAIL_TO);

  const configured = Boolean(host && port && user && pass && from && recipients.length > 0);

  if (!dispatchEnabled) {
    return {
      channel: 'email',
      configured,
      sent: 0,
      skipped: recipients.length,
      failed: 0,
      dry_run: true
    };
  }

  if (!configured) {
    return {
      channel: 'email',
      configured: false,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: 'missing_smtp_configuration'
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  try {
    await transporter.sendMail({
      from,
      to: recipients.join(','),
      subject: `ÁBACO Alertas Críticas (${alerts.length})`,
      text,
      html: `<pre>${text}</pre>`
    });

    return {
      channel: 'email',
      configured: true,
      sent: recipients.length,
      skipped: 0,
      failed: 0
    };
  } catch {
    return {
      channel: 'email',
      configured: true,
      sent: 0,
      skipped: 0,
      failed: recipients.length
    };
  }
}

async function dispatchWhatsAppNotifications(alerts, text, dispatchEnabled) {
  const sid = String(process.env.ALERT_TWILIO_ACCOUNT_SID || '').trim();
  const token = String(process.env.ALERT_TWILIO_AUTH_TOKEN || '').trim();
  const from = String(process.env.ALERT_WHATSAPP_FROM || '').trim();
  const toList = parseListEnv(process.env.ALERT_WHATSAPP_TO);
  const configured = Boolean(sid && token && from && toList.length > 0);

  if (!dispatchEnabled) {
    return {
      channel: 'whatsapp',
      configured,
      sent: 0,
      skipped: toList.length,
      failed: 0,
      dry_run: true
    };
  }

  if (!configured) {
    return {
      channel: 'whatsapp',
      configured: false,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: 'missing_twilio_configuration'
    };
  }

  let sent = 0;
  let failed = 0;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  for (const to of toList) {
    const body = new URLSearchParams({
      From: from,
      To: to,
      Body: text.slice(0, 1200)
    }).toString();

    try {
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        body,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    channel: 'whatsapp',
    configured: true,
    sent,
    skipped: 0,
    failed
  };
}

function buildScenarioDataset(rows, options = {}) {
  const expectedTurnoutDelta = toNum(options.expectedTurnoutDelta, 0) ?? 0;
  const horizonDays = toInt(options.horizonDays, 45) ?? 45;
  const brigades = toInt(options.brigades, 12) ?? 12;
  const budget = toNum(options.budget, 120000) ?? 120000;

  const zoneData = rows.map((row) => ({
    zone_id: Number(row.zone_id),
    zone_name: row.zone_name,
    metrics: buildMetrics(row, expectedTurnoutDelta)
  }));

  const global = buildGlobal(zoneData);

  const scored = zoneData.map((item) => {
    const predictiveRiskScore = computePredictiveRisk(item.metrics, global, horizonDays);
    const optimizationScore = computeOptimizationScore(item.metrics, global, brigades, budget);
    const coverageSignal = round(normalizeAgainstMax(item.metrics.coveragePressure, global.maxCoveragePressure));

    return {
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      predictive_risk_score: predictiveRiskScore,
      optimization_score: optimizationScore,
      coverage_signal: coverageSignal,
      composite_score: round((predictiveRiskScore * 0.55) + (optimizationScore * 0.45)),
      band: classifyBand((predictiveRiskScore * 0.55) + (optimizationScore * 0.45)),
      metrics: {
        requests_open: item.metrics.requestsOpen,
        overdue_tasks: item.metrics.overdueTasks,
        participation_gap: round(item.metrics.participationGap),
        operators: item.metrics.operators,
        avg_urgency: round(item.metrics.avgUrgency)
      },
      centroid: {
        lat: item.metrics.centerLat,
        lng: item.metrics.centerLng
      }
    };
  });

  return {
    scored,
    recommendations: buildRecommendations(scored, toInt(options.limit, 10) ?? 10),
    alerts: buildAlerts(scored, {
      riskThreshold: options.riskThreshold,
      coverageThreshold: options.coverageThreshold
    })
  };
}

function buildRoute(zoneScored, speedKmh = 28) {
  const candidates = zoneScored
    .filter((item) => Number.isFinite(item.centroid?.lat) && Number.isFinite(item.centroid?.lng))
    .sort((a, b) => b.composite_score - a.composite_score)
    .slice(0, 8)
    .map((item) => ({
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      lat: item.centroid.lat,
      lng: item.centroid.lng,
      score: item.composite_score
    }));

  if (!candidates.length) {
    return { sequence: [], total_distance_km: 0, estimated_minutes: 0 };
  }

  const pending = [...candidates];
  const sequence = [pending.shift()];
  let totalDistance = 0;

  while (pending.length > 0) {
    const last = sequence[sequence.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    pending.forEach((candidate, index) => {
      const distance = haversineKm(last.lat, last.lng, candidate.lat, candidate.lng);
      const safeDistance = Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY;
      if (safeDistance < nearestDistance) {
        nearestDistance = safeDistance;
        nearestIndex = index;
      }
    });

    const [next] = pending.splice(nearestIndex, 1);
    totalDistance += Number.isFinite(nearestDistance) ? nearestDistance : 0;
    sequence.push(next);
  }

  return {
    sequence: sequence.map((item, index) => ({
      order: index + 1,
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      score: item.score
    })),
    total_distance_km: round(totalDistance),
    estimated_minutes: round((totalDistance / Math.max(5, Number(speedKmh || 28))) * 60)
  };
}

export const runWhatIfSimulation = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const limit = Math.min(Math.max(toInt(req.query.limit, 10) ?? 10, 1), 100);
  const budget = Math.min(Math.max(toNum(req.query.budget, 120000) ?? 120000, 1000), 100000000);
  const brigades = Math.min(Math.max(toInt(req.query.brigades, 12) ?? 12, 1), 500);
  const horizonDays = Math.min(Math.max(toInt(req.query.horizon_days, 45) ?? 45, 7), 180);
  const expectedTurnoutDelta = Math.min(Math.max(toNum(req.query.expected_turnout_delta, 0) ?? 0, -35), 35);

  const rows = await fetchZoneRows(zoneIdFilter);
  const baseline = buildScenarioDataset(rows, { limit, horizonDays, brigades: 12, budget: 120000, expectedTurnoutDelta: 0 });
  const scenario = buildScenarioDataset(rows, { limit, horizonDays, brigades, budget, expectedTurnoutDelta });

  const baselineAverage = baseline.scored.length
    ? baseline.scored.reduce((acc, item) => acc + item.composite_score, 0) / baseline.scored.length
    : 0;
  const scenarioAverage = scenario.scored.length
    ? scenario.scored.reduce((acc, item) => acc + item.composite_score, 0) / scenario.scored.length
    : 0;

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_what_if_simulator_v1',
    applied_filters: {
      zone_id: zoneIdFilter,
      limit,
      horizon_days: horizonDays,
      budget,
      brigades,
      expected_turnout_delta: expectedTurnoutDelta
    },
    summary: {
      baseline_composite_avg: round(baselineAverage),
      scenario_composite_avg: round(scenarioAverage),
      delta_composite: round(scenarioAverage - baselineAverage),
      top_zone_baseline: baseline.scored[0]?.zone_name || null,
      top_zone_scenario: scenario.scored[0]?.zone_name || null
    },
    baseline: baseline.scored.slice(0, limit),
    scenario: scenario.scored.slice(0, limit),
    projected_recommendations: scenario.recommendations.slice(0, 5)
  });
});

export const getActionCenterRecommendations = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const limit = Math.min(Math.max(toInt(req.query.limit, 10) ?? 10, 1), 50);
  const horizonDays = Math.min(Math.max(toInt(req.query.horizon_days, 45) ?? 45, 7), 180);
  const budget = Math.min(Math.max(toNum(req.query.budget, 120000) ?? 120000, 1000), 100000000);
  const brigades = Math.min(Math.max(toInt(req.query.brigades, 12) ?? 12, 1), 500);

  const rows = await fetchZoneRows(zoneIdFilter);
  const dataset = buildScenarioDataset(rows, { limit, horizonDays, budget, brigades, expectedTurnoutDelta: 0 });

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_action_center_v1',
    applied_filters: {
      zone_id: zoneIdFilter,
      limit,
      horizon_days: horizonDays,
      budget,
      brigades
    },
    summary: {
      total_recommendations: dataset.recommendations.length,
      critical: dataset.recommendations.filter((item) => item.priority === 'critical').length,
      high: dataset.recommendations.filter((item) => item.priority === 'high').length
    },
    data: dataset.recommendations
  });
});

export const getEarlyAlerts = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const riskThreshold = clamp(toNum(req.query.risk_threshold, 70) ?? 70);
  const coverageThreshold = clamp(toNum(req.query.coverage_threshold, 60) ?? 60);

  const rows = await fetchZoneRows(zoneIdFilter);
  const dataset = buildScenarioDataset(rows, {
    limit: 30,
    horizonDays: toInt(req.query.horizon_days, 45) ?? 45,
    budget: toNum(req.query.budget, 120000) ?? 120000,
    brigades: toInt(req.query.brigades, 12) ?? 12,
    riskThreshold,
    coverageThreshold
  });

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_early_alerts_v1',
    thresholds: {
      risk_threshold: riskThreshold,
      coverage_threshold: coverageThreshold
    },
    summary: {
      alerts_total: dataset.alerts.length,
      critical: dataset.alerts.filter((item) => item.severity === 'critical').length,
      high: dataset.alerts.filter((item) => item.severity === 'high').length
    },
    data: dataset.alerts
  });
});

export const triggerEarlyAlertsNotifications = asyncHandler(async (req, res) => {
  const source = req.method === 'POST' ? (req.body || {}) : req.query;
  const zoneIdFilter = toInt(source.zone_id, null);
  const riskThreshold = clamp(toNum(source.risk_threshold, 70) ?? 70);
  const coverageThreshold = clamp(toNum(source.coverage_threshold, 60) ?? 60);
  const horizonDays = Math.min(Math.max(toInt(source.horizon_days, 45) ?? 45, 7), 180);
  const budget = Math.min(Math.max(toNum(source.budget, 120000) ?? 120000, 1000), 100000000);
  const brigades = Math.min(Math.max(toInt(source.brigades, 12) ?? 12, 1), 500);
  const dispatchRaw = String(source.dispatch ?? 'true').trim().toLowerCase();
  const dispatchEnabled = !['false', '0', 'off', 'no'].includes(dispatchRaw);

  const rows = await fetchZoneRows(zoneIdFilter);
  const dataset = buildScenarioDataset(rows, {
    limit: 30,
    horizonDays,
    budget,
    brigades,
    riskThreshold,
    coverageThreshold,
    expectedTurnoutDelta: 0
  });

  const criticalAlerts = dataset.alerts.filter((item) => item.severity === 'critical');
  const text = buildNotificationText(criticalAlerts);

  const [webhookResult, emailResult, whatsappResult] = await Promise.all([
    dispatchWebhookNotifications(criticalAlerts, text, dispatchEnabled),
    dispatchEmailNotifications(criticalAlerts, text, dispatchEnabled),
    dispatchWhatsAppNotifications(criticalAlerts, text, dispatchEnabled)
  ]);

  const channels = [webhookResult, emailResult, whatsappResult];
  const sentTotal = channels.reduce((acc, item) => acc + Number(item.sent || 0), 0);
  const failedTotal = channels.reduce((acc, item) => acc + Number(item.failed || 0), 0);
  const configuredChannels = channels.filter((item) => item.configured).length;

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_early_alerts_notifier_v1',
    dispatch_enabled: dispatchEnabled,
    thresholds: {
      risk_threshold: riskThreshold,
      coverage_threshold: coverageThreshold
    },
    summary: {
      total_alerts: dataset.alerts.length,
      critical_alerts: criticalAlerts.length,
      configured_channels: configuredChannels,
      notifications_sent: sentTotal,
      notifications_failed: failedTotal
    },
    notifications: channels,
    alerts: criticalAlerts
  });
});

export const getEarlyAlertsNotificationStatus = asyncHandler(async (_req, res) => {
  const channels = getNotificationChannelConfigStatus();
  const configuredChannels = Object.values(channels).filter((item) => Boolean(item.configured)).length;

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_early_alerts_notifier_status_v1',
    summary: {
      configured_channels: configuredChannels,
      total_channels: 3,
      ready_for_real_dispatch: configuredChannels > 0
    },
    channels
  });
});

export const createDecisionLogEntry = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const zoneId = toInt(body.zone_id, null);
  const priority = String(body.priority || 'medium').trim().toLowerCase();
  const ownerRole = String(body.owner_role || 'manager').trim().toLowerCase();
  const title = String(body.action_title || body.title || '').trim();
  const rationale = String(body.rationale || '').trim();
  const estimatedCost = Math.max(0, toNum(body.estimated_cost, 0) ?? 0);
  const sourceModule = String(body.source_module || 'action_center').trim();

  if (!title) {
    return res.status(400).json({ message: 'action_title es requerido' });
  }

  const payload = {
    signals: body.signals || null,
    expected_impact_score: toNum(body.expected_impact_score, null),
    due_window_hours: toInt(body.due_window_hours, null),
    recommendation_id: body.recommendation_id || null,
    extra: body.extra || null
  };

  const { rows } = await database.query(
    `INSERT INTO operational_decision_log
      (zone_id, action_title, rationale, priority, owner_role, estimated_cost, source_module, payload, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'planned', $9)
     RETURNING id, zone_id, action_title, rationale, priority, owner_role, estimated_cost, source_module, payload, status, outcome_note, effectiveness_score, created_by, updated_by, created_at, updated_at`,
    [
      zoneId,
      title,
      rationale,
      priority,
      ownerRole,
      estimatedCost,
      sourceModule,
      JSON.stringify(payload),
      Number(req?.user?.id || 0) || null
    ]
  );

  res.status(201).json({
    message: 'Bitácora de decisión creada',
    data: rows?.[0] || null
  });
});

export const getDecisionLogEntries = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(toInt(req.query.limit, 30) ?? 30, 1), 200);
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const statusFilter = String(req.query.status || '').trim().toLowerCase();

  const values = [];
  let where = 'WHERE 1=1';

  if (zoneIdFilter !== null) {
    values.push(zoneIdFilter);
    where += ` AND d.zone_id = $${values.length}`;
  }

  if (statusFilter) {
    values.push(statusFilter);
    where += ` AND LOWER(COALESCE(d.status, '')) = $${values.length}`;
  }

  values.push(limit);

  const query = `
    SELECT
      d.id,
      d.zone_id,
      z.name AS zone_name,
      d.action_title,
      d.rationale,
      d.priority,
      d.owner_role,
      d.estimated_cost,
      d.source_module,
      d.payload,
      d.status,
      d.outcome_note,
      d.effectiveness_score,
      d.created_by,
      uc.name AS created_by_name,
      d.updated_by,
      uu.name AS updated_by_name,
      d.created_at,
      d.updated_at
    FROM operational_decision_log d
    LEFT JOIN zones z ON z.id = d.zone_id
    LEFT JOIN users uc ON uc.id = d.created_by
    LEFT JOIN users uu ON uu.id = d.updated_by
    ${where}
    ORDER BY d.created_at DESC
    LIMIT $${values.length}
  `;

  try {
    const { rows } = await database.query(query, values);
    res.json({
      generated_at: new Date().toISOString(),
      data: rows || [],
      summary: {
        total: Array.isArray(rows) ? rows.length : 0,
        limit,
        filters: {
          zone_id: zoneIdFilter,
          status: statusFilter || null
        }
      }
    });
  } catch (error) {
    if (error?.code === '42P01') {
      return res.status(200).json({
        generated_at: new Date().toISOString(),
        data: [],
        summary: {
          total: 0,
          limit,
          filters: {
            zone_id: zoneIdFilter,
            status: statusFilter || null
          }
        },
        warning: 'Tabla de bitácora de decisiones no encontrada. Ejecuta migraciones.'
      });
    }
    throw error;
  }
});

export const updateDecisionLogEntry = asyncHandler(async (req, res) => {
  const id = toInt(req.params.id, null);
  if (!id) {
    return res.status(400).json({ message: 'id inválido' });
  }

  const body = req.body || {};
  const status = String(body.status || '').trim().toLowerCase();
  const outcomeNote = body.outcome_note == null ? null : String(body.outcome_note || '').trim();
  const effectivenessScore = body.effectiveness_score == null ? null : clamp(toNum(body.effectiveness_score, 0) ?? 0);

  const allowedStatus = new Set(['planned', 'in_progress', 'completed', 'cancelled']);
  if (status && !allowedStatus.has(status)) {
    return res.status(400).json({ message: 'status inválido' });
  }

  const { rows } = await database.query(
    `UPDATE operational_decision_log
     SET
       status = COALESCE($2, status),
       outcome_note = COALESCE($3, outcome_note),
       effectiveness_score = COALESCE($4, effectiveness_score),
       updated_by = $5,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, zone_id, action_title, rationale, priority, owner_role, estimated_cost, source_module, payload, status, outcome_note, effectiveness_score, created_by, updated_by, created_at, updated_at`,
    [
      id,
      status || null,
      outcomeNote,
      effectivenessScore,
      Number(req?.user?.id || 0) || null
    ]
  );

  if (!rows?.length) {
    return res.status(404).json({ message: 'Entrada de bitácora no encontrada' });
  }

  res.json({
    message: 'Bitácora de decisión actualizada',
    data: rows[0]
  });
});

export const getTemporalComparison = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const period = String(req.query.period || 'weekly').trim().toLowerCase() === 'monthly' ? 'month' : 'week';
  const buckets = period === 'month'
    ? Math.min(Math.max(toInt(req.query.buckets, 6) ?? 6, 3), 18)
    : Math.min(Math.max(toInt(req.query.buckets, 8) ?? 8, 4), 26);

  const rows = await fetchZoneRows(zoneIdFilter);
  const current = buildScenarioDataset(rows, {
    limit: 20,
    horizonDays: 45,
    budget: 120000,
    brigades: 12,
    expectedTurnoutDelta: 0
  });

  const activationValues = [buckets];
  let activationWhere = '';
  if (zoneIdFilter !== null) {
    activationValues.unshift(zoneIdFilter);
    activationWhere = 'WHERE l.zone_id = $1';
  }

  const activationQuery = `
    SELECT
      date_trunc('${period}', l.created_at) AS bucket_date,
      COUNT(*)::int AS activation_events,
      AVG(COALESCE(l.composite_signal, 0))::numeric AS avg_composite_signal
    FROM operational_algorithm_activation_logs l
    ${activationWhere}
    GROUP BY date_trunc('${period}', l.created_at)
    ORDER BY bucket_date DESC
    LIMIT $${activationValues.length}
  `;

  const decisionValues = [buckets];
  let decisionWhere = '';
  if (zoneIdFilter !== null) {
    decisionValues.unshift(zoneIdFilter);
    decisionWhere = 'WHERE d.zone_id = $1';
  }

  const decisionQuery = `
    SELECT
      date_trunc('${period}', d.created_at) AS bucket_date,
      COUNT(*)::int AS decisions,
      COUNT(*) FILTER (WHERE d.status = 'completed')::int AS completed,
      AVG(COALESCE(d.effectiveness_score, 0))::numeric AS avg_effectiveness
    FROM operational_decision_log d
    ${decisionWhere}
    GROUP BY date_trunc('${period}', d.created_at)
    ORDER BY bucket_date DESC
    LIMIT $${decisionValues.length}
  `;

  let activationRows = [];
  let decisionRows = [];
  const warnings = [];

  try {
    const result = await database.query(activationQuery, activationValues);
    activationRows = result.rows || [];
  } catch (error) {
    if (error?.code === '42P01') {
      warnings.push('No hay histórico de activaciones disponible');
    } else {
      throw error;
    }
  }

  try {
    const result = await database.query(decisionQuery, decisionValues);
    decisionRows = result.rows || [];
  } catch (error) {
    if (error?.code === '42P01') {
      warnings.push('No hay histórico de decisiones disponible');
    } else {
      throw error;
    }
  }

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_zone_temporal_comparison_v1',
    period: period === 'month' ? 'monthly' : 'weekly',
    buckets,
    filters: {
      zone_id: zoneIdFilter
    },
    current_snapshot: current.scored.slice(0, 10),
    trend: {
      activations: activationRows,
      decisions: decisionRows
    },
    warnings
  });
});

export const getDailyOperationsBoard = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const budget = Math.min(Math.max(toNum(req.query.budget, 120000) ?? 120000, 1000), 100000000);
  const brigades = Math.min(Math.max(toInt(req.query.brigades, 12) ?? 12, 1), 500);
  const speedKmh = Math.min(Math.max(toNum(req.query.speed_kmh, 28) ?? 28, 5), 120);

  const rows = await fetchZoneRows(zoneIdFilter);
  const dataset = buildScenarioDataset(rows, {
    limit: 20,
    horizonDays: 45,
    budget,
    brigades,
    expectedTurnoutDelta: 0,
    riskThreshold: 70,
    coverageThreshold: 60
  });

  const route = buildRoute(dataset.scored, speedKmh);

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_daily_operations_board_v1',
    context: {
      date: new Date().toISOString().slice(0, 10),
      zone_id: zoneIdFilter,
      budget,
      brigades,
      speed_kmh: speedKmh
    },
    summary: {
      top_actions: Math.min(5, dataset.recommendations.length),
      alerts: dataset.alerts.length,
      route_stops: route.sequence.length
    },
    top_actions: dataset.recommendations.slice(0, 5),
    critical_alerts: dataset.alerts.slice(0, 10),
    optimized_route: route
  });
});

export const getOperationalDataQualityReport = asyncHandler(async (_req, res) => {
  const checks = [];

  const usersWithoutZone = await database.query(
    `SELECT COUNT(*)::int AS total FROM users WHERE active = true AND role IN ('operator', 'manager') AND zone_id IS NULL`
  );
  checks.push({
    code: 'active_users_without_zone',
    severity: Number(usersWithoutZone.rows?.[0]?.total || 0) > 0 ? 'high' : 'ok',
    affected: Number(usersWithoutZone.rows?.[0]?.total || 0),
    description: 'Usuarios operativos activos sin zona asignada.'
  });

  const invalidUrgency = await database.query(
    `SELECT COUNT(*)::int AS total FROM citizen_requests WHERE urgency IS NULL OR urgency < 1 OR urgency > 5`
  );
  checks.push({
    code: 'invalid_request_urgency',
    severity: Number(invalidUrgency.rows?.[0]?.total || 0) > 0 ? 'medium' : 'ok',
    affected: Number(invalidUrgency.rows?.[0]?.total || 0),
    description: 'Solicitudes ciudadanas con urgencia faltante o fuera de rango 1-5.'
  });

  const tasksWithoutAssignee = await database.query(
    `SELECT COUNT(*)::int AS total FROM tasks WHERE assigned_to IS NULL`
  );
  checks.push({
    code: 'tasks_without_assignee',
    severity: Number(tasksWithoutAssignee.rows?.[0]?.total || 0) > 0 ? 'medium' : 'ok',
    affected: Number(tasksWithoutAssignee.rows?.[0]?.total || 0),
    description: 'Tareas sin usuario asignado.'
  });

  const votersWithoutZone = await database.query(
    `SELECT COUNT(*)::int AS total FROM voters WHERE zone_id IS NULL`
  );
  checks.push({
    code: 'voters_without_zone',
    severity: Number(votersWithoutZone.rows?.[0]?.total || 0) > 0 ? 'high' : 'ok',
    affected: Number(votersWithoutZone.rows?.[0]?.total || 0),
    description: 'Registros de votantes sin zona definida.'
  });

  const totalIssues = checks.reduce((acc, item) => acc + Number(item.affected || 0), 0);
  const weightedPenalty = checks.reduce((acc, item) => {
    const weight = item.severity === 'high' ? 1.8 : item.severity === 'medium' ? 1.2 : 0;
    return acc + (Number(item.affected || 0) * weight);
  }, 0);

  const qualityScore = clamp(100 - round(weightedPenalty * 0.8));

  res.json({
    generated_at: new Date().toISOString(),
    module: 'abaco_operational_data_quality_v1',
    summary: {
      quality_score: qualityScore,
      issues_total: totalIssues,
      checks_total: checks.length,
      high_severity: checks.filter((item) => item.severity === 'high').length,
      medium_severity: checks.filter((item) => item.severity === 'medium').length
    },
    data: checks
  });
});
