const normalizedApiBase = String(process.env.VITE_API_URL || '').trim().replace(/\/$/, '')
const API_BASE = normalizedApiBase || 'http://localhost:4000'
const API_V1 = `${API_BASE}/api/v1`

function buildAuthHeaders(token, extraHeaders = {}) {
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function parseJsonSafe(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractErrorMessage(body, fallback) {
  if (body && typeof body.message === 'string') return body.message
  return fallback
}

function extractNetworkError(error, fallback = 'No se pudo conectar con el servidor') {
  if (!error) return fallback
  const raw = String(error.message || error)
  const normalized = raw.toLowerCase()
  if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
    return `${fallback}. Verifica la configuración de API y CORS.`
  }
  return raw
}

export async function registerAuth(payload) {
  try {
    const res = await fetch(`${API_V1}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const body = await parseJsonSafe(res)
    if (!res.ok) {
      throw new Error(extractErrorMessage(body, `Failed to register: ${res.status}`))
    }

    return body
  } catch (error) {
    throw new Error(extractNetworkError(error))
  }
}

export async function loginAuth(payload) {
  try {
    const res = await fetch(`${API_V1}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const body = await parseJsonSafe(res)
    if (!res.ok) {
      throw new Error(extractErrorMessage(body, `Failed to login: ${res.status}`))
    }

    return body
  } catch (error) {
    throw new Error(extractNetworkError(error))
  }
}

export async function googleAuthLogin(payload) {
  try {
    const res = await fetch(`${API_V1}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const body = await parseJsonSafe(res)
    if (!res.ok) {
      throw new Error(extractErrorMessage(body, `Failed to login with Google: ${res.status}`))
    }

    return body
  } catch (error) {
    throw new Error(extractNetworkError(error))
  }
}

export async function fetchAuthMe(token) {
  try {
    const res = await fetch(`${API_V1}/auth/me`, {
      headers: buildAuthHeaders(token)
    })

    const body = await parseJsonSafe(res)
    if (!res.ok) {
      throw new Error(extractErrorMessage(body, `Failed to fetch profile: ${res.status}`))
    }

    return body
  } catch (error) {
    throw new Error(extractNetworkError(error, 'No se pudo validar la sesión'))
  }
}

export async function updateAuthMe(token, payload) {
  const res = await fetch(`${API_V1}/auth/me`, {
    method: 'PATCH',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to update profile: ${res.status}`))
  }

  return body
}

export async function deleteAuthMe(token, payload) {
  const res = await fetch(`${API_V1}/auth/me`, {
    method: 'DELETE',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  if (res.status === 204) return true

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to delete account: ${res.status}`))
  }

  return true
}

export async function fetchZonesSecure(token, params = {}) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 200),
    sortBy: params.sortBy || 'priority',
    order: params.order || 'ASC'
  }).toString()

  const res = await fetch(`${API_V1}/zones?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch secure zones: ${res.status}`))
  }

  return body
}

export async function fetchGeoFeatures(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 1000),
    ...(params.zone_id ? { zone_id: String(params.zone_id) } : {}),
    ...(params.types ? { types: String(params.types) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/geo/features?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch geo features: ${res.status}`))
  }

  return body
}

export async function fetchGeoNearby(token, params = {}) {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius_meters: String(params.radius_meters || 2000),
    limit: String(params.limit || 300),
    ...(params.types ? { types: String(params.types) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/geo/nearby?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch nearby geo features: ${res.status}`))
  }

  return body
}

export async function fetchGeoSyncStatus(token) {
  const res = await fetch(`${API_V1}/geo/sync-status`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch geo sync status: ${res.status}`))
  }

  return body
}

export async function fetchGeo3DModel(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 1000),
    ...(params.zone_id ? { zone_id: String(params.zone_id) } : {}),
    ...(params.types ? { types: String(params.types) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/geo/export/3d/model.gltf?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch 3D model: ${res.status}`))
  }

  return body
}

export async function fetchGeo3DTileset(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 1000),
    ...(params.zone_id ? { zone_id: String(params.zone_id) } : {}),
    ...(params.types ? { types: String(params.types) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/geo/export/3d/tileset.json?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch 3D tileset: ${res.status}`))
  }

  return body
}

