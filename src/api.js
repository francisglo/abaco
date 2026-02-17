const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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

export default {
  fetchZones,
  fetchGeoJSON
}
