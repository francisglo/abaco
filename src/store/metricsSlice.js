import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchMetrics as apiFetchMetrics } from '../api'

export const fetchMetrics = createAsyncThunk('metrics/fetchMetrics', async () => {
  const res = await apiFetchMetrics()
  return res
})

const metricsSlice = createSlice({
  name: 'metrics',
  initialState: { metrics: null, loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchMetrics.pending, state => { state.loading = true })
      .addCase(fetchMetrics.fulfilled, (state, action) => { state.metrics = action.payload; state.loading = false })
      .addCase(fetchMetrics.rejected, (state, action) => { state.loading = false; state.error = action.error.message })
  }
})

export default metricsSlice.reducer
