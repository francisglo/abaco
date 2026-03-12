import database from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

function normalizePriority(priority) {
  const normalized = String(priority || '').toLowerCase().trim();
  if (normalized === 'high') return 3;
  if (normalized === 'medium') return 2;
  return 1;
}

function parseTimeToMinutes(raw, fallbackMinutes) {
  const value = String(raw || '').trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallbackMinutes;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallbackMinutes;

  return (hours * 60) + minutes;
}

function formatMinutesToTime(totalMinutes) {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safe / 60) % 24;
  const mins = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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

function normalizeWeights(rawWeights = {}) {
  const defaults = {
    padron: 0.28,
    participacion: 0.2,
    solicitudes: 0.22,
    riesgo: 0.2,
    cobertura: 0.1
  };

  const merged = {
    padron: Math.max(0, toNum(rawWeights.padron, defaults.padron) ?? defaults.padron),
    participacion: Math.max(0, toNum(rawWeights.participacion, defaults.participacion) ?? defaults.participacion),
    solicitudes: Math.max(0, toNum(rawWeights.solicitudes, defaults.solicitudes) ?? defaults.solicitudes),
    riesgo: Math.max(0, toNum(rawWeights.riesgo, defaults.riesgo) ?? defaults.riesgo),
    cobertura: Math.max(0, toNum(rawWeights.cobertura, defaults.cobertura) ?? defaults.cobertura)
  };

  const sum = Object.values(merged).reduce((acc, item) => acc + item, 0);
  if (sum <= 0) return defaults;

  return {
    padron: merged.padron / sum,
    participacion: merged.participacion / sum,
    solicitudes: merged.solicitudes / sum,
    riesgo: merged.riesgo / sum,
    cobertura: merged.cobertura / sum
  };
}

function classifySemaphore(score) {
  if (score >= 70) return 'red';
  if (score >= 40) return 'yellow';
  return 'green';
}

