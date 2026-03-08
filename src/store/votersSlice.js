import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../api'

export const fetchVoters = createAsyncThunk('voters/fetchVoters', async () => {
  const res = await api.fetchVoters()
  return res
})

export const createVoter = createAsyncThunk('voters/createVoter', async payload => {
  const res = await api.createVoter(payload)
  return res
})

export const updateVoter = createAsyncThunk('voters/updateVoter', async ({ id, payload }) => {
  const res = await api.updateVoter(id, payload)
  return res
})

const votersSlice = createSlice({
  name: 'voters',
  initialState: { voters: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchVoters.pending, state => { state.loading = true })
      .addCase(fetchVoters.fulfilled, (state, action) => { state.voters = action.payload; state.loading = false })
      .addCase(fetchVoters.rejected, (state, action) => { state.loading = false; state.error = action.error.message })

      .addCase(createVoter.fulfilled, (state, action) => { state.voters.push(action.payload) })

      .addCase(updateVoter.fulfilled, (state, action) => {
        const idx = state.voters.findIndex(v => v.id === action.payload.id)
        if (idx !== -1) state.voters[idx] = action.payload
      })
  }
})

export default votersSlice.reducer