export async function fetchStrategicDecisionEngine(token, params = {}) {
  const query = new URLSearchParams({
    horizon_days: String(params.horizon_days || 45),
    limit: String(params.limit || 6),
    ...(params.zone_id ? { zone_id: String(params.zone_id) } : {}),
    ...(params.role ? { role: String(params.role) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/geo-analytics/decision-engine?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch strategic decision engine: ${res.status}`))
  }

  return body
}

export async function fetchFinancialIntelligenceSummary(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 6),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(params.sector && params.sector !== 'all' ? { sector: String(params.sector) } : {}),
    ...(params.min_credit_potential !== undefined && params.min_credit_potential !== null && params.min_credit_potential !== ''
      ? { min_credit_potential: String(params.min_credit_potential) }
      : {}),
    ...(params.max_risk_score !== undefined && params.max_risk_score !== null && params.max_risk_score !== ''
      ? { max_risk_score: String(params.max_risk_score) }
      : {})
  }).toString()

  const res = await fetch(`${API_V1}/financial-intelligence/summary?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch financial intelligence summary: ${res.status}`))
  }

  return body
}

export async function fetchDemographicSocialSummary(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 8),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/demographic-social/summary?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch demographic social summary: ${res.status}`))
  }

  return body
}

export async function fetchOperationalZonePrioritization(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 10),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(params.padron !== undefined ? { padron: String(params.padron) } : {}),
    ...(params.participacion !== undefined ? { participacion: String(params.participacion) } : {}),
    ...(params.solicitudes !== undefined ? { solicitudes: String(params.solicitudes) } : {}),
    ...(params.riesgo !== undefined ? { riesgo: String(params.riesgo) } : {}),
    ...(params.cobertura !== undefined ? { cobertura: String(params.cobertura) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/zone-prioritization?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch operational zone prioritization: ${res.status}`))
  }

  return body
}

export async function fetchOperationalBrigadeAssignment(token, payload = {}) {
  const res = await fetch(`${API_V1}/operational-algorithms/brigade-assignment`, {
    method: 'POST',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch brigade assignment plan: ${res.status}`))
  }

  return body
}

export async function fetchOperationalTerritorialRouting(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 40),
    speed_kmh: String(params.speed_kmh || 30),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(params.brigade_id ? { brigade_id: String(params.brigade_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/territorial-routing?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch territorial routing plan: ${res.status}`))
  }

  return body
}

export async function fetchOperationalSemaphoreAlerts(token, params = {}) {
  const query = new URLSearchParams({
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(params.red_threshold !== undefined ? { red_threshold: String(params.red_threshold) } : {}),
    ...(params.yellow_threshold !== undefined ? { yellow_threshold: String(params.yellow_threshold) } : {})
  }).toString()

  const suffix = query ? `?${query}` : ''
  const res = await fetch(`${API_V1}/operational-algorithms/semaphore-alerts${suffix}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch semaphore alerts: ${res.status}`))
  }

  return body
}

export async function fetchOperationalLoadBalance(token, params = {}) {
  const query = new URLSearchParams({
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(params.capacity !== undefined ? { capacity: String(params.capacity) } : {}),
    ...(params.apply !== undefined ? { apply: String(params.apply) } : {})
  }).toString()

  const suffix = query ? `?${query}` : ''
  const res = await fetch(`${API_V1}/operational-algorithms/load-balance${suffix}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch operational load balance: ${res.status}`))
  }

  return body
}

export async function fetchOperationalRulesCatalog(token) {
  const res = await fetch(`${API_V1}/operational-algorithms/rules-engine/catalog`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch operational rules catalog: ${res.status}`))
  }

  return body
}

export async function evaluateOperationalRules(token, payload = {}) {
  const res = await fetch(`${API_V1}/operational-algorithms/rules-engine/evaluate`, {
    method: 'POST',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to evaluate operational rules: ${res.status}`))
  }

  return body
}

export async function fetchOperationalAdvancedCatalog(token) {
  const query = new URLSearchParams({
    include_experimental: 'true'
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/advanced-suite/catalog?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch advanced algorithms catalog: ${res.status}`))
  }

  return body
}

