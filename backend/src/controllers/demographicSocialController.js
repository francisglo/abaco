import database from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

function clamp(value, min = 0, max = 100) {
  const num = Number(value) || 0;
  return Math.max(min, Math.min(max, num));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseMetric(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(numeric);
}

export const getDemographicSocialSummary = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 30);
  const zoneIdFilter = parseIntOrNull(req.query.zone_id);

  const query = `
    WITH zone_base AS (
      SELECT z.id AS zone_id, z.name AS zone_name
      FROM zones z
      WHERE ($1::int IS NULL OR z.id = $1)
    ),
    voter_counts AS (
      SELECT
        v.zone_id,
        COUNT(*)::int AS population_proxy,
        COUNT(*) FILTER (WHERE v.created_at >= NOW() - INTERVAL '90 days')::int AS recent_registrations,
        COUNT(*) FILTER (WHERE v.created_at >= NOW() - INTERVAL '180 days' AND v.created_at < NOW() - INTERVAL '90 days')::int AS previous_registrations
      FROM voters v
      WHERE ($1::int IS NULL OR v.zone_id = $1)
      GROUP BY v.zone_id
    ),
    social_pressure AS (
      SELECT
        cr.zone_id,
        COUNT(*)::int AS requests_total,
        COUNT(*) FILTER (WHERE cr.status IN ('pending', 'in_progress'))::int AS requests_open,
        COALESCE(AVG(cr.urgency), 0)::numeric(10,2) AS avg_urgency
      FROM citizen_requests cr
      WHERE ($1::int IS NULL OR cr.zone_id = $1)
      GROUP BY cr.zone_id
    ),
    labor_signal AS (
      SELECT
        t.assigned_to,
        COUNT(*) FILTER (WHERE t.status IN ('pending', 'in_progress'))::int AS open_tasks
      FROM tasks t
      GROUP BY t.assigned_to
    ),
    zone_tasks AS (
      SELECT
        u.zone_id,
        COALESCE(SUM(ls.open_tasks), 0)::int AS open_tasks
      FROM users u
      LEFT JOIN labor_signal ls ON ls.assigned_to = u.id
      WHERE ($1::int IS NULL OR u.zone_id = $1)
      GROUP BY u.zone_id
    ),
    indicator_latest AS (
      SELECT
        ti.zone_id,
        ti.indicator_name,
        ti.indicator_type,
        ti.value,
        ROW_NUMBER() OVER (PARTITION BY ti.zone_id, lower(ti.indicator_name) ORDER BY ti.measurement_date DESC NULLS LAST, ti.id DESC) AS rn
      FROM territorial_indicators ti
      WHERE ($1::int IS NULL OR ti.zone_id = $1)
    ),
    indicators AS (
      SELECT
        zone_id,
        MAX(CASE WHEN (indicator_name ILIKE '%desemple%' OR indicator_name ILIKE '%unemployment%' OR indicator_type ILIKE '%empleo%') THEN value END) AS unemployment_rate,
        MAX(CASE WHEN (indicator_name ILIKE '%pobre%' OR indicator_type ILIKE '%social%') THEN value END) AS poverty_rate,
        MAX(CASE WHEN (indicator_name ILIKE '%escolar%' OR indicator_name ILIKE '%education%' OR indicator_type ILIKE '%educ%') THEN value END) AS schooling_level,
        MAX(CASE WHEN (indicator_name ILIKE '%urbaniz%' OR indicator_type ILIKE '%urban%') THEN value END) AS urbanization_rate,
        MAX(CASE WHEN (indicator_name ILIKE '%envejec%' OR indicator_name ILIKE '%adulto mayor%' OR indicator_name ILIKE '%aging%') THEN value END) AS aging_share,
        MAX(CASE WHEN (indicator_name ILIKE '%joven%' OR indicator_name ILIKE '%juvent%' OR indicator_name ILIKE '%youth%') THEN value END) AS youth_share
      FROM indicator_latest
      WHERE rn = 1
      GROUP BY zone_id
    )
    SELECT
      zb.zone_id,
      zb.zone_name,
      COALESCE(vc.population_proxy, 0) AS population_proxy,
      COALESCE(vc.recent_registrations, 0) AS recent_registrations,
      COALESCE(vc.previous_registrations, 0) AS previous_registrations,
      COALESCE(sp.requests_total, 0) AS requests_total,
      COALESCE(sp.requests_open, 0) AS requests_open,
      COALESCE(sp.avg_urgency, 0) AS avg_urgency,
      COALESCE(zt.open_tasks, 0) AS open_tasks,
      i.unemployment_rate,
      i.poverty_rate,
      i.schooling_level,
      i.urbanization_rate,
      i.aging_share,
      i.youth_share
    FROM zone_base zb
    LEFT JOIN voter_counts vc ON vc.zone_id = zb.zone_id
    LEFT JOIN social_pressure sp ON sp.zone_id = zb.zone_id
    LEFT JOIN zone_tasks zt ON zt.zone_id = zb.zone_id
    LEFT JOIN indicators i ON i.zone_id = zb.zone_id
    ORDER BY COALESCE(vc.population_proxy, 0) DESC, zb.zone_name ASC
    LIMIT $2
  `;

  const { rows } = await database.query(query, [zoneIdFilter, limit]);

  const zones = rows.map((row) => {
    const population = Number(row.population_proxy || 0);
    const recent = Number(row.recent_registrations || 0);
    const previous = Number(row.previous_registrations || 0);
    const requestsTotal = Number(row.requests_total || 0);
    const requestsOpen = Number(row.requests_open || 0);
    const avgUrgency = Number(row.avg_urgency || 0);
    const openTasks = Number(row.open_tasks || 0);

    const growthRate = previous > 0
      ? round(((recent - previous) / previous) * 100, 2)
      : round(recent > 0 ? Math.min(15, recent / 4) : 0, 2);

    const migrationIndex = clamp(round((growthRate * 2.8) + (requestsOpen * 0.45) + (avgUrgency * 4.2)));
    const unemploymentRate = parseMetric(row.unemployment_rate, clamp((openTasks * 1.6) + 8));
    const povertyRate = parseMetric(row.poverty_rate, clamp((requestsOpen * 2.1) + (avgUrgency * 6)));
    const schoolingLevel = parseMetric(row.schooling_level, clamp(74 - (povertyRate * 0.35)));
    const urbanizationRate = parseMetric(row.urbanization_rate, clamp(45 + (population * 0.08) + (migrationIndex * 0.18)));
    const youthShare = parseMetric(row.youth_share, clamp(34 - (povertyRate * 0.08) + (migrationIndex * 0.04), 14, 45));
    const agingShare = parseMetric(row.aging_share, clamp(11 + ((100 - growthRate) * 0.09), 5, 35));

    const vulnerabilityIndex = clamp(round(
      (povertyRate * 0.42)
      + (unemploymentRate * 0.28)
      + ((100 - schoolingLevel) * 0.2)
      + ((requestsOpen > 0 ? (requestsOpen / Math.max(1, requestsTotal)) * 100 : 0) * 0.1)
    ));

    const serviceDemandIndex = clamp(round((urbanizationRate * 0.45) + (migrationIndex * 0.3) + (youthShare * 0.25)));

    return {
      zone_id: Number(row.zone_id),
      zone_name: row.zone_name,
      population_proxy: population,
      growth_rate: growthRate,
      migration_index: migrationIndex,
      urbanization_rate: round(urbanizationRate),
      demographic_structure: {
        youth_share: round(youthShare),
        aging_share: round(agingShare),
        dependency_ratio: round(((youthShare + agingShare) / Math.max(1, 100 - (youthShare + agingShare))) * 100)
      },
      social_structure: {
        schooling_level: round(schoolingLevel),
        unemployment_rate: round(unemploymentRate),
        poverty_rate: round(povertyRate)
      },
      vulnerability_index: vulnerabilityIndex,
      service_demand_index: serviceDemandIndex
    };
  });

  const totalPopulationProxy = zones.reduce((acc, item) => acc + Number(item.population_proxy || 0), 0);
  const averageGrowthRate = zones.length ? round(zones.reduce((acc, item) => acc + Number(item.growth_rate || 0), 0) / zones.length) : 0;
  const averageUrbanization = zones.length ? round(zones.reduce((acc, item) => acc + Number(item.urbanization_rate || 0), 0) / zones.length) : 0;
  const averageVulnerability = zones.length ? round(zones.reduce((acc, item) => acc + Number(item.vulnerability_index || 0), 0) / zones.length) : 0;
  const averageServiceDemand = zones.length ? round(zones.reduce((acc, item) => acc + Number(item.service_demand_index || 0), 0) / zones.length) : 0;

  const vulnerableTerritories = [...zones]
    .sort((a, b) => Number(b.vulnerability_index || 0) - Number(a.vulnerability_index || 0))
    .slice(0, 5)
    .map((item) => ({
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      vulnerability_index: item.vulnerability_index,
      priority_reason: item.vulnerability_index >= 70
        ? 'Alta pobreza, desempleo y presión social acumulada.'
        : 'Brecha social relevante con necesidad de focalización territorial.'
    }));

  const projections = {
    one_year_population_growth: round(averageGrowthRate * 0.9),
    three_year_population_growth: round(averageGrowthRate * 2.4),
    service_demand_growth: round((averageServiceDemand * 0.12) + (averageGrowthRate * 0.4)),
    urban_expansion_pressure: round((averageUrbanization * 0.4) + (averageGrowthRate * 0.6))
  };

  res.json({
    generated_at: new Date().toISOString(),
    applied_filters: {
      zone_id: zoneIdFilter,
      limit
    },
    summary: {
      territories_analyzed: zones.length,
      total_population_proxy: totalPopulationProxy,
      average_growth_rate: averageGrowthRate,
      average_urbanization_rate: averageUrbanization,
      average_vulnerability_index: averageVulnerability,
      average_service_demand_index: averageServiceDemand
    },
    demographic_structure: {
      average_youth_share: zones.length ? round(zones.reduce((acc, item) => acc + Number(item.demographic_structure.youth_share || 0), 0) / zones.length) : 0,
      average_aging_share: zones.length ? round(zones.reduce((acc, item) => acc + Number(item.demographic_structure.aging_share || 0), 0) / zones.length) : 0,
      average_dependency_ratio: zones.length ? round(zones.reduce((acc, item) => acc + Number(item.demographic_structure.dependency_ratio || 0), 0) / zones.length) : 0
    },
    projections,
    vulnerable_territories: vulnerableTerritories,
    territories: zones
  });
});
