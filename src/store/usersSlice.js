import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../api'

export const fetchUsersFull = createAsyncThunk('users/fetchUsersFull', async () => {
  const res = await api.fetchUsers()
  return res
})

export const createUser = createAsyncThunk('users/createUser', async payload => {
  const res = await api.createUser(payload)
  return res
})

export const updateUserById = createAsyncThunk('users/updateUserById', async ({ id, payload }) => {
  const res = await api.updateUser(id, payload)
  return res
})

export const deleteUserById = createAsyncThunk('users/deleteUserById', async id => {
  await api.deleteUser(id)
  return id
})

const usersSlice = createSlice({
  name: 'users',
  initialState: { users: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUsersFull.pending, state => { state.loading = true })
      .addCase(fetchUsersFull.fulfilled, (state, action) => { state.users = action.payload; state.loading = false })
      .addCase(fetchUsersFull.rejected, (state, action) => { state.loading = false; state.error = action.error.message })

      .addCase(createUser.fulfilled, (state, action) => { state.users.push(action.payload) })
      .addCase(updateUserById.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload.id)
        if (index !== -1) state.users[index] = action.payload
      })
      .addCase(deleteUserById.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload)
      })
  }
})

export default usersSlice.reducer