export async function runOperationalAdvancedSuite(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 10),
    auto: String(params.auto ?? true),
    include_experimental: String(params.include_experimental ?? true),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(Array.isArray(params.algorithms) && params.algorithms.length > 0
      ? { algorithms: params.algorithms.join(',') }
      : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/advanced-suite/run?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to run advanced algorithms suite: ${res.status}`))
  }

  return body
}

export async function fetchOperationalPredictiveCatalog(token) {
  const res = await fetch(`${API_V1}/operational-algorithms/predictive-models/catalog`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch predictive models catalog: ${res.status}`))
  }

  return body
}

export async function runOperationalPredictiveSuite(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 10),
    horizon_days: String(params.horizon_days || 30),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {}),
    ...(Array.isArray(params.models) && params.models.length > 0
      ? { models: params.models.join(',') }
      : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/predictive-models/run?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to run predictive models suite: ${res.status}`))
  }

  return body
}

export async function fetchOperationalOptimizationCatalog(token) {
  const res = await fetch(`${API_V1}/operational-algorithms/optimization-models/catalog`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch optimization models catalog: ${res.status}`))
  }

  return body
}

export async function runOperationalOptimizationSuite(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 10),
    brigades: String(params.brigades || 12),
    max_interventions: String(params.max_interventions || 6),
    budget: String(params.budget || 120000),
    speed_kmh: String(params.speed_kmh || 28),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/optimization-models/run?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to run optimization models suite: ${res.status}`))
  }

  return body
}

export async function runOperationalWhatIfSimulation(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 10),
    horizon_days: String(params.horizon_days || 45),
    budget: String(params.budget || 120000),
    brigades: String(params.brigades || 12),
    expected_turnout_delta: String(params.expected_turnout_delta || 0),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/what-if/simulate?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to run what-if simulation: ${res.status}`))
  }

  return body
}

export async function fetchOperationalActionCenter(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 10),
    horizon_days: String(params.horizon_days || 45),
    budget: String(params.budget || 120000),
    brigades: String(params.brigades || 12),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/action-center/recommendations?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch action center recommendations: ${res.status}`))
  }

  return body
}

export async function fetchOperationalEarlyAlerts(token, params = {}) {
  const query = new URLSearchParams({
    risk_threshold: String(params.risk_threshold || 70),
    coverage_threshold: String(params.coverage_threshold || 60),
    horizon_days: String(params.horizon_days || 45),
    budget: String(params.budget || 120000),
    brigades: String(params.brigades || 12),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/early-alerts?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch early alerts: ${res.status}`))
  }

  return body
}

export async function notifyOperationalEarlyAlerts(token, payload = {}) {
  const res = await fetch(`${API_V1}/operational-algorithms/early-alerts/notify`, {
    method: 'POST',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to notify early alerts: ${res.status}`))
  }

  return body
}

export async function fetchOperationalEarlyAlertsNotifierStatus(token) {
  const res = await fetch(`${API_V1}/operational-algorithms/early-alerts/notify/status`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch early alerts notifier status: ${res.status}`))
  }

  return body
}

export async function fetchOperationalDecisionLog(token, params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit || 30),
    ...(params.status ? { status: String(params.status) } : {}),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/decision-log?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch decision log: ${res.status}`))
  }

  return body
}

export async function createOperationalDecisionLogEntry(token, payload = {}) {
  const res = await fetch(`${API_V1}/operational-algorithms/decision-log`, {
    method: 'POST',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to create decision log entry: ${res.status}`))
  }

  return body
}

export async function updateOperationalDecisionLogEntry(token, id, payload = {}) {
  const res = await fetch(`${API_V1}/operational-algorithms/decision-log/${id}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to update decision log entry: ${res.status}`))
  }

  return body
}

export async function fetchOperationalTemporalComparison(token, params = {}) {
  const query = new URLSearchParams({
    period: String(params.period || 'weekly'),
    buckets: String(params.buckets || 8),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/temporal-comparison?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch temporal comparison: ${res.status}`))
  }

  return body
}

export async function fetchOperationalDailyBoard(token, params = {}) {
  const query = new URLSearchParams({
    budget: String(params.budget || 120000),
    brigades: String(params.brigades || 12),
    speed_kmh: String(params.speed_kmh || 28),
    ...(params.zone_id && params.zone_id !== 'all' ? { zone_id: String(params.zone_id) } : {})
  }).toString()

  const res = await fetch(`${API_V1}/operational-algorithms/daily-operations/board?${query}`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch daily operations board: ${res.status}`))
  }

  return body
}

