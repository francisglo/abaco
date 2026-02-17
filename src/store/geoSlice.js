import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchGeoJSON as apiFetchGeo } from '../api'

export const fetchGeoJSON = createAsyncThunk('geo/fetchGeoJSON', async () => {
  const res = await apiFetchGeo()
  return res
})

const geoSlice = createSlice({
  name: 'geo',
  initialState: { geojson: null, loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchGeoJSON.pending, state => { state.loading = true })
      .addCase(fetchGeoJSON.fulfilled, (state, action) => { state.geojson = action.payload; state.loading = false })
      .addCase(fetchGeoJSON.rejected, (state, action) => { state.loading = false; state.error = action.error.message })
  }
})

export default geoSlice.reducer