async function fetchZoneOperationalRows(zoneIdFilter = null) {
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
      COALESCE(o.active_operators, 0) AS active_operators
    FROM zones z
    LEFT JOIN voter_stats v ON v.zone_id = z.id
    LEFT JOIN request_stats r ON r.zone_id = z.id
    LEFT JOIN task_stats t ON t.zone_id = z.id
    LEFT JOIN operator_stats o ON o.zone_id = z.id
    WHERE ($1::int IS NULL OR z.id = $1)
    ORDER BY z.id ASC
  `;

  const { rows } = await database.query(query, [zoneIdFilter]);
  return rows || [];
}

async function fetchZoneCentroids() {
  const query = `
    SELECT
      zone_id,
      ST_Y(ST_Centroid(ST_Collect(geom)))::double precision AS centroid_lat,
      ST_X(ST_Centroid(ST_Collect(geom)))::double precision AS centroid_lng
    FROM geo_entities
    WHERE zone_id IS NOT NULL
    GROUP BY zone_id
  `;

  const { rows } = await database.query(query);
  const map = new Map();
  for (const row of rows || []) {
    map.set(Number(row.zone_id), {
      lat: toNum(row.centroid_lat, null),
      lng: toNum(row.centroid_lng, null)
    });
  }
  return map;
}

async function fetchCandidateWorkItems({ zoneIdFilter = null, limit = 120 }) {
  const query = `
    WITH request_items AS (
      SELECT
        'citizen_request'::text AS item_type,
        cr.id::text AS item_id,
        cr.zone_id,
        cr.title AS label,
        cr.priority,
        COALESCE(cr.urgency, 3) AS urgency,
        cr.status,
        cr.assigned_to,
        cr.latitude::double precision AS lat,
        cr.longitude::double precision AS lng,
        NULL::date AS due_date,
        cr.created_at,
        CASE
          WHEN LOWER(COALESCE(cr.priority, 'medium')) = 'high' THEN 120
          WHEN LOWER(COALESCE(cr.priority, 'medium')) = 'low' THEN 60
          ELSE 90
        END AS estimated_minutes
      FROM citizen_requests cr
      WHERE cr.status IN ('pending', 'in_progress')
        AND ($1::int IS NULL OR cr.zone_id = $1)
    ),
    task_items AS (
      SELECT
        'task'::text AS item_type,
        t.id::text AS item_id,
        u.zone_id,
        t.title AS label,
        t.priority,
        CASE
          WHEN LOWER(COALESCE(t.priority, 'medium')) = 'high' THEN 5
          WHEN LOWER(COALESCE(t.priority, 'medium')) = 'low' THEN 2
          ELSE 3
        END AS urgency,
        t.status,
        t.assigned_to,
        NULL::double precision AS lat,
        NULL::double precision AS lng,
        t.due_date,
        t.created_at,
        CASE
          WHEN LOWER(COALESCE(t.priority, 'medium')) = 'high' THEN 90
          WHEN LOWER(COALESCE(t.priority, 'medium')) = 'low' THEN 45
          ELSE 60
        END AS estimated_minutes
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE (t.status IN ('pending', 'in_progress') OR t.completed = false)
        AND ($1::int IS NULL OR u.zone_id = $1)
    ),
    merged AS (
      SELECT * FROM request_items
      UNION ALL
      SELECT * FROM task_items
    )
    SELECT *
    FROM merged
    ORDER BY
      urgency DESC,
      CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
      due_date ASC NULLS LAST,
      created_at ASC
    LIMIT $2
  `;

  const { rows } = await database.query(query, [zoneIdFilter, limit]);
  return rows || [];
}

async function buildBrigades({ zoneIdFilter = null, providedBrigades = null, defaultCapacity = 8, centroidMap = new Map() }) {
  if (Array.isArray(providedBrigades) && providedBrigades.length > 0) {
    return providedBrigades.map((brigade, index) => {
      const zoneId = toInt(brigade.zone_id, null);
      const centroid = zoneId ? centroidMap.get(zoneId) : null;
      return {
        id: String(brigade.id || `brigade-${index + 1}`),
        name: String(brigade.name || `Brigada ${index + 1}`),
        user_id: toInt(brigade.user_id, null),
        zone_id: zoneId,
        capacity: Math.max(1, toInt(brigade.capacity, defaultCapacity) ?? defaultCapacity),
        start_lat: toNum(brigade.start_lat, centroid?.lat ?? null),
        start_lng: toNum(brigade.start_lng, centroid?.lng ?? null),
        windows: {
          start: String(brigade.start_time || '08:00'),
          end: String(brigade.end_time || '18:00')
        }
      };
    });
  }

  const query = `
    SELECT id, name, role, zone_id
    FROM users
    WHERE active = true
      AND role IN ('operator', 'manager')
      AND ($1::int IS NULL OR zone_id = $1)
    ORDER BY role ASC, id ASC
  `;

  const { rows } = await database.query(query, [zoneIdFilter]);
  return (rows || []).map((row) => {
    const zoneId = Number(row.zone_id || 0) || null;
    const centroid = zoneId ? centroidMap.get(zoneId) : null;
    return {
      id: `user-${row.id}`,
      name: row.name,
      user_id: Number(row.id),
      zone_id: zoneId,
      capacity: defaultCapacity,
      start_lat: centroid?.lat ?? null,
      start_lng: centroid?.lng ?? null,
      windows: {
        start: '08:00',
        end: '18:00'
      }
    };
  });
}

function rankItemScore(item) {
  const urgency = Number(item.urgency || 0);
  const priority = normalizePriority(item.priority);
  const overdueBoost = item.due_date ? (new Date(item.due_date) < new Date() ? 2 : 0) : 0;
  return (urgency * 4) + (priority * 3) + overdueBoost;
}

function assignGreedy({ items, brigades, maxDistanceKm = 35, startMinutes = 8 * 60, endMinutes = 18 * 60 }) {
  const sortedItems = [...items].sort((a, b) => rankItemScore(b) - rankItemScore(a));
  const states = new Map();

  for (const brigade of brigades) {
    const bStart = parseTimeToMinutes(brigade.windows?.start, startMinutes);
    const bEnd = parseTimeToMinutes(brigade.windows?.end, endMinutes);
    states.set(brigade.id, {
      brigade,
      assignments: [],
      usedCapacity: 0,
      totalDistanceKm: 0,
      currentMinutes: bStart,
      maxMinutes: bEnd,
      lastLat: toNum(brigade.start_lat, null),
      lastLng: toNum(brigade.start_lng, null)
    });
  }

  const unassigned = [];

  for (const item of sortedItems) {
    const candidates = [];

    for (const state of states.values()) {
      const sameZone = !item.zone_id || !state.brigade.zone_id || Number(item.zone_id) === Number(state.brigade.zone_id);
      if (!sameZone) continue;

      if (state.usedCapacity >= state.brigade.capacity) continue;

      const estimateMinutes = Math.max(20, Number(item.estimated_minutes || 60));
      const projectedEnd = state.currentMinutes + estimateMinutes;
      if (projectedEnd > state.maxMinutes) continue;

      const distanceKm = haversineKm(state.lastLat, state.lastLng, item.lat, item.lng);
      const safeDistanceKm = Number.isFinite(distanceKm) ? distanceKm : 0;
      const projectedDistance = state.totalDistanceKm + safeDistanceKm;
      if (projectedDistance > maxDistanceKm) continue;

      candidates.push({ state, distanceKm: safeDistanceKm, projectedEnd, estimateMinutes });
    }

    if (!candidates.length) {
      unassigned.push({
        item_type: item.item_type,
        item_id: item.item_id,
        zone_id: item.zone_id,
        label: item.label,
        reason: 'capacity_or_time_or_distance'
      });
      continue;
    }

    candidates.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return a.state.usedCapacity - b.state.usedCapacity;
    });

    const selected = candidates[0];
    const { state } = selected;

    const startAt = state.currentMinutes;
    const endAt = selected.projectedEnd;

    state.assignments.push({
      item_type: item.item_type,
      item_id: item.item_id,
      zone_id: item.zone_id,
      label: item.label,
      urgency: Number(item.urgency || 0),
      priority: item.priority,
      estimated_minutes: selected.estimateMinutes,
      distance_from_previous_km: round(selected.distanceKm, 2),
      start_time: formatMinutesToTime(startAt),
      end_time: formatMinutesToTime(endAt)
    });

    state.usedCapacity += 1;
    state.totalDistanceKm = round(state.totalDistanceKm + selected.distanceKm, 2);
    state.currentMinutes = endAt;

    if (Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))) {
      state.lastLat = Number(item.lat);
      state.lastLng = Number(item.lng);
    }
  }

  const brigadePlans = Array.from(states.values()).map((state) => ({
    brigade: {
      id: state.brigade.id,
      name: state.brigade.name,
      user_id: state.brigade.user_id,
      zone_id: state.brigade.zone_id,
      capacity: state.brigade.capacity
    },
    assigned_count: state.assignments.length,
    used_capacity: state.usedCapacity,
    remaining_capacity: Math.max(0, state.brigade.capacity - state.usedCapacity),
    total_distance_km: round(state.totalDistanceKm, 2),
    assignments: state.assignments
  }));

  return { brigadePlans, unassigned };
}

function nearestNeighborRoute(stops, startLat, startLng) {
  const pending = [...stops];
  const route = [];
  let currentLat = toNum(startLat, null);
  let currentLng = toNum(startLng, null);
  let accumulatedDistance = 0;

  while (pending.length > 0) {
    let chosenIndex = 0;
    let chosenDistance = null;

    for (let i = 0; i < pending.length; i += 1) {
      const candidate = pending[i];
      const distance = haversineKm(currentLat, currentLng, candidate.lat, candidate.lng);
      const safe = Number.isFinite(distance) ? distance : 99999;
      if (chosenDistance === null || safe < chosenDistance) {
        chosenDistance = safe;
        chosenIndex = i;
      }
    }

    const [next] = pending.splice(chosenIndex, 1);
    const legDistance = Number.isFinite(chosenDistance) ? chosenDistance : 0;
    accumulatedDistance += legDistance;

    route.push({
      ...next,
      leg_distance_km: round(legDistance, 2),
      cumulative_distance_km: round(accumulatedDistance, 2)
    });

    if (Number.isFinite(Number(next.lat)) && Number.isFinite(Number(next.lng))) {
      currentLat = Number(next.lat);
      currentLng = Number(next.lng);
    }
  }

  return {
    route,
    total_distance_km: round(accumulatedDistance, 2)
  };
}

function evaluateRuleEngine({ role, context = {}, caseStatus = 'pending' }) {
  const normalizedRole = String(role || '').trim().toLowerCase() || 'visitor';
  const normalizedStatus = String(caseStatus || 'pending').trim().toLowerCase();

  const baseActions = {
    admin: ['view', 'create', 'assign', 'reassign', 'close', 'reopen', 'escalate', 'export', 'delete', 'audit'],
    manager: ['view', 'create', 'assign', 'reassign', 'close', 'reopen', 'escalate', 'export'],
    operator: ['view', 'create', 'update', 'complete', 'escalate'],
    auditor: ['view', 'audit', 'export'],
    viewer: ['view', 'export'],
    visitor: ['view_public', 'track_case']
  };

  const actions = new Set(baseActions[normalizedRole] || baseActions.visitor);
  const deniedReasons = [];

  if (normalizedStatus === 'resolved' || normalizedStatus === 'closed') {
    actions.delete('close');
    actions.delete('complete');
    if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
      actions.delete('reopen');
      deniedReasons.push('Solo administración o coordinación puede reabrir casos cerrados.');
    }
  }

  if (context?.sensitivity === 'high' && !['admin', 'auditor'].includes(normalizedRole)) {
    actions.delete('export');
    actions.delete('delete');
    deniedReasons.push('Caso sensible: exportar/eliminar restringido a admin o auditor.');
  }

  if (context?.owns_case === false && normalizedRole === 'operator') {
    actions.delete('complete');
    deniedReasons.push('Operador sin titularidad del caso no puede cerrarlo directamente.');
  }

  if (context?.channel === 'public_portal') {
    actions.delete('delete');
    actions.delete('reassign');
  }

  const allKnown = new Set(Object.values(baseActions).flat());
  const allowed = Array.from(actions).sort();
  const denied = Array.from(allKnown).filter((action) => !actions.has(action)).sort();

  return {
    role: normalizedRole,
    case_status: normalizedStatus,
    context,
    allowed_actions: allowed,
    denied_actions: denied,
    reasons: deniedReasons
  };
}

export const getZonePrioritization = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const top = Math.min(Math.max(toInt(req.query.limit, 12) ?? 12, 1), 100);
  const weights = normalizeWeights(req.query);

  const rows = await fetchZoneOperationalRows(zoneIdFilter);

  const maxPadron = Math.max(1, ...rows.map((item) => Number(item.padron_total || 0)));
  const maxRequests = Math.max(1, ...rows.map((item) => Number(item.requests_open || 0)));
  const maxOverdue = Math.max(1, ...rows.map((item) => Number(item.overdue_tasks || 0)));
  const maxCoverageGap = Math.max(1, ...rows.map((item) => {
    const operators = Number(item.active_operators || 0);
    const pressure = Number(item.tasks_open || 0) + Number(item.requests_open || 0);
    return operators > 0 ? pressure / operators : pressure;
  }));

  const prioritized = rows.map((item) => {
    const padronTotal = Number(item.padron_total || 0);
    const participants = Number(item.participants || 0);
    const participationRate = padronTotal > 0 ? (participants / padronTotal) * 100 : 0;
    const participationGap = clamp(100 - participationRate);

    const requestsOpen = Number(item.requests_open || 0);
    const overdueTasks = Number(item.overdue_tasks || 0);
    const avgUrgency = Number(item.avg_urgency || 0);
    const riskBase = clamp((requestsOpen / maxRequests) * 40 + (overdueTasks / maxOverdue) * 35 + (avgUrgency / 5) * 25);

    const operators = Number(item.active_operators || 0);
    const operationalPressure = Number(item.tasks_open || 0) + requestsOpen;
    const coverageGapRaw = operators > 0 ? operationalPressure / operators : operationalPressure;

    const components = {
      padron: clamp((padronTotal / maxPadron) * 100),
      participacion: participationGap,
      solicitudes: clamp((requestsOpen / maxRequests) * 100),
      riesgo: riskBase,
      cobertura: clamp((coverageGapRaw / maxCoverageGap) * 100)
    };

    const score = round(
      (components.padron * weights.padron)
      + (components.participacion * weights.participacion)
      + (components.solicitudes * weights.solicitudes)
      + (components.riesgo * weights.riesgo)
      + (components.cobertura * weights.cobertura)
    );

    return {
      zone_id: Number(item.zone_id),
      zone_name: item.zone_name,
      score,
      semaphore: classifySemaphore(score),
      metrics: {
        padron_total: padronTotal,
        participation_rate: round(participationRate),
        requests_open: requestsOpen,
        avg_urgency: round(avgUrgency),
        overdue_tasks: overdueTasks,
        active_operators: operators,
        coverage_gap_per_operator: round(coverageGapRaw)
      },
      components: {
        padron: round(components.padron),
        participacion: round(components.participacion),
        solicitudes: round(components.solicitudes),
        riesgo: round(components.riesgo),
        cobertura: round(components.cobertura)
      }
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, top);

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'zone_weighted_priority_v1',
    applied_filters: { zone_id: zoneIdFilter, limit: top },
    weights,
    data: prioritized
  });
});

export const getBrigadeAssignmentPlan = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const zoneIdFilter = toInt(body.zone_id, toInt(req.query.zone_id, null));
  const limit = Math.min(Math.max(toInt(body.limit, 120) ?? 120, 10), 400);
  const defaultCapacity = Math.min(Math.max(toInt(body.default_capacity, 8) ?? 8, 1), 20);
  const maxDistanceKm = Math.min(Math.max(toNum(body.max_distance_km, 35) ?? 35, 2), 120);
  const startMinutes = parseTimeToMinutes(body.start_time, 8 * 60);
  const endMinutes = parseTimeToMinutes(body.end_time, 18 * 60);
  const applyChanges = Boolean(body.apply);

  const centroidMap = await fetchZoneCentroids();
  const brigades = await buildBrigades({
    zoneIdFilter,
    providedBrigades: body.brigades,
    defaultCapacity,
    centroidMap
  });

  const rawItems = await fetchCandidateWorkItems({ zoneIdFilter, limit });
  const preparedItems = rawItems.map((item) => {
    const zoneCentroid = item.zone_id ? centroidMap.get(Number(item.zone_id)) : null;
    return {
      ...item,
      zone_id: toInt(item.zone_id, null),
      urgency: Number(item.urgency || 0),
      estimated_minutes: Number(item.estimated_minutes || 60),
      lat: toNum(item.lat, zoneCentroid?.lat ?? null),
      lng: toNum(item.lng, zoneCentroid?.lng ?? null)
    };
  });

  const { brigadePlans, unassigned } = assignGreedy({
    items: preparedItems,
    brigades,
    maxDistanceKm,
    startMinutes,
    endMinutes
  });

  const persistence = {
    applied: false,
    task_updates: 0,
    request_updates: 0
  };

  if (applyChanges) {
    for (const plan of brigadePlans) {
      const userId = toInt(plan.brigade.user_id, null);
      if (!userId) continue;

      for (const assignment of plan.assignments) {
        if (assignment.item_type === 'task') {
          await database.query('UPDATE tasks SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
            userId,
            Number(assignment.item_id)
          ]);
          persistence.task_updates += 1;
        }

        if (assignment.item_type === 'citizen_request') {
          await database.query('UPDATE citizen_requests SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
            userId,
            Number(assignment.item_id)
          ]);
          persistence.request_updates += 1;
        }
      }
    }

    persistence.applied = true;
  }

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'brigade_greedy_constraints_v1',
    parameters: {
      zone_id: zoneIdFilter,
      default_capacity: defaultCapacity,
      max_distance_km: maxDistanceKm,
      start_time: formatMinutesToTime(startMinutes),
      end_time: formatMinutesToTime(endMinutes),
      item_limit: limit,
      apply: applyChanges
    },
    summary: {
      brigades: brigadePlans.length,
      assigned_items: brigadePlans.reduce((acc, item) => acc + item.assigned_count, 0),
      unassigned_items: unassigned.length
    },
    persistence,
    data: brigadePlans,
    unassigned
  });
});

export const getTerritorialRoutingPlan = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const brigadeIdFilter = String(req.query.brigade_id || '').trim() || null;
  const limit = Math.min(Math.max(toInt(req.query.limit, 120) ?? 120, 10), 400);
  const avgSpeedKmh = Math.min(Math.max(toNum(req.query.speed_kmh, 28) ?? 28, 10), 80);

  const centroidMap = await fetchZoneCentroids();
  const brigades = await buildBrigades({
    zoneIdFilter,
    providedBrigades: null,
    defaultCapacity: Math.min(Math.max(toInt(req.query.capacity, 10) ?? 10, 1), 25),
    centroidMap
  });

  const filteredBrigades = brigadeIdFilter
    ? brigades.filter((brigade) => brigade.id === brigadeIdFilter || String(brigade.user_id) === brigadeIdFilter)
    : brigades;

  const items = await fetchCandidateWorkItems({ zoneIdFilter, limit });
  const byZone = new Map();
  for (const item of items) {
    const zoneId = toInt(item.zone_id, null);
    if (!zoneId) continue;
    if (!byZone.has(zoneId)) byZone.set(zoneId, []);
    const centroid = centroidMap.get(zoneId);
    byZone.get(zoneId).push({
      ...item,
      zone_id: zoneId,
      lat: toNum(item.lat, centroid?.lat ?? null),
      lng: toNum(item.lng, centroid?.lng ?? null)
    });
  }

  const plans = filteredBrigades.map((brigade) => {
    const candidateStops = brigade.zone_id ? (byZone.get(brigade.zone_id) || []) : [];
    const stops = candidateStops
      .sort((a, b) => rankItemScore(b) - rankItemScore(a))
      .slice(0, Math.max(1, brigade.capacity));

    const routeResult = nearestNeighborRoute(stops, brigade.start_lat, brigade.start_lng);
    const travelMinutes = routeResult.total_distance_km > 0
      ? (routeResult.total_distance_km / avgSpeedKmh) * 60
      : 0;

    return {
      brigade: {
        id: brigade.id,
        name: brigade.name,
        user_id: brigade.user_id,
        zone_id: brigade.zone_id
      },
      route_stops: routeResult.route,
      total_stops: routeResult.route.length,
      total_distance_km: routeResult.total_distance_km,
      estimated_travel_minutes: round(travelMinutes)
    };
  });

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'territorial_vrp_nearest_neighbor_v1',
    parameters: {
      zone_id: zoneIdFilter,
      brigade_id: brigadeIdFilter,
      speed_kmh: avgSpeedKmh,
      limit
    },
    data: plans
  });
});

export const getSemaphoreAlerts = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const redThreshold = clamp(toNum(req.query.red_threshold, 70) ?? 70, 1, 100);
  const yellowThreshold = clamp(toNum(req.query.yellow_threshold, 40) ?? 40, 1, redThreshold - 1);

  const zoneRows = await fetchZoneOperationalRows(zoneIdFilter);

  const alerts = zoneRows.map((item) => {
    const requestsOpen = Number(item.requests_open || 0);
    const overdue = Number(item.overdue_tasks || 0);
    const urgency = Number(item.avg_urgency || 0);
    const operators = Number(item.active_operators || 0);
    const coveragePressure = operators > 0
      ? (Number(item.tasks_open || 0) + requestsOpen) / operators
      : (Number(item.tasks_open || 0) + requestsOpen);

    const riskScore = clamp((requestsOpen * 3.5) + (overdue * 4.5) + (urgency * 8) + (coveragePressure * 5));

    let level = 'green';
    if (riskScore >= redThreshold) level = 'red';
    else if (riskScore >= yellowThreshold) level = 'yellow';

    const reasons = [];
    if (requestsOpen >= 10) reasons.push('Acumulación alta de solicitudes abiertas');
    if (overdue >= 5) reasons.push('Exceso de tareas vencidas');
    if (urgency >= 4) reasons.push('Urgencia promedio elevada');
    if (coveragePressure >= 8) reasons.push('Presión operativa superior a la capacidad de cobertura');

    return {
      zone_id: Number(item.zone_id),
      zone_name: item.zone_name,
      level,
      risk_score: round(riskScore),
      reasons: reasons.length ? reasons : ['Monitoreo normal sin alerta crítica'],
      metrics: {
        requests_open: requestsOpen,
        overdue_tasks: overdue,
        avg_urgency: round(urgency),
        active_operators: operators,
        coverage_pressure: round(coveragePressure)
      }
    };
  }).sort((a, b) => b.risk_score - a.risk_score);

  const summary = {
    red: alerts.filter((item) => item.level === 'red').length,
    yellow: alerts.filter((item) => item.level === 'yellow').length,
    green: alerts.filter((item) => item.level === 'green').length
  };

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'semaphore_rules_v1',
    thresholds: { red: redThreshold, yellow: yellowThreshold },
    summary,
    data: alerts
  });
});

export const getOperationalLoadBalance = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const defaultCapacity = Math.min(Math.max(toInt(req.query.capacity, 10) ?? 10, 1), 30);
  const applyChanges = String(req.query.apply || '').toLowerCase() === 'true';

  const operatorQuery = `
    SELECT id, name, role, zone_id
    FROM users
    WHERE active = true
      AND role IN ('operator', 'manager')
      AND ($1::int IS NULL OR zone_id = $1)
    ORDER BY id ASC
  `;

  const operatorsResult = await database.query(operatorQuery, [zoneIdFilter]);
  const operators = operatorsResult.rows || [];

  const loadQuery = `
    SELECT
      u.id AS user_id,
      COUNT(t.*)::int AS open_tasks
    FROM users u
    LEFT JOIN tasks t ON t.assigned_to = u.id
      AND (t.status IN ('pending', 'in_progress') OR t.completed = false)
    WHERE u.active = true
      AND u.role IN ('operator', 'manager')
      AND ($1::int IS NULL OR u.zone_id = $1)
    GROUP BY u.id
  `;

  const loads = await database.query(loadQuery, [zoneIdFilter]);
  const loadMap = new Map((loads.rows || []).map((row) => [Number(row.user_id), Number(row.open_tasks || 0)]));

  const rows = operators.map((operator) => {
    const capacity = defaultCapacity;
    const openTasks = loadMap.get(Number(operator.id)) || 0;
    const utilization = capacity > 0 ? openTasks / capacity : 0;
    return {
      user_id: Number(operator.id),
      name: operator.name,
      role: operator.role,
      zone_id: toInt(operator.zone_id, null),
      capacity,
      open_tasks: openTasks,
      utilization: round(utilization)
    };
  });

  const totalOpen = rows.reduce((acc, item) => acc + item.open_tasks, 0);
  const totalCapacity = rows.reduce((acc, item) => acc + item.capacity, 0);
  const targetUtilization = totalCapacity > 0 ? totalOpen / totalCapacity : 0;

  const overloaded = rows.filter((item) => item.utilization > targetUtilization + 0.2)
    .sort((a, b) => b.utilization - a.utilization);
  const underloaded = rows.filter((item) => item.utilization < targetUtilization - 0.2)
    .sort((a, b) => a.utilization - b.utilization);

  const transferPlan = [];

  for (const source of overloaded) {
    let transferable = Math.max(0, Math.floor((source.utilization - targetUtilization) * source.capacity));
    if (transferable === 0) continue;

    const candidateQuery = `
      SELECT id, title, priority, due_date
      FROM tasks
      WHERE assigned_to = $1
        AND (status IN ('pending', 'in_progress') OR completed = false)
      ORDER BY
        CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
        due_date ASC NULLS LAST,
        CASE LOWER(COALESCE(priority, 'medium')) WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      LIMIT $2
    `;

    const tasksToMove = (await database.query(candidateQuery, [source.user_id, transferable])).rows || [];

    for (const task of tasksToMove) {
      const target = underloaded.find((item) => item.zone_id === source.zone_id && item.open_tasks < item.capacity);
      if (!target) break;

      transferPlan.push({
        task_id: Number(task.id),
        task_title: task.title,
        from_user_id: source.user_id,
        from_name: source.name,
        to_user_id: target.user_id,
        to_name: target.name,
        zone_id: source.zone_id
      });

      source.open_tasks = Math.max(0, source.open_tasks - 1);
      target.open_tasks += 1;
      source.utilization = round(source.open_tasks / source.capacity);
      target.utilization = round(target.open_tasks / target.capacity);
      transferable -= 1;
      if (transferable <= 0) break;
    }
  }

  let appliedTransfers = 0;
  if (applyChanges) {
    for (const movement of transferPlan) {
      await database.query(
        'UPDATE tasks SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [movement.to_user_id, movement.task_id]
      );
      appliedTransfers += 1;
    }
  }

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'workload_balancer_v1',
    parameters: {
      zone_id: zoneIdFilter,
      capacity: defaultCapacity,
      apply: applyChanges
    },
    summary: {
      operators: rows.length,
      total_open_tasks: totalOpen,
      total_capacity: totalCapacity,
      target_utilization: round(targetUtilization),
      proposed_transfers: transferPlan.length,
      applied_transfers: appliedTransfers
    },
    current_load: rows,
    transfer_plan: transferPlan
  });
});

export const evaluatePermissionRules = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const role = String(payload.role || req.user?.role || 'visitor').toLowerCase();

  const result = evaluateRuleEngine({
    role,
    context: payload.context || {},
    caseStatus: payload.case_status || 'pending'
  });

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'permissions_rules_engine_v1',
    data: result
  });
});

export const getRulesCatalog = asyncHandler(async (_req, res) => {
  const samples = [
    evaluateRuleEngine({ role: 'admin', context: { sensitivity: 'high' }, caseStatus: 'pending' }),
    evaluateRuleEngine({ role: 'operator', context: { owns_case: false }, caseStatus: 'in_progress' }),
    evaluateRuleEngine({ role: 'visitor', context: { channel: 'public_portal' }, caseStatus: 'pending' })
  ];

  res.json({
    generated_at: new Date().toISOString(),
    algorithm: 'permissions_rules_engine_v1',
    roles_supported: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'],
    case_status_supported: ['pending', 'in_progress', 'resolved', 'closed'],
    sample_evaluations: samples
  });
});

function safeRatio(numerator, denominator) {
  const den = Number(denominator || 0);
  if (!Number.isFinite(den) || den <= 0) return 0;
  return Number(numerator || 0) / den;
}

function normalizeAgainstMax(value, max) {
  const m = Number(max || 0);
  if (!Number.isFinite(m) || m <= 0) return 0;
  return clamp((Number(value || 0) / m) * 100);
}

function buildAdvancedAlgorithmDefinitions() {
  return [
    {
      id: 'turnout_gap_priority',
      name: 'Turnout Gap Priority',
      category: 'electoral',
      description: 'Prioriza zonas con mayor brecha de participación sobre padrón.',
      compute: ({ participationGap, openPressure }, g) => round((participationGap * 0.75) + (normalizeAgainstMax(openPressure, g.maxOpenPressure) * 0.25))
    },
    {
      id: 'social_pressure_index',
      name: 'Social Pressure Index',
      category: 'social',
      description: 'Mide presión social combinando solicitudes abiertas y urgencia.',
      compute: ({ requestsOpen, avgUrgency }, g) => round((normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.6) + (clamp((avgUrgency / 5) * 100) * 0.4))
    },
    {
      id: 'service_saturation_risk',
      name: 'Service Saturation Risk',
      category: 'operations',
      description: 'Detecta saturación de servicios por operador activo.',
      compute: ({ coveragePressure }, g) => round(normalizeAgainstMax(coveragePressure, g.maxCoveragePressure))
    },
    {
      id: 'overdue_task_criticality',
      name: 'Overdue Task Criticality',
      category: 'tasks',
      description: 'Valora criticidad por acumulación de tareas vencidas.',
      compute: ({ overdueTasks }, g) => round(normalizeAgainstMax(overdueTasks, g.maxOverdueTasks))
    },
    {
      id: 'operator_capacity_stress',
      name: 'Operator Capacity Stress',
      category: 'operations',
      description: 'Presión operativa según tareas abiertas por operador.',
      compute: ({ tasksOpen, operators }, g) => {
        const ratio = operators > 0 ? tasksOpen / operators : tasksOpen;
        return round(normalizeAgainstMax(ratio, g.maxTaskPerOperator));
      }
    },
    {
      id: 'intervention_readiness',
      name: 'Intervention Readiness',
      category: 'planning',
      description: 'Estimación de alistamiento para intervención inmediata.',
      compute: ({ operators, tasksOpen, requestsOpen }, g) => {
        const load = tasksOpen + requestsOpen;
        const readiness = clamp(100 - normalizeAgainstMax(load, g.maxOpenPressure) + normalizeAgainstMax(operators, g.maxOperators) * 0.3);
        return round(readiness);
      }
    },
    {
      id: 'citizen_urgency_heat',
      name: 'Citizen Urgency Heat',
      category: 'citizen-services',
      description: 'Temperatura de urgencia ciudadana en la zona.',
      compute: ({ avgUrgency }) => round(clamp((avgUrgency / 5) * 100))
    },
    {
      id: 'territorial_stability',
      name: 'Territorial Stability',
      category: 'governance',
      description: 'Señal de estabilidad territorial inversa al riesgo operativo.',
      compute: ({ requestsOpen, overdueTasks, avgUrgency }, g) => {
        const risk = (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.35)
          + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.35)
          + (clamp((avgUrgency / 5) * 100) * 0.3);
        return round(clamp(100 - risk));
      }
    },
    {
      id: 'response_bottleneck',
      name: 'Response Bottleneck',
      category: 'citizen-services',
      description: 'Probabilidad de cuello de botella en respuesta territorial.',
      compute: ({ requestsOpen, operators }, g) => {
        const ratio = operators > 0 ? requestsOpen / operators : requestsOpen;
        return round(normalizeAgainstMax(ratio, g.maxRequestPerOperator));
      }
    },
    {
      id: 'resource_absorption',
      name: 'Resource Absorption',
      category: 'operations',
      description: 'Capacidad de absorción de carga por equipo territorial.',
      compute: ({ operators, openPressure }, g) => {
        const pressureNorm = normalizeAgainstMax(openPressure, g.maxOpenPressure);
        const operatorNorm = normalizeAgainstMax(operators, g.maxOperators);
        return round(clamp((operatorNorm * 0.65) + ((100 - pressureNorm) * 0.35)));
      }
    },
    {
      id: 'operational_backlog_velocity',
      name: 'Operational Backlog Velocity',
      category: 'tasks',
      description: 'Proxy de velocidad de crecimiento de backlog operativo.',
      compute: ({ tasksOpen, requestsOpen, tasksTotal }, g) => {
        const backlogBase = tasksOpen + requestsOpen;
        const utilization = safeRatio(backlogBase, Math.max(1, tasksTotal));
        return round(clamp((normalizeAgainstMax(backlogBase, g.maxOpenPressure) * 0.7) + (clamp(utilization * 100) * 0.3)));
      }
    },
    {
      id: 'request_to_operator_ratio',
      name: 'Request-to-Operator Ratio',
      category: 'citizen-services',
      description: 'Carga de solicitudes por operador activo.',
      compute: ({ requestsOpen, operators }, g) => round(normalizeAgainstMax(operators > 0 ? requestsOpen / operators : requestsOpen, g.maxRequestPerOperator))
    },
    {
      id: 'task_to_operator_ratio',
      name: 'Task-to-Operator Ratio',
      category: 'tasks',
      description: 'Carga de tareas por operador activo.',
      compute: ({ tasksOpen, operators }, g) => round(normalizeAgainstMax(operators > 0 ? tasksOpen / operators : tasksOpen, g.maxTaskPerOperator))
    },
    {
      id: 'participation_recovery_potential',
      name: 'Participation Recovery Potential',
      category: 'electoral',
      description: 'Potencial de recuperar participación con intervención focalizada.',
      compute: ({ participationGap, operators }, g) => round(clamp((participationGap * 0.7) + (normalizeAgainstMax(operators, g.maxOperators) * 0.3)))
    },
    {
      id: 'preventive_action_index',
      name: 'Preventive Action Index',
      category: 'planning',
      description: 'Necesidad de activar acciones preventivas antes de escalamiento.',
      compute: ({ avgUrgency, overdueTasks }, g) => round(clamp((clamp((avgUrgency / 5) * 100) * 0.45) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.55)))
    },
    {
      id: 'escalation_need_score',
      name: 'Escalation Need Score',
      category: 'governance',
      description: 'Mide necesidad de escalar decisiones a nivel directivo.',
      compute: ({ requestsOpen, overdueTasks, operators }, g) => {
        const pressure = normalizeAgainstMax(requestsOpen + overdueTasks, g.maxOpenPressure + g.maxOverdueTasks);
        const cover = normalizeAgainstMax(operators, g.maxOperators);
        return round(clamp((pressure * 0.8) + ((100 - cover) * 0.2)));
      }
    },
    {
      id: 'territorial_equity_gap',
      name: 'Territorial Equity Gap',
      category: 'equity',
      description: 'Brecha territorial de carga vs dotación operativa.',
      compute: ({ openPressure, operators }, g) => {
        const loadNorm = normalizeAgainstMax(openPressure, g.maxOpenPressure);
        const opsNorm = normalizeAgainstMax(operators, g.maxOperators);
        return round(clamp((loadNorm * 0.6) + ((100 - opsNorm) * 0.4)));
      }
    },
    {
      id: 'demand_forecast_30d',
      name: 'Demand Forecast 30d',
      category: 'forecasting',
      description: 'Proyección determinística de presión de demanda a 30 días.',
      compute: ({ requestsOpen, avgUrgency, participationGap }, g) => {
        const base = normalizeAgainstMax(requestsOpen, g.maxRequestsOpen);
        const multiplier = 1 + ((avgUrgency - 3) * 0.08) + ((participationGap / 100) * 0.12);
        return round(clamp(base * multiplier));
      }
    },
    {
      id: 'microplanning_focus_index',
      name: 'Microplanning Focus Index',
      category: 'planning',
      description: 'Nivel de focalización requerido para microplaneación.',
      compute: ({ requestsOpen, participationGap, coveragePressure }, g) => round(clamp((normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.35) + (participationGap * 0.35) + (normalizeAgainstMax(coveragePressure, g.maxCoveragePressure) * 0.3)))
    },
    {
      id: 'deployment_efficiency_estimate',
      name: 'Deployment Efficiency Estimate',
      category: 'operations',
      description: 'Eficiencia esperada de despliegue diario de brigadas.',
      compute: ({ operators, tasksOpen, overdueTasks }, g) => {
        const capacity = normalizeAgainstMax(operators, g.maxOperators);
        const burden = normalizeAgainstMax(tasksOpen + overdueTasks, g.maxOpenPressure + g.maxOverdueTasks);
        return round(clamp((capacity * 0.65) + ((100 - burden) * 0.35)));
      }
    },
    {
      id: 'governance_compliance_signal',
      name: 'Governance Compliance Signal',
      category: 'governance',
      description: 'Señal de cumplimiento operativo y gobernanza territorial.',
      compute: ({ overdueTasks, requestsOpen, participants, padronTotal }, g) => {
        const compliance = 100
          - (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.45)
          - (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.25)
          + (clamp(safeRatio(participants, Math.max(1, padronTotal)) * 100) * 0.2);
        return round(clamp(compliance));
      }
    },
    {
      id: 'risk_mitigation_priority',
      name: 'Risk Mitigation Priority',
      category: 'risk',
      description: 'Prioridad de mitigación de riesgo territorial.',
      compute: ({ avgUrgency, overdueTasks, coveragePressure }, g) => round(clamp((clamp((avgUrgency / 5) * 100) * 0.35) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.35) + (normalizeAgainstMax(coveragePressure, g.maxCoveragePressure) * 0.3)))
    },
    {
      id: 'budget_impact_proxy',
      name: 'Budget Impact Proxy',
      category: 'finance',
      description: 'Proxy de impacto presupuestal por presión operativa y social.',
      compute: ({ openPressure, avgUrgency, operators }, g) => {
        const pressure = normalizeAgainstMax(openPressure, g.maxOpenPressure);
        const urgency = clamp((avgUrgency / 5) * 100);
        const capacity = normalizeAgainstMax(operators, g.maxOperators);
        return round(clamp((pressure * 0.5) + (urgency * 0.35) + ((100 - capacity) * 0.15)));
      }
    },
    {
      id: 'integrated_action_priority',
      name: 'Integrated Action Priority',
      category: 'integrated',
      description: 'Score maestro para ordenar la acción integral de la plataforma.',
      compute: ({ participationGap, requestsOpen, overdueTasks, coveragePressure, avgUrgency }, g) => {
        return round(clamp(
          (participationGap * 0.22)
          + (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.23)
          + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.2)
          + (normalizeAgainstMax(coveragePressure, g.maxCoveragePressure) * 0.2)
          + (clamp((avgUrgency / 5) * 100) * 0.15)
        ));
      }
    },
    {
      id: 'district_activation_sequence',
      name: 'District Activation Sequence',
      category: 'planning',
      phase: 'experimental',
      description: 'Secuencia óptima de activación por distrito según carga y capacidad.',
      compute: ({ openPressure, operators, overdueTasks }, g) => round(clamp((normalizeAgainstMax(openPressure, g.maxOpenPressure) * 0.45) + ((100 - normalizeAgainstMax(operators, g.maxOperators)) * 0.25) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.3)))
    },
    {
      id: 'campaign_sprint_pressure',
      name: 'Campaign Sprint Pressure',
      category: 'electoral',
      phase: 'experimental',
      description: 'Presión de sprint territorial para ventanas cortas de campaña.',
      compute: ({ participationGap, requestsOpen, avgUrgency }, g) => round(clamp((participationGap * 0.4) + (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.35) + (clamp((avgUrgency / 5) * 100) * 0.25)))
    },
    {
      id: 'door_to_door_intensity',
      name: 'Door-to-Door Intensity',
      category: 'electoral',
      phase: 'experimental',
      description: 'Intensidad recomendada de barrido territorial puerta a puerta.',
      compute: ({ participationGap, operators }, g) => round(clamp((participationGap * 0.65) + ((100 - normalizeAgainstMax(operators, g.maxOperators)) * 0.35)))
    },
    {
      id: 'public_service_backlog_risk',
      name: 'Public Service Backlog Risk',
      category: 'citizen-services',
      phase: 'experimental',
      description: 'Riesgo de acumulación crónica de trámites y atenciones.',
      compute: ({ requestsOpen, overdueTasks }, g) => round(clamp((normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.6) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.4)))
    },
    {
      id: 'field_visit_priority',
      name: 'Field Visit Priority',
      category: 'operations',
      phase: 'experimental',
      description: 'Prioridad para visitas de campo en zonas de mayor fricción operativa.',
      compute: ({ openPressure, avgUrgency, coveragePressure }, g) => round(clamp((normalizeAgainstMax(openPressure, g.maxOpenPressure) * 0.45) + (clamp((avgUrgency / 5) * 100) * 0.3) + (normalizeAgainstMax(coveragePressure, g.maxCoveragePressure) * 0.25)))
    },
    {
      id: 'civic_contact_saturation',
      name: 'Civic Contact Saturation',
      category: 'social',
      phase: 'experimental',
      description: 'Saturación del sistema de contacto ciudadano en territorio.',
      compute: ({ requestsOpen, operators }, g) => round(normalizeAgainstMax(operators > 0 ? requestsOpen / operators : requestsOpen, g.maxRequestPerOperator))
    },
    {
      id: 'rapid_response_need',
      name: 'Rapid Response Need',
      category: 'risk',
      phase: 'experimental',
      description: 'Necesidad de activar célula de respuesta rápida territorial.',
      compute: ({ avgUrgency, overdueTasks, operators }, g) => round(clamp((clamp((avgUrgency / 5) * 100) * 0.5) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.35) + ((100 - normalizeAgainstMax(operators, g.maxOperators)) * 0.15)))
    },
    {
      id: 'territorial_comms_priority',
      name: 'Territorial Communications Priority',
      category: 'communications',
      phase: 'experimental',
      description: 'Prioriza zonas para comunicación territorial focalizada.',
      compute: ({ participationGap, requestsOpen }, g) => round(clamp((participationGap * 0.55) + (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.45)))
    },
    {
      id: 'compliance_audit_focus',
      name: 'Compliance Audit Focus',
      category: 'governance',
      phase: 'experimental',
      description: 'Foco de auditoría de cumplimiento y trazabilidad territorial.',
      compute: ({ overdueTasks, tasksOpen }, g) => round(clamp((normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.6) + (normalizeAgainstMax(tasksOpen, g.maxOpenPressure) * 0.4)))
    },
    {
      id: 'community_support_gap',
      name: 'Community Support Gap',
      category: 'equity',
      phase: 'experimental',
      description: 'Brecha de soporte comunitario por carga social acumulada.',
      compute: ({ requestsOpen, operators, participationGap }, g) => round(clamp((normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.5) + ((100 - normalizeAgainstMax(operators, g.maxOperators)) * 0.2) + (participationGap * 0.3)))
    },
    {
      id: 'service_recovery_effort',
      name: 'Service Recovery Effort',
      category: 'citizen-services',
      phase: 'experimental',
      description: 'Esfuerzo estimado para recuperar niveles de servicio.',
      compute: ({ requestsOpen, overdueTasks, avgUrgency }, g) => round(clamp((normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.4) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.35) + (clamp((avgUrgency / 5) * 100) * 0.25)))
    },
    {
      id: 'reassignment_opportunity',
      name: 'Reassignment Opportunity',
      category: 'operations',
      phase: 'experimental',
      description: 'Oportunidad de reasignación para suavizar cuellos de botella.',
      compute: ({ tasksOpen, operators }, g) => round(clamp((normalizeAgainstMax(tasksOpen, g.maxOpenPressure) * 0.55) + ((100 - normalizeAgainstMax(operators, g.maxOperators)) * 0.45)))
    },
    {
      id: 'route_density_advantage',
      name: 'Route Density Advantage',
      category: 'routing',
      phase: 'experimental',
      description: 'Ventaja esperada por densidad de puntos para ruteo eficiente.',
      compute: ({ requestsOpen, tasksOpen, operators }, g) => {
        const density = operators > 0 ? (requestsOpen + tasksOpen) / operators : requestsOpen + tasksOpen;
        return round(clamp(100 - normalizeAgainstMax(density, g.maxCoveragePressure)));
      }
    },
    {
      id: 'budget_shield_priority',
      name: 'Budget Shield Priority',
      category: 'finance',
      phase: 'experimental',
      description: 'Prioridad de blindaje presupuestal ante escalamiento operativo.',
      compute: ({ openPressure, overdueTasks, avgUrgency }, g) => round(clamp((normalizeAgainstMax(openPressure, g.maxOpenPressure) * 0.4) + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.35) + (clamp((avgUrgency / 5) * 100) * 0.25)))
    },
    {
      id: 'social_stability_projection',
      name: 'Social Stability Projection',
      category: 'social',
      phase: 'experimental',
      description: 'Proyección de estabilidad social a corto plazo.',
      compute: ({ requestsOpen, avgUrgency, participationRate }, g) => {
        const stress = (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.45) + (clamp((avgUrgency / 5) * 100) * 0.35);
        return round(clamp((participationRate * 0.2) + (100 - stress) * 0.8));
      }
    },
    {
      id: 'whole_system_action_score',
      name: 'Whole-System Action Score',
      category: 'integrated',
      phase: 'experimental',
      description: 'Score integral experimental para coordinación sistémica multi-módulo.',
      compute: ({ participationGap, requestsOpen, tasksOpen, overdueTasks, coveragePressure, avgUrgency }, g) => round(clamp(
        (participationGap * 0.16)
        + (normalizeAgainstMax(requestsOpen, g.maxRequestsOpen) * 0.19)
        + (normalizeAgainstMax(tasksOpen, g.maxOpenPressure) * 0.14)
        + (normalizeAgainstMax(overdueTasks, g.maxOverdueTasks) * 0.16)
        + (normalizeAgainstMax(coveragePressure, g.maxCoveragePressure) * 0.17)
        + (clamp((avgUrgency / 5) * 100) * 0.18)
      ))
    }
  ];
}

function parseFeatureFlags(req) {
  const envExperimental = ['1', 'true', 'yes', 'on'].includes(String(process.env.OP_ALGO_ENABLE_EXPERIMENTAL || '').trim().toLowerCase());
  const queryExperimental = ['1', 'true', 'yes', 'on'].includes(String(req.query.include_experimental || '').trim().toLowerCase());
  const includeExperimental = envExperimental || queryExperimental;

  const envEnabledIdsRaw = String(process.env.OP_ALGO_ENABLED_IDS || '').trim();
  const envEnabledIds = envEnabledIdsRaw
    ? envEnabledIdsRaw.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    includeExperimental,
    envEnabledIds
  };
}

function selectAlgorithms(definitions, req, requestedAlgorithmsRaw = '') {
  const flags = parseFeatureFlags(req);
  const requestedIds = String(requestedAlgorithmsRaw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  let available = definitions.filter((definition) => {
    if (definition.phase === 'experimental' && !flags.includeExperimental) return false;
    if (flags.envEnabledIds.length > 0 && !flags.envEnabledIds.includes(definition.id)) return false;
    return true;
  });

  if (requestedIds.length > 0) {
    available = available.filter((definition) => requestedIds.includes(definition.id));
  }

  return {
    selected: available,
    flags,
    requestedIds
  };
}

function buildAdvancedMetrics(zoneRow) {
  const padronTotal = Number(zoneRow.padron_total || 0);
  const participants = Number(zoneRow.participants || 0);
  const requestsOpen = Number(zoneRow.requests_open || 0);
  const tasksOpen = Number(zoneRow.tasks_open || 0);
  const overdueTasks = Number(zoneRow.overdue_tasks || 0);
  const avgUrgency = Number(zoneRow.avg_urgency || 0);
  const operators = Number(zoneRow.active_operators || 0);
  const participationRate = padronTotal > 0 ? (participants / padronTotal) * 100 : 0;
  const participationGap = clamp(100 - participationRate);
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
    coveragePressure
  };
}

function classifyBand(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'controlled';
}

async function persistAutonomousActivationLogs({ req, integrated, selectedDefinitions, global, flags, autonomousMode }) {
  if (!autonomousMode || !Array.isArray(integrated) || integrated.length === 0) {
    return { persisted: false, reason: 'autonomous_mode_disabled_or_empty', saved_logs: 0 };
  }

  let savedLogs = 0;

  for (const zone of integrated) {
    const activated = Array.isArray(zone.contributions)
      ? zone.contributions.filter((item) => item.activated).map((item) => item.algorithm_id)
      : [];

    if (activated.length === 0) continue;

    const zoneDefinitions = selectedDefinitions
      .filter((definition) => activated.includes(definition.id))
      .map((definition) => ({
        id: definition.id,
        name: definition.name,
        category: definition.category,
        phase: definition.phase || 'core'
      }));

    const payload = {
      zone_name: zone.zone_name,
      composite_score: zone.composite_score,
      band: zone.band,
      autonomous_profile: zone.autonomous_profile,
      activated_algorithms: zoneDefinitions,
      raw_scores: zone.contributions,
      context: {
        user_id: Number(req?.user?.id || 0) || null,
        role: req?.user?.role || null,
        include_experimental: flags?.includeExperimental || false,
        enabled_ids_filter: flags?.envEnabledIds || []
      },
      global_signals: {
        max_requests_open: global.maxRequestsOpen,
        max_overdue_tasks: global.maxOverdueTasks,
        max_open_pressure: global.maxOpenPressure,
        max_coverage_pressure: global.maxCoveragePressure
      }
    };

    try {
      await database.query(
        `INSERT INTO operational_algorithm_activation_logs
          (zone_id, activation_mode, severity, composite_signal, activated_count, activated_algorithms, payload, created_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)`,
        [
          zone.zone_id,
          'autonomous',
          zone.autonomous_profile?.severity || zone.band || 'controlled',
          Number(zone.autonomous_profile?.composite_signal || zone.composite_score || 0),
          activated.length,
          JSON.stringify(activated),
          JSON.stringify(payload),
          Number(req?.user?.id || 0) || null
        ]
      );
      savedLogs += 1;
    } catch (error) {
      if (error?.code === '42P01') {
        return { persisted: false, reason: 'table_missing', saved_logs: savedLogs };
      }
      if (error?.code === '42703') {
        return { persisted: false, reason: 'column_missing', saved_logs: savedLogs };
      }
      throw error;
    }
  }

  return { persisted: true, reason: 'ok', saved_logs: savedLogs };
}

function buildSituationProfile(metrics, global) {
  const requestPressure = normalizeAgainstMax(metrics.requestsOpen, global.maxRequestsOpen);
  const overduePressure = normalizeAgainstMax(metrics.overdueTasks, global.maxOverdueTasks);
  const coveragePressure = normalizeAgainstMax(metrics.coveragePressure, global.maxCoveragePressure);
  const urgencyPressure = clamp((metrics.avgUrgency / 5) * 100);
  const participationGap = clamp(metrics.participationGap);

  const composite = round(
    (requestPressure * 0.26)
    + (overduePressure * 0.24)
    + (coveragePressure * 0.22)
    + (urgencyPressure * 0.18)
    + (participationGap * 0.10)
  );

  const severity = classifyBand(composite);

  return {
    severity,
    composite,
    requestPressure,
    overduePressure,
    coveragePressure,
    urgencyPressure,
    participationGap,
    flags: {
      criticalDemand: requestPressure >= 70 || urgencyPressure >= 75,
      backlogCrisis: overduePressure >= 60,
      coverageCrisis: coveragePressure >= 65,
      electoralGapHigh: participationGap >= 55,
      stable: composite < 35
    }
  };
}

function isAutonomouslyActivated(definition, profile) {
  const phase = definition.phase || 'core';
  const id = definition.id;
  const category = definition.category;
  const { severity, flags, composite } = profile;

  if (phase === 'core') {
    if (severity === 'critical') return true;
    if (severity === 'high' && category !== 'forecasting') return true;
    if (severity === 'medium') {
      return ['integrated', 'operations', 'tasks', 'citizen-services', 'risk', 'governance'].includes(category);
    }
    return ['integrated_action_priority', 'territorial_stability', 'governance_compliance_signal'].includes(id);
  }

  if (phase === 'experimental') {
    if (severity === 'critical') return true;
    if (flags.backlogCrisis && ['tasks', 'operations', 'routing', 'citizen-services'].includes(category)) return true;
    if (flags.electoralGapHigh && category === 'electoral') return true;
    if (flags.coverageCrisis && ['operations', 'equity', 'communications'].includes(category)) return true;
    if (flags.stable) {
      return ['route_density_advantage', 'social_stability_projection'].includes(id);
    }
    return composite >= 58 && ['integrated', 'planning', 'finance'].includes(category);
  }

  return false;
}

function buildPredictiveModelDefinitions() {
  return [
    {
      id: 'turnout_projection_30d',
      name: 'Turnout Projection 30d',
      category: 'electoral',
      description: 'Proyecta participación electoral para los próximos 30 días.',
      compute: ({ participationRate, participationGap, requestsOpen }, g, horizonDays = 30) => {
        const pressure = normalizeAgainstMax(requestsOpen, g.maxRequestsOpen);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        const recovery = (participationGap * 0.18) * horizonFactor;
        const drag = pressure * 0.08;
        return round(clamp(participationRate + recovery - drag));
      }
    },
    {
      id: 'request_inflow_forecast',
      name: 'Request Inflow Forecast',
      category: 'citizen-services',
      description: 'Predice crecimiento de solicitudes abiertas por zona.',
      compute: ({ requestsOpen, avgUrgency }, g, horizonDays = 30) => {
        const urgency = clamp((avgUrgency / 5) * 100);
        const pressure = normalizeAgainstMax(requestsOpen, g.maxRequestsOpen);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        return round(clamp((pressure * 0.7) + (urgency * 0.3) + ((horizonFactor - 1) * 9)));
      }
    },
    {
      id: 'backlog_risk_probability',
      name: 'Backlog Risk Probability',
      category: 'tasks',
      description: 'Estima probabilidad de incremento de backlog operativo.',
      compute: ({ overdueTasks, tasksOpen, operators }, g, horizonDays = 30) => {
        const overdue = normalizeAgainstMax(overdueTasks, g.maxOverdueTasks);
        const stressRatio = operators > 0 ? tasksOpen / operators : tasksOpen;
        const stress = normalizeAgainstMax(stressRatio, g.maxTaskPerOperator);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        return round(clamp((overdue * 0.58) + (stress * 0.42) + ((horizonFactor - 1) * 7)));
      }
    },
    {
      id: 'operator_saturation_forecast',
      name: 'Operator Saturation Forecast',
      category: 'operations',
      description: 'Proyecta saturación de operadores por presión de carga.',
      compute: ({ openPressure, operators }, g, horizonDays = 30) => {
        const ratio = operators > 0 ? openPressure / operators : openPressure;
        const ratioNorm = normalizeAgainstMax(ratio, g.maxOpenPerOperator);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        return round(clamp(ratioNorm + ((horizonFactor - 1) * 8)));
      }
    },
    {
      id: 'service_disruption_risk',
      name: 'Service Disruption Risk',
      category: 'risk',
      description: 'Riesgo de disrupción de servicio por presión y urgencia.',
      compute: ({ requestsOpen, overdueTasks, avgUrgency }, g, horizonDays = 30) => {
        const demand = normalizeAgainstMax(requestsOpen, g.maxRequestsOpen);
        const overdue = normalizeAgainstMax(overdueTasks, g.maxOverdueTasks);
        const urgency = clamp((avgUrgency / 5) * 100);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        return round(clamp((demand * 0.4) + (overdue * 0.35) + (urgency * 0.25) + ((horizonFactor - 1) * 6)));
      }
    },
    {
      id: 'territorial_volatility_forecast',
      name: 'Territorial Volatility Forecast',
      category: 'governance',
      description: 'Proyección de volatilidad territorial por señales compuestas.',
      compute: ({ participationGap, requestsOpen, overdueTasks, coveragePressure }, g, horizonDays = 30) => {
        const gap = participationGap;
        const demand = normalizeAgainstMax(requestsOpen, g.maxRequestsOpen);
        const overdue = normalizeAgainstMax(overdueTasks, g.maxOverdueTasks);
        const coverage = normalizeAgainstMax(coveragePressure, g.maxCoveragePressure);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        return round(clamp((gap * 0.32) + (demand * 0.24) + (overdue * 0.24) + (coverage * 0.2) + ((horizonFactor - 1) * 7)));
      }
    },
    {
      id: 'integrated_operational_risk_forecast',
      name: 'Integrated Operational Risk Forecast',
      category: 'integrated',
      description: 'Modelo integrado de riesgo predictivo territorial.',
      compute: (metrics, g, horizonDays = 30) => {
        const demand = normalizeAgainstMax(metrics.requestsOpen, g.maxRequestsOpen);
        const overdue = normalizeAgainstMax(metrics.overdueTasks, g.maxOverdueTasks);
        const stressRatio = metrics.operators > 0 ? metrics.openPressure / metrics.operators : metrics.openPressure;
        const stress = normalizeAgainstMax(stressRatio, g.maxOpenPerOperator);
        const urgency = clamp((metrics.avgUrgency / 5) * 100);
        const electoral = clamp(metrics.participationGap);
        const horizonFactor = clamp(horizonDays / 30, 0.5, 2.5);
        return round(clamp((demand * 0.24) + (overdue * 0.24) + (stress * 0.2) + (urgency * 0.17) + (electoral * 0.15) + ((horizonFactor - 1) * 8)));
      }
    }
  ];
}

function buildOptimizationModelDefinitions() {
  return [
    {
      id: 'brigade_capacity_optimization',
      name: 'Brigade Capacity Optimization',
      objective: 'Minimizar brecha de capacidad operativa por zona.'
    },
    {
      id: 'response_time_optimization',
      name: 'Response Time Optimization',
      objective: 'Reducir tiempo estimado de respuesta territorial.'
    },
    {
      id: 'backlog_reduction_optimization',
      name: 'Backlog Reduction Optimization',
      objective: 'Maximizar reducción esperada de backlog bajo capacidad limitada.'
    },
    {
      id: 'coverage_equity_optimization',
      name: 'Coverage Equity Optimization',
      objective: 'Balancear cobertura entre zonas con distinta presión.'
    },
    {
      id: 'budget_impact_optimization',
      name: 'Budget Impact Optimization',
      objective: 'Optimizar distribución presupuestal por impacto esperado.'
    }
  ];
}

function buildCommonGlobalMetrics(zoneMetrics) {
  return {
    maxRequestsOpen: Math.max(1, ...zoneMetrics.map((item) => item.metrics.requestsOpen)),
    maxOverdueTasks: Math.max(1, ...zoneMetrics.map((item) => item.metrics.overdueTasks)),
    maxOpenPressure: Math.max(1, ...zoneMetrics.map((item) => item.metrics.openPressure)),
    maxCoveragePressure: Math.max(1, ...zoneMetrics.map((item) => item.metrics.coveragePressure)),
    maxOperators: Math.max(1, ...zoneMetrics.map((item) => item.metrics.operators)),
    maxTaskPerOperator: Math.max(1, ...zoneMetrics.map((item) => (item.metrics.operators > 0 ? item.metrics.tasksOpen / item.metrics.operators : item.metrics.tasksOpen))),
    maxRequestPerOperator: Math.max(1, ...zoneMetrics.map((item) => (item.metrics.operators > 0 ? item.metrics.requestsOpen / item.metrics.operators : item.metrics.requestsOpen))),
    maxOpenPerOperator: Math.max(1, ...zoneMetrics.map((item) => (item.metrics.operators > 0 ? item.metrics.openPressure / item.metrics.operators : item.metrics.openPressure)))
  };
}

function estimateTravelMinutes(distanceKm, speedKmh) {
  const safeDistance = Number(distanceKm || 0);
  const safeSpeed = Math.max(1, Number(speedKmh || 0));
  return round((safeDistance / safeSpeed) * 60);
}

function optimizeResponseRoute(zoneMetrics, speedKmh = 28) {
  const pending = zoneMetrics
    .map((item) => ({
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      lat: toNum(item.raw.center_lat, null),
      lng: toNum(item.raw.center_lng, null),
      pressure: item.metrics.openPressure,
      urgency: item.metrics.avgUrgency,
      priority: round((item.metrics.openPressure * 0.6) + (item.metrics.avgUrgency * 10 * 0.4))
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .sort((a, b) => b.priority - a.priority);

  if (pending.length === 0) {
    return {
      sequence: [],
      total_distance_km: 0,
      estimated_minutes: 0
    };
  }

  const selected = [];
  const rest = [...pending];
  selected.push(rest.shift());

  while (rest.length > 0) {
    const last = selected[selected.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    rest.forEach((candidate, index) => {
      const distance = haversineKm(last.lat, last.lng, candidate.lat, candidate.lng);
      const safeDistance = Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY;
      if (safeDistance < nearestDistance) {
        nearestDistance = safeDistance;
        nearestIndex = index;
      }
    });

    selected.push(rest.splice(nearestIndex, 1)[0]);
  }

  let totalDistance = 0;
  const legs = [];
  for (let index = 0; index < selected.length; index += 1) {
    if (index === 0) continue;
    const prev = selected[index - 1];
    const current = selected[index];
    const distance = haversineKm(prev.lat, prev.lng, current.lat, current.lng) || 0;
    totalDistance += distance;
    legs.push({
      from_zone_id: prev.zone_id,
      to_zone_id: current.zone_id,
      distance_km: round(distance),
      estimated_minutes: estimateTravelMinutes(distance, speedKmh)
    });
  }

  return {
    sequence: selected.map((item, index) => ({
      order: index + 1,
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      priority: item.priority,
      pressure: item.pressure,
      urgency: item.urgency
    })),
    legs,
    total_distance_km: round(totalDistance),
    estimated_minutes: estimateTravelMinutes(totalDistance, speedKmh)
  };
}

export const getAdvancedAlgorithmsCatalog = asyncHandler(async (_req, res) => {
  const definitions = buildAdvancedAlgorithmDefinitions();
  const { selected, flags } = selectAlgorithms(definitions, _req);

  const visible = selected.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    phase: item.phase || 'core',
    description: item.description
  }));

  res.json({
    generated_at: new Date().toISOString(),
    suite: 'abaco_advanced_algorithms_v1',
    total_algorithms: visible.length,
    total_available: definitions.length,
    feature_flags: {
      include_experimental: flags.includeExperimental,
      enabled_ids_filter: flags.envEnabledIds
    },
    data: visible
  });
});

export const getPredictiveModelsCatalog = asyncHandler(async (_req, res) => {
  const definitions = buildPredictiveModelDefinitions();
  res.json({
    generated_at: new Date().toISOString(),
    suite: 'abaco_predictive_models_v1',
    total_models: definitions.length,
    data: definitions.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description
    }))
  });
});

export const runPredictiveModelsSuite = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const limit = Math.min(Math.max(toInt(req.query.limit, 10) ?? 10, 1), 100);
  const horizonDays = Math.min(Math.max(toInt(req.query.horizon_days, 30) ?? 30, 7), 180);
  const requestedModels = String(req.query.models || '').trim();

  const definitions = buildPredictiveModelDefinitions();
  const { selected } = selectAlgorithms(definitions, req, requestedModels);

  const rows = await fetchZoneOperationalRows(zoneIdFilter);
  const zoneMetrics = rows.map((row) => ({
    zone_id: Number(row.zone_id),
    zone_name: row.zone_name,
    metrics: buildAdvancedMetrics(row)
  }));

  const global = buildCommonGlobalMetrics(zoneMetrics);

  const modelRuns = selected.map((model) => {
    const zones = zoneMetrics.map((item) => {
      const forecast = clamp(model.compute(item.metrics, global, horizonDays));
      return {
        zone_id: item.zone_id,
        zone_name: item.zone_name,
        forecast_score: round(forecast),
        forecast_band: classifyBand(forecast)
      };
    }).sort((a, b) => b.forecast_score - a.forecast_score);

    const average = zones.length
      ? zones.reduce((acc, item) => acc + item.forecast_score, 0) / zones.length
      : 0;

    return {
      id: model.id,
      name: model.name,
      category: model.category,
      description: model.description,
      avg_forecast: round(average),
      top_zones: zones.slice(0, limit)
    };
  });

  const integrated = zoneMetrics.map((item) => {
    const contributions = modelRuns.map((model) => {
      const topFound = model.top_zones.find((zone) => zone.zone_id === item.zone_id);
      if (topFound) {
        return {
          model_id: model.id,
          score: topFound.forecast_score
        };
      }

      const source = selected.find((candidate) => candidate.id === model.id);
      return {
        model_id: model.id,
        score: round(clamp(source?.compute(item.metrics, global, horizonDays) || 0))
      };
    });

    const composite = contributions.length
      ? contributions.reduce((acc, current) => acc + Number(current.score || 0), 0) / contributions.length
      : 0;

    return {
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      predictive_risk_score: round(composite),
      forecast_band: classifyBand(composite),
      drivers: contributions.slice(0, 8)
    };
  }).sort((a, b) => b.predictive_risk_score - a.predictive_risk_score);

  res.json({
    generated_at: new Date().toISOString(),
    suite: 'abaco_predictive_models_v1',
    applied_filters: {
      zone_id: zoneIdFilter,
      limit,
      horizon_days: horizonDays,
      models: selected.map((item) => item.id)
    },
    summary: {
      models_executed: selected.length,
      zones_evaluated: zoneMetrics.length,
      top_zone: integrated[0]?.zone_name || null,
      top_score: integrated[0]?.predictive_risk_score || 0
    },
    integrated_ranking: integrated.slice(0, limit),
    models: modelRuns
  });
});

export const getOptimizationModelsCatalog = asyncHandler(async (_req, res) => {
  const definitions = buildOptimizationModelDefinitions();
  res.json({
    generated_at: new Date().toISOString(),
    suite: 'abaco_optimization_models_v1',
    total_models: definitions.length,
    data: definitions
  });
});

export const runOptimizationModelsSuite = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const limit = Math.min(Math.max(toInt(req.query.limit, 10) ?? 10, 1), 100);
  const brigadesAvailable = Math.min(Math.max(toInt(req.query.brigades, 12) ?? 12, 1), 500);
  const interventionCapacity = Math.min(Math.max(toInt(req.query.max_interventions, 6) ?? 6, 1), 200);
  const totalBudget = Math.min(Math.max(toNum(req.query.budget, 120000) ?? 120000, 1000), 100000000);
  const speedKmh = Math.min(Math.max(toNum(req.query.speed_kmh, 28) ?? 28, 5), 120);

  const rows = await fetchZoneOperationalRows(zoneIdFilter);
  const zoneMetrics = rows.map((row) => ({
    zone_id: Number(row.zone_id),
    zone_name: row.zone_name,
    raw: row,
    metrics: buildAdvancedMetrics(row)
  }));

  const global = buildCommonGlobalMetrics(zoneMetrics);

  const optimizationScores = zoneMetrics.map((item) => {
    const demand = normalizeAgainstMax(item.metrics.requestsOpen, global.maxRequestsOpen);
    const overdue = normalizeAgainstMax(item.metrics.overdueTasks, global.maxOverdueTasks);
    const gap = clamp(item.metrics.participationGap);
    const coverage = normalizeAgainstMax(item.metrics.coveragePressure, global.maxCoveragePressure);
    const score = round((demand * 0.35) + (overdue * 0.3) + (gap * 0.2) + (coverage * 0.15));
    return {
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      score,
      demand,
      overdue,
      gap,
      coverage,
      metrics: item.metrics
    };
  }).sort((a, b) => b.score - a.score);

  const totalScoreMass = Math.max(1, optimizationScores.reduce((acc, item) => acc + item.score, 0));

  const brigadePlan = optimizationScores.slice(0, limit).map((item) => {
    const expectedShare = item.score / totalScoreMass;
    const brigades = Math.max(1, Math.round(expectedShare * brigadesAvailable));
    return {
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      optimization_score: item.score,
      brigades_assigned: brigades,
      expected_capacity: brigades * 6
    };
  });

  const backlogPlan = optimizationScores.slice(0, interventionCapacity).map((item, index) => ({
    rank: index + 1,
    zone_id: item.zone_id,
    zone_name: item.zone_name,
    optimization_score: item.score,
    expected_backlog_reduction: round((item.metrics.openPressure * 0.32) + (item.metrics.overdueTasks * 0.48))
  }));

  const lowPressure = [...optimizationScores].reverse().slice(0, Math.min(3, optimizationScores.length));
  const highPressure = optimizationScores.slice(0, Math.min(3, optimizationScores.length));
  const transferPlan = highPressure.map((target, index) => ({
    from_zone_id: lowPressure[index % Math.max(1, lowPressure.length)]?.zone_id || null,
    from_zone_name: lowPressure[index % Math.max(1, lowPressure.length)]?.zone_name || null,
    to_zone_id: target.zone_id,
    to_zone_name: target.zone_name,
    operators_to_transfer: 1
  })).filter((item) => item.from_zone_id && item.from_zone_id !== item.to_zone_id);

  const budgetPlan = optimizationScores.slice(0, limit).map((item) => {
    const share = item.score / totalScoreMass;
    return {
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      optimization_score: item.score,
      allocated_budget: round(totalBudget * share, 2),
      expected_impact_index: round(item.score * 0.78)
    };
  });

  const responseRoute = optimizeResponseRoute(zoneMetrics, speedKmh);

  res.json({
    generated_at: new Date().toISOString(),
    suite: 'abaco_optimization_models_v1',
    applied_filters: {
      zone_id: zoneIdFilter,
      limit,
      brigades: brigadesAvailable,
      max_interventions: interventionCapacity,
      budget: totalBudget,
      speed_kmh: speedKmh
    },
    summary: {
      zones_evaluated: optimizationScores.length,
      top_zone: optimizationScores[0]?.zone_name || null,
      top_score: optimizationScores[0]?.score || 0,
      route_stops: responseRoute.sequence.length
    },
    optimization_models: buildOptimizationModelDefinitions(),
    optimization_ranking: optimizationScores.slice(0, limit).map((item) => ({
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      optimization_score: item.score,
      band: classifyBand(item.score)
    })),
    plans: {
      brigade_capacity_optimization: brigadePlan,
      response_time_optimization: responseRoute,
      backlog_reduction_optimization: backlogPlan,
      coverage_equity_optimization: transferPlan,
      budget_impact_optimization: budgetPlan
    }
  });
});

export const runAdvancedAlgorithmsSuite = asyncHandler(async (req, res) => {
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const limit = Math.min(Math.max(toInt(req.query.limit, 10) ?? 10, 1), 100);
  const requestedAlgorithms = String(req.query.algorithms || '').trim();
  const autonomousMode = !['false', '0', 'off', 'no'].includes(String(req.query.auto || 'true').trim().toLowerCase());

  const definitions = buildAdvancedAlgorithmDefinitions();
  const { selected: selectedDefinitions, flags } = selectAlgorithms(definitions, req, requestedAlgorithms);

  const rows = await fetchZoneOperationalRows(zoneIdFilter);
  const zoneMetrics = rows.map((row) => ({
    zone_id: Number(row.zone_id),
    zone_name: row.zone_name,
    raw: row,
    metrics: buildAdvancedMetrics(row)
  }));

  const global = {
    maxRequestsOpen: Math.max(1, ...zoneMetrics.map((item) => item.metrics.requestsOpen)),
    maxOverdueTasks: Math.max(1, ...zoneMetrics.map((item) => item.metrics.overdueTasks)),
    maxOpenPressure: Math.max(1, ...zoneMetrics.map((item) => item.metrics.openPressure)),
    maxCoveragePressure: Math.max(1, ...zoneMetrics.map((item) => item.metrics.coveragePressure)),
    maxOperators: Math.max(1, ...zoneMetrics.map((item) => item.metrics.operators)),
    maxTaskPerOperator: Math.max(1, ...zoneMetrics.map((item) => (item.metrics.operators > 0 ? item.metrics.tasksOpen / item.metrics.operators : item.metrics.tasksOpen))),
    maxRequestPerOperator: Math.max(1, ...zoneMetrics.map((item) => (item.metrics.operators > 0 ? item.metrics.requestsOpen / item.metrics.operators : item.metrics.requestsOpen)))
  };

  const profileByZoneId = new Map(zoneMetrics.map((item) => [
    item.zone_id,
    buildSituationProfile(item.metrics, global)
  ]));

  const activeByZoneId = new Map(zoneMetrics.map((item) => {
    const profile = profileByZoneId.get(item.zone_id);
    const activeIds = autonomousMode
      ? selectedDefinitions.filter((definition) => isAutonomouslyActivated(definition, profile)).map((definition) => definition.id)
      : selectedDefinitions.map((definition) => definition.id);
    return [item.zone_id, new Set(activeIds)];
  }));

  const algorithmsResult = selectedDefinitions.map((definition) => {
    const zoneScores = zoneMetrics.map((item) => {
      const activeSet = activeByZoneId.get(item.zone_id) || new Set();
      const isActive = activeSet.has(definition.id);
      const score = clamp(definition.compute(item.metrics, global));
      return {
        zone_id: item.zone_id,
        zone_name: item.zone_name,
        score: round(score),
        band: classifyBand(score),
        activated: isActive
      };
    }).sort((a, b) => b.score - a.score);

    const activeScores = zoneScores.filter((item) => item.activated);
    const average = activeScores.length
      ? activeScores.reduce((acc, item) => acc + item.score, 0) / activeScores.length
      : 0;

    return {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      phase: definition.phase || 'core',
      description: definition.description,
      avg_score: round(average),
      activation_rate: zoneScores.length ? round((activeScores.length / zoneScores.length) * 100) : 0,
      active_zones: activeScores.length,
      top_zones: zoneScores.slice(0, limit)
    };
  });

  const integrated = zoneMetrics.map((item) => {
    const profile = profileByZoneId.get(item.zone_id);
    const activeSet = activeByZoneId.get(item.zone_id) || new Set();
    const contributions = algorithmsResult.map((algorithm) => {
      const found = algorithm.top_zones.find((zone) => zone.zone_id === item.zone_id)
        || {
          zone_id: item.zone_id,
          zone_name: item.zone_name,
          score: clamp(selectedDefinitions.find((def) => def.id === algorithm.id)?.compute(item.metrics, global) || 0),
          band: 'controlled',
          activated: false
        };
      return {
        algorithm_id: algorithm.id,
        score: round(found.score),
        activated: activeSet.has(algorithm.id)
      };
    });

    const activeContributions = contributions.filter((itemContribution) => itemContribution.activated);

    const composite = activeContributions.length
      ? activeContributions.reduce((acc, current) => acc + Number(current.score || 0), 0) / activeContributions.length
      : 0;

    return {
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      composite_score: round(composite),
      band: classifyBand(composite),
      autonomous_profile: {
        severity: profile?.severity || 'controlled',
        composite_signal: profile?.composite || 0
      },
      active_algorithms: activeContributions.length,
      contributions: contributions.slice(0, 8)
    };
  }).sort((a, b) => b.composite_score - a.composite_score);

  const totalActivations = integrated.reduce((acc, item) => acc + Number(item.active_algorithms || 0), 0);
  const persistence = await persistAutonomousActivationLogs({
    req,
    integrated,
    selectedDefinitions,
    global,
    flags,
    autonomousMode
  });

  res.json({
    generated_at: new Date().toISOString(),
    suite: 'abaco_advanced_algorithms_v1',
    applied_filters: {
      zone_id: zoneIdFilter,
      limit,
      algorithms: selectedDefinitions.map((item) => item.id),
      auto: autonomousMode,
      include_experimental: flags.includeExperimental,
      enabled_ids_filter: flags.envEnabledIds
    },
    summary: {
      algorithms_executed: selectedDefinitions.length,
      autonomous_mode: autonomousMode,
      total_activations: totalActivations,
      persisted_logs: persistence.saved_logs,
      zones_evaluated: zoneMetrics.length,
      integrated_top_zone: integrated[0]?.zone_name || null,
      integrated_top_score: integrated[0]?.composite_score || 0
    },
    persistence,
    integrated_ranking: integrated.slice(0, limit),
    algorithms: algorithmsResult
  });
});

export const getAdvancedActivationLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(toInt(req.query.limit, 50) ?? 50, 1), 500);
  const zoneIdFilter = toInt(req.query.zone_id, null);
  const severityFilter = String(req.query.severity || '').trim().toLowerCase();

  const values = [];
  let where = 'WHERE 1=1';

  if (zoneIdFilter !== null) {
    values.push(zoneIdFilter);
    where += ` AND l.zone_id = $${values.length}`;
  }

  if (severityFilter) {
    values.push(severityFilter);
    where += ` AND LOWER(COALESCE(l.severity, '')) = $${values.length}`;
  }

  values.push(limit);

  const query = `
    SELECT
      l.id,
      l.zone_id,
      z.name AS zone_name,
      l.activation_mode,
      l.severity,
      l.composite_signal,
      l.activated_count,
      l.activated_algorithms,
      l.payload,
      l.created_by,
      u.name AS created_by_name,
      l.created_at
    FROM operational_algorithm_activation_logs l
    LEFT JOIN zones z ON z.id = l.zone_id
    LEFT JOIN users u ON u.id = l.created_by
    ${where}
    ORDER BY l.created_at DESC
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
          severity: severityFilter || null
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
            severity: severityFilter || null
          }
        },
        warning: 'Tabla de logs no encontrada. Ejecuta migraciones para habilitar histórico.'
      });
    }
    throw error;
  }
});
