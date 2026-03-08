const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
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

export async function registerAuth(payload) {
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
}

export async function loginAuth(payload) {
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
}

export async function fetchAuthMe(token) {
  const res = await fetch(`${API_V1}/auth/me`, {
    headers: buildAuthHeaders(token)
  })

  const body = await parseJsonSafe(res)
  if (!res.ok) {
    throw new Error(extractErrorMessage(body, `Failed to fetch profile: ${res.status}`))
  }

  return body
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
  fetchStrategicDecisionEngine
}
