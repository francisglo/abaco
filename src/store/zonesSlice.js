import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../api'

export const fetchZones = createAsyncThunk('zones/fetchZones', async () => {
  const res = await api.fetchZones()
  return res
})

export const createZone = createAsyncThunk('zones/createZone', async payload => {
  const res = await api.createZone(payload)
  return res
})

export const updateZone = createAsyncThunk('zones/updateZone', async ({ id, payload }) => {
  const res = await api.updateZone(id, payload)
  return res
})

export const deleteZone = createAsyncThunk('zones/deleteZone', async id => {
  await api.deleteZone(id)
  return id
})

const zonesSlice = createSlice({
  name: 'zones',
  initialState: { zones: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchZones.pending, state => { state.loading = true })
      .addCase(fetchZones.fulfilled, (state, action) => { state.zones = action.payload; state.loading = false })
      .addCase(fetchZones.rejected, (state, action) => { state.loading = false; state.error = action.error.message })

      .addCase(createZone.fulfilled, (state, action) => { state.zones.push(action.payload) })

      .addCase(updateZone.fulfilled, (state, action) => {
        const idx = state.zones.findIndex(z => z.id === action.payload.id)
        if (idx !== -1) state.zones[idx] = action.payload
      })

      .addCase(deleteZone.fulfilled, (state, action) => {
        state.zones = state.zones.filter(z => z.id !== action.payload)
      })
  }
})

export default zonesSlice.reducer