export async function fetchOperationalDataQualityReport(token) {
  const res = await fetch(`${API_V1}/operational-algorithms/data-quality/report`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch operational data quality report: ${res.status}`))
  }

  return body
}

export async function resolveZoneIdByTerritory(token, territory) {
  const normalizedTerritory = String(territory || '').trim()
  if (!normalizedTerritory || normalizedTerritory.toLowerCase() === 'nacional') return null

  try {
    const response = await fetchZonesSecure(token, { page: 1, limit: 500, sortBy: 'name', order: 'ASC' })
    const rows = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.zones)
        ? response.zones
        : []

    const normalizedTarget = normalizedTerritory.toLowerCase()
    const exact = rows.find((row) => {
      const name = String(row?.name || row?.zone_name || row?.nombre || '').trim().toLowerCase()
      return name === normalizedTarget
    })

    if (exact) return Number(exact?.id || exact?.zone_id || 0) || null

    const partial = rows.find((row) => {
      const name = String(row?.name || row?.zone_name || row?.nombre || '').trim().toLowerCase()
      return name.includes(normalizedTarget)
    })

    return Number(partial?.id || partial?.zone_id || 0) || null
  } catch {
    return null
  }
}

export async function fetchIntegratedVerticalsBI(token, context = {}) {
  const territory = String(context?.territory || '').trim()
  const territoryFilterMode = String(context?.territoryFilterMode || context?.mode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto'
  const resolvedZoneId = territoryFilterMode === 'auto'
    ? await resolveZoneIdByTerritory(token, territory)
    : null

  const [decisionResult, financialResult, geoResult, demographicResult] = await Promise.allSettled([
    fetchStrategicDecisionEngine(token, {
      horizon_days: 60,
      limit: 8,
      role: 'manager',
      ...(resolvedZoneId ? { zone_id: resolvedZoneId } : {})
    }),
    fetchFinancialIntelligenceSummary(token, {
      limit: 8,
      ...(resolvedZoneId ? { zone_id: resolvedZoneId } : {})
    }),
    fetchGeoSyncStatus(token),
    fetchDemographicSocialSummary(token, {
      limit: 8,
      ...(resolvedZoneId ? { zone_id: resolvedZoneId } : {})
    })
  ])

  const decisionData = decisionResult.status === 'fulfilled' ? decisionResult.value : null
  const financialData = financialResult.status === 'fulfilled' ? financialResult.value : null
  const geoData = geoResult.status === 'fulfilled' ? geoResult.value : null
  const demographicData = demographicResult.status === 'fulfilled' ? demographicResult.value : null

  const scenarios = Array.isArray(decisionData?.scenarios) ? decisionData.scenarios : []
  const avgDecisionScore = scenarios.length
    ? Math.round(scenarios.reduce((acc, item) => acc + Number(item?.decision_score || 0), 0) / scenarios.length)
    : 0

  const iadtScore = Math.round(Number(financialData?.iadt?.score || 0))
  const financialZones = Number(financialData?.summary?.total_zones || 0)
  const coveragePercent = Math.round(Number(geoData?.summary?.coverage_percent || 0))
  const demographicVulnerability = Math.round(Number(demographicData?.summary?.average_vulnerability_index || 0))
  const demographicDemand = Math.round(Number(demographicData?.summary?.average_service_demand_index || 0))

  const availabilityScore = [decisionData, financialData, geoData, demographicData].filter(Boolean).length / 4
  const governanceIndex = Math.round((avgDecisionScore * 0.3) + (iadtScore * 0.3) + (coveragePercent * 0.2) + ((100 - demographicVulnerability) * 0.2))
  const orchestrationScore = Math.round((governanceIndex * 0.8) + (availabilityScore * 100 * 0.2))

  return {
    score: orchestrationScore,
    governance_index: governanceIndex,
    context: {
      territory: territory || 'Nacional',
      territory_filter_mode: territoryFilterMode,
      zone_id: resolvedZoneId,
      scoped: Boolean(resolvedZoneId)
    },
    signals: {
      scenarios_count: scenarios.length,
      avg_decision_score: avgDecisionScore,
      financial_iadt_score: iadtScore,
      financial_zones: financialZones,
      geo_coverage_percent: coveragePercent,
      demographic_vulnerability_index: demographicVulnerability,
      demographic_service_demand_index: demographicDemand,
      demographic_territories_analyzed: Number(demographicData?.summary?.territories_analyzed || 0)
    },
    modules: {
      decision_engine: {
        available: Boolean(decisionData),
        scenarios: scenarios.length,
        role_label: decisionData?.role_context?.label || null
      },
      financial_intelligence: {
        available: Boolean(financialData),
        zones: financialZones,
        iadt_score: iadtScore
      },
      geo_sync: {
        available: Boolean(geoData),
        coverage_percent: coveragePercent,
        synced_at: geoData?.summary?.synced_at || null
      },
      demographic_social: {
        available: Boolean(demographicData),
        vulnerability_index: demographicVulnerability,
        service_demand_index: demographicDemand,
        territories_analyzed: Number(demographicData?.summary?.territories_analyzed || 0)
      }
    },
    errors: {
      decision_engine: decisionResult.status === 'rejected' ? String(decisionResult.reason?.message || decisionResult.reason || 'Error') : null,
      financial_intelligence: financialResult.status === 'rejected' ? String(financialResult.reason?.message || financialResult.reason || 'Error') : null,
      geo_sync: geoResult.status === 'rejected' ? String(geoResult.reason?.message || geoResult.reason || 'Error') : null,
      demographic_social: demographicResult.status === 'rejected' ? String(demographicResult.reason?.message || demographicResult.reason || 'Error') : null
    }
  }
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/zones`)
  if (!res.ok) throw new Error(`Failed to fetch zones: ${res.status}`)
  return res.json()
}

