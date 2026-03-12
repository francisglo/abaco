import database from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const VALID_SECTORS = ['comercio', 'servicios', 'agricultura', 'transporte', 'mixto'];

function clamp(value, min = 0, max = 100) {
  const num = Number(value) || 0;
  return Math.max(min, Math.min(max, num));
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function getDominantSector(row) {
  const sectors = [
    { key: 'events_points', label: 'Comercio' },
    { key: 'citizen_requests_points', label: 'Servicios' },
    { key: 'field_reports_points', label: 'Agricultura' },
    { key: 'voter_points', label: 'Transporte' }
  ];

  const top = sectors.sort((a, b) => (Number(row?.[b.key] || 0) - Number(row?.[a.key] || 0)))[0];
  return Number(row?.[top?.key] || 0) > 0 ? top.label : 'Mixto';
}

function getRecommendedProduct(segment) {
  if (segment.credit_potential >= 75 && segment.risk_score <= 35) return 'Crédito productivo de expansión';
  if (segment.credit_potential >= 60 && segment.risk_score <= 50) return 'Microcrédito comercial';
  if (segment.risk_score > 60) return 'Línea de alivio y reestructuración';
  return 'Crédito escalonado con seguimiento';
}

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeSector(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'all') return null;
  return VALID_SECTORS.includes(normalized) ? normalized : null;
}

