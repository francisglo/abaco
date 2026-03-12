const STORAGE_KEY = 'abaco_urban_scenarios_v1'
const ACTIVE_KEY = 'abaco_urban_active_scenario_v1'

function readRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeRaw(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function saveUrbanScenario({ slot, territory, project, values, indices, recommendation, userRole }) {
  const normalizedSlot = String(slot || '').toUpperCase()
  if (!['A', 'B', 'C'].includes(normalizedSlot)) {
    throw new Error('Slot inválido. Usa A, B o C')
  }

  const raw = readRaw()
  raw[normalizedSlot] = {
    slot: normalizedSlot,
    territory: String(territory || 'Nacional'),
    project: String(project || 'General'),
    values: {
      urbanExpansion: Number(values?.urbanExpansion || 0),
      ecosystemProtection: Number(values?.ecosystemProtection || 0),
      housingDeficit: Number(values?.housingDeficit || 0)
    },
    indices: {
      pressureIndex: Number(indices?.pressureIndex || 0),
      sustainabilityIndex: Number(indices?.sustainabilityIndex || 0)
    },
    recommendation: String(recommendation || ''),
    userRole: String(userRole || 'visitor'),
    savedAt: new Date().toISOString()
  }

  writeRaw(raw)
  return raw[normalizedSlot]
}

export function getUrbanScenariosForContext(territory, project) {
  const raw = readRaw()
  const targetTerritory = String(territory || 'Nacional')
  const targetProject = String(project || 'General')
  return ['A', 'B', 'C']
    .map((slot) => raw[slot] || null)
    .filter(Boolean)
    .filter((item) => item.territory === targetTerritory && item.project === targetProject)
}

export function setActiveUrbanScenario({ slot, territory, project }) {
  const normalizedSlot = String(slot || '').toUpperCase()
  if (!['A', 'B', 'C'].includes(normalizedSlot)) return null
  const payload = {
    slot: normalizedSlot,
    territory: String(territory || 'Nacional'),
    project: String(project || 'General'),
    activatedAt: new Date().toISOString()
  }
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(payload))
  return payload
}

export function getActiveUrbanScenario(territory, project) {
  try {
    const active = JSON.parse(localStorage.getItem(ACTIVE_KEY) || '{}')
    if (!active?.slot) return null
    if (String(active.territory) !== String(territory || 'Nacional')) return null
    if (String(active.project) !== String(project || 'General')) return null

    const raw = readRaw()
    return raw[String(active.slot).toUpperCase()] || null
  } catch {
    return null
  }
}

export function clearActiveUrbanScenario() {
  localStorage.removeItem(ACTIVE_KEY)
}
