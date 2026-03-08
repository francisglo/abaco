/**
 * ÁBACO - Sistema de Notificaciones
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = 'http://localhost:4000'

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (userId) => {
  const response = await fetch(`${API_URL}/notifications?userId=${userId}`)
  return response.json()
})

export const createNotification = createAsyncThunk('notifications/create', async (data) => {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
})

export const markAsRead = createAsyncThunk('notifications/markRead', async (id) => {
  const response = await fetch(`${API_URL}/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ read: true, readAt: new Date().toISOString() })
  })
  return response.json()
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false
  },
  reducers: {
    clearAll: (state) => {
      state.notifications = []
      state.unreadCount = 0
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload
        state.unreadCount = action.payload.filter(n => !n.read).length
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload)
        state.unreadCount += 1
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id)
        if (index !== -1) {
          state.notifications[index] = action.payload
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
  }
})

export const { clearAll } = notificationsSlice.actions
export default notificationsSlice.reducer
