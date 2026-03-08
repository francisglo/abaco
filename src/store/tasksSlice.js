/**
 * ÁBACO - Sistema de Tareas y Calendario
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = 'http://localhost:4000'

// Thunks
export const fetchTasks = createAsyncThunk('tasks/fetchAll', async () => {
  const response = await fetch(`${API_URL}/tasks`)
  return response.json()
})

export const createTask = createAsyncThunk('tasks/create', async (taskData) => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  })
  return response.json()
})

export const updateTask = createAsyncThunk('tasks/update', async ({ id, updates }) => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  return response.json()
})

export const deleteTask = createAsyncThunk('tasks/delete', async (id) => {
  await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' })
  return id
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload)
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload)
      })
  }
})

export default tasksSlice.reducer
