import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchUsers as apiFetchUsers } from '../api'

export const fetchUsers = createAsyncThunk('auth/fetchUsers', async () => {
  const res = await apiFetchUsers()
  return res
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { users: [], user: null, loading: false },
  reducers: {
    login(state, action) {
      const id = Number(action.payload)
      const u = state.users.find(x => x.id === id)
      if (u) state.user = u
    },
    logout(state) {
      state.user = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, state => { state.loading = true })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.users = action.payload; state.loading = false })
      .addCase(fetchUsers.rejected, state => { state.loading = false })
  }
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
