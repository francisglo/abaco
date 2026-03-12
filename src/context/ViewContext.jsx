import React, { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'abaco_view_context'

const defaultContext = {
  territory: 'Nacional',
  project: 'General',
  territoryFilterMode: 'auto'
}

function readInitialContext() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      territory: typeof parsed.territory === 'string' && parsed.territory.trim() ? parsed.territory : defaultContext.territory,
      project: typeof parsed.project === 'string' && parsed.project.trim() ? parsed.project : defaultContext.project,
      territoryFilterMode: parsed.territoryFilterMode === 'manual' ? 'manual' : 'auto'
    }
  } catch {
    return defaultContext
  }
}

const ViewContext = createContext({
  territory: defaultContext.territory,
  project: defaultContext.project,
  territoryFilterMode: defaultContext.territoryFilterMode,
  setTerritory: () => {},
  setProject: () => {},
  setTerritoryFilterMode: () => {},
  resetContext: () => {}
})

export function ViewProvider({ children }) {
  const [state, setState] = useState(() => readInitialContext())

  const persist = (next) => {
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const value = useMemo(() => ({
    territory: state.territory,
    project: state.project,
    territoryFilterMode: state.territoryFilterMode,
    setTerritory: (territory) => persist({ ...state, territory: String(territory || defaultContext.territory) }),
    setProject: (project) => persist({ ...state, project: String(project || defaultContext.project) }),
    setTerritoryFilterMode: (territoryFilterMode) => persist({ ...state, territoryFilterMode: territoryFilterMode === 'manual' ? 'manual' : 'auto' }),
    resetContext: () => persist(defaultContext)
  }), [state])

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  )
}

export function useViewContext() {
  return useContext(ViewContext)
}

export const VIEW_TERRITORIES = ['Nacional', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla']
export const VIEW_PROJECTS = ['General', 'Desarrollo Económico', 'Inversión Pública', 'Inclusión Financiera', 'Cooperación', 'Sostenibilidad', 'Ordenamiento Territorial y Planeación Urbana']
export const VIEW_TERRITORY_FILTER_MODES = [
  { value: 'auto', label: 'Auto zona' },
  { value: 'manual', label: 'Manual zona' }
]