export const getFinancialTerritorialSummary = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
  const zoneIdFilter = parseIntOrNull(req.query.zone_id);
  const sectorFilter = normalizeSector(req.query.sector);
  const minCreditPotential = parseNumberOrNull(req.query.min_credit_potential);
  const maxRiskScore = parseNumberOrNull(req.query.max_risk_score);

  const totalsQuery = `
    SELECT
      (SELECT COUNT(*)::int FROM zones) AS total_zones,
      (SELECT COUNT(*)::int FROM geo_entities) AS total_geo_entities,
      (SELECT COUNT(*)::int FROM voters) AS total_voters,
      (SELECT COUNT(*)::int FROM tasks) AS total_tasks,
      (SELECT COUNT(*)::int FROM tasks WHERE status IN ('pending', 'in_progress')) AS open_tasks,
      (SELECT COUNT(*)::int FROM voters WHERE status = 'pending') AS pending_voters
  `;

  const segmentsQuery = `
    WITH zone_base AS (
      SELECT z.id, z.name, z.priority, COALESCE(z.description, '') AS description
      FROM zones z
    ),
    geo_counts AS (
      SELECT
        zone_id,
        COUNT(*)::int AS total_points,
        COUNT(*) FILTER (WHERE entity_type = 'events')::int AS events_points,
        COUNT(*) FILTER (WHERE entity_type = 'field_reports')::int AS field_reports_points,
        COUNT(*) FILTER (WHERE entity_type = 'citizen_requests')::int AS citizen_requests_points,
        COUNT(*) FILTER (WHERE entity_type = 'voters')::int AS voter_points
      FROM geo_entities
      GROUP BY zone_id
    ),
    voter_counts AS (
      SELECT
        zone_id,
        COUNT(*)::int AS voters_total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS voters_pending
      FROM voters
      GROUP BY zone_id
    )
    SELECT
      zb.id AS zone_id,
      zb.name AS zone_name,
      gc.total_points,
      gc.events_points,
      gc.field_reports_points,
      gc.citizen_requests_points,
      gc.voter_points,
      COALESCE(vc.voters_total, 0) AS voters_total,
      COALESCE(vc.voters_pending, 0) AS voters_pending
    FROM zone_base zb
    LEFT JOIN geo_counts gc ON gc.zone_id = zb.id
    LEFT JOIN voter_counts vc ON vc.zone_id = zb.id
    ORDER BY COALESCE(vc.voters_total, 0) DESC, COALESCE(vc.voters_pending, 0) DESC, zb.id ASC
    LIMIT $1
  `;

  const totals = await database.queryOne(totalsQuery);
  const segmentsResult = await database.query(segmentsQuery, [limit]);
  const rawSegments = segmentsResult.rows || [];

  const allSegments = rawSegments.map((row) => {
    const economicCapacity = clamp(
      (Number(row.total_points || 0) * 1.9) +
      (Number(row.voters_total || 0) * 0.6)
    );
    const informalityIndex = clamp(
      (Number(row.total_points || 0) * 0.45) +
      (Number(row.voters_pending || 0) * 2.1)
    );
    const creditPotential = clamp(round((economicCapacity * 0.7) + ((100 - informalityIndex) * 0.3)));
    const riskScore = clamp(round((informalityIndex * 0.68) + ((Number(row.voters_pending || 0) * 2.6) * 0.32)));
    const coverageGap = clamp(round((Number(row.voters_pending || 0) * 3.8) + (100 - economicCapacity) * 0.25));

    const segment = {
      zone_id: Number(row.zone_id),
      zone_name: row.zone_name,
      dominant_sector: getDominantSector(row),
      economic_capacity: round(economicCapacity),
      informality_index: round(informalityIndex),
      credit_potential: creditPotential,
      risk_score: riskScore,
      coverage_gap: coverageGap,
      recommended_product: ''
    };

    segment.recommended_product = getRecommendedProduct(segment);
    return segment;
  });

  const segments = allSegments.filter((item) => {
    if (zoneIdFilter !== null && item.zone_id !== zoneIdFilter) return false;
    if (sectorFilter && String(item.dominant_sector || '').trim().toLowerCase() !== sectorFilter) return false;
    if (minCreditPotential !== null && item.credit_potential < minCreditPotential) return false;
    if (maxRiskScore !== null && item.risk_score > maxRiskScore) return false;
    return true;
  });

  const avgCreditPotential = segments.length
    ? segments.reduce((acc, item) => acc + item.credit_potential, 0) / segments.length
    : 0;
  const avgRisk = segments.length
    ? segments.reduce((acc, item) => acc + item.risk_score, 0) / segments.length
    : 0;
  const avgCoverageGap = segments.length
    ? segments.reduce((acc, item) => acc + item.coverage_gap, 0) / segments.length
    : 0;

  const iadtEconomicActivity = clamp(round(avgCreditPotential * 0.92));
  const iadtCreditPotential = clamp(round(avgCreditPotential));
  const iadtTerritorialStability = clamp(round(100 - avgRisk));
  const iadtSocialOrganization = clamp(round(100 - avgCoverageGap));
  const iadtScore = clamp(round(
    (iadtEconomicActivity * 0.3)
      + (iadtCreditPotential * 0.3)
      + (iadtTerritorialStability * 0.25)
      + (iadtSocialOrganization * 0.15)
  ));

  const coverageOpportunities = [...segments]
    .sort((a, b) => b.coverage_gap - a.coverage_gap)
    .slice(0, 3)
    .map((item) => ({
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      reason: item.coverage_gap >= 60
        ? 'Zona subatendida con brecha de cobertura alta'
        : 'Zona con oportunidad de consolidación financiera',
      recommended_action: item.credit_potential >= 70
        ? 'Evaluar apertura de punto de atención y línea productiva'
        : 'Desplegar corresponsal financiero y educación crediticia'
    }));

  const activeCreditsEstimate = Math.max(0, Math.round((Number(totals?.total_voters || 0) * 0.18) + (avgCreditPotential * 8)));
  const beneficiariesEstimate = Math.max(0, Math.round(activeCreditsEstimate * 1.45));
  const impactIndex = clamp(round((avgCreditPotential * 0.55) + ((100 - avgRisk) * 0.45)));

  const availableZones = allSegments
    .map((item) => ({ id: item.zone_id, name: item.zone_name }))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es', { sensitivity: 'base' }));

  const availableSectors = allSegments
    .map((item) => String(item.dominant_sector || '').trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  res.json({
    generated_at: new Date().toISOString(),
    applied_filters: {
      zone_id: zoneIdFilter,
      sector: sectorFilter,
      min_credit_potential: minCreditPotential,
      max_risk_score: maxRiskScore,
      limit
    },
    summary: {
      total_zones: Number(totals?.total_zones || 0),
      total_geo_entities: Number(totals?.total_geo_entities || 0),
      total_voters: Number(totals?.total_voters || 0),
      total_tasks: Number(totals?.total_tasks || 0),
      open_tasks: Number(totals?.open_tasks || 0),
      pending_voters: Number(totals?.pending_voters || 0),
      financial_opportunity_score: round(avgCreditPotential),
      territorial_risk_score: round(avgRisk)
    },
    available_filters: {
      zones: availableZones,
      sectors: availableSectors
    },
    iadt: {
      score: iadtScore,
      components: {
        economic_activity: iadtEconomicActivity,
        credit_potential: iadtCreditPotential,
        territorial_stability: iadtTerritorialStability,
        social_organization: iadtSocialOrganization
      }
    },
    segments,
    coverage_opportunities: coverageOpportunities,
    credit_program_tracking: {
      active_credits_estimate: activeCreditsEstimate,
      beneficiaries_estimate: beneficiariesEstimate,
      impact_index: impactIndex
    }
  });
});
