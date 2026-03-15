import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchStudentProposals, createStudentProposal, voteStudentProposal } from '../api'

export const fetchProposals = createAsyncThunk('studentProposals/fetchProposals', async (token) => {
  const res = await fetchStudentProposals(token)
  return res.data || []
})

export const addProposal = createAsyncThunk('studentProposals/addProposal', async ({ payload, token }) => {
  const res = await createStudentProposal(payload, token)
  return res
})

export const voteProposal = createAsyncThunk('studentProposals/voteProposal', async ({ payload, token }) => {
  await voteStudentProposal(payload, token)
  return { proposalId: payload.proposalId, value: payload.value, userId: payload.userId }
})

const studentProposalsSlice = createSlice({
  name: 'studentProposals',
  initialState: { proposals: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProposals.pending, state => { state.loading = true })
      .addCase(fetchProposals.fulfilled, (state, action) => { state.proposals = action.payload; state.loading = false })
      .addCase(fetchProposals.rejected, (state, action) => { state.loading = false; state.error = action.error.message })
      .addCase(addProposal.fulfilled, (state, action) => { state.proposals.unshift(action.payload) })
      .addCase(voteProposal.fulfilled, (state, action) => {
        // Opcional: actualizar votos en el frontend si se requiere
      })
  }
})

export default studentProposalsSlice.reducer