export async function fetchGeoJSON() {
  const res = await fetch(`${API_BASE}/geojson_features`)
  if (!res.ok) throw new Error(`Failed to fetch geojson: ${res.status}`)
  return res.json()
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`)
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`)
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.status}`)
  return res.json()
}

export async function createZone(payload) {
  const res = await fetch(`${API_BASE}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed to create zone: ${res.status}`)
  return res.json()
}

export async function updateZone(id, payload) {
  const res = await fetch(`${API_BASE}/zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed to update zone: ${res.status}`)
  return res.json()
}

export async function deleteZone(id) {
  const res = await fetch(`${API_BASE}/zones/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete zone: ${res.status}`)
  return res.ok
}

export async function fetchVoters() {
  const res = await fetch(`${API_BASE}/voters`)
  if (!res.ok) throw new Error(`Failed to fetch voters: ${res.status}`)
  return res.json()
}

export async function createVoter(payload) {
  const res = await fetch(`${API_BASE}/voters`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed to create voter: ${res.status}`)
  return res.json()
}

export async function updateVoter(id, payload) {
  const res = await fetch(`${API_BASE}/voters/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed to update voter: ${res.status}`)
  return res.json()
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/logs?_sort=timestamp&_order=desc`)
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`)
  return res.json()
}

export async function createLog(payload) {
  const res = await fetch(`${API_BASE}/logs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`Failed to create log: ${res.status}`)
  return res.json()
}

export async function fetchUserById(id) {
  const res = await fetch(`${API_BASE}/users/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`)
  return res.json()
}

export async function createUser(payload) {
  const res = await fetch(`${API_BASE}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`)
  return res.json()
}

export async function updateUser(id, payload) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed to update user: ${res.status}`)
  return res.json()
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`)
  return id
}

export default {
  fetchZones,
  fetchGeoJSON,
  registerAuth,
  loginAuth,
  fetchAuthMe,
  updateAuthMe,
  deleteAuthMe,
  fetchZonesSecure,
  fetchGeoFeatures,
  fetchGeoNearby,
  fetchGeoSyncStatus,
  fetchGeo3DModel,
  fetchGeo3DTileset,
  fetchStrategicDecisionEngine
}
