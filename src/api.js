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

export default {
  fetchZones,
  fetchGeoJSON
}
