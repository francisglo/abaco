import { describe, it, expect } from 'vitest'
import zonesReducer, { fetchZones, createZone, deleteZone } from '../zonesSlice'

describe('zonesSlice', () => {
  it('handles fetchZones.fulfilled', () => {
    const initial = { zones: [], loading: false, error: null }
    const payload = [{ id: 1, name: 'Zona A', priority: 1 }]
    const state = zonesReducer(initial, { type: fetchZones.fulfilled.type, payload })
    expect(state.zones).toHaveLength(1)
    expect(state.loading).toBe(false)
  })

  it('handles createZone.fulfilled and deleteZone.fulfilled', () => {
    const initial = { zones: [{ id: 1, name: 'Zona A', priority: 1 }], loading: false, error: null }
    const newZone = { id: 2, name: 'Zona B', priority: 2 }
    const afterCreate = zonesReducer(initial, { type: createZone.fulfilled.type, payload: newZone })
    expect(afterCreate.zones).toHaveLength(2)
    const afterDelete = zonesReducer(afterCreate, { type: deleteZone.fulfilled.type, payload: 1 })
    expect(afterDelete.zones).toHaveLength(1)
    expect(afterDelete.zones[0].id).toBe(2)
  })
})
