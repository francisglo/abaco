import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import zonesReducer from './zonesSlice'
import metricsReducer from './metricsSlice'
import geoReducer from './geoSlice'
import votersReducer from './votersSlice'
import usersReducer from './usersSlice'
import tasksReducer from './tasksSlice'
import notificationsReducer from './notificationsSlice'
import studentProposalsReducer from './studentProposalsSlice'
import groupsReducer from './groupsSlice'
import groupChatReducer from './groupChatSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zonesReducer,
    metrics: metricsReducer,
    geo: geoReducer,
    voters: votersReducer,
    users: usersReducer,
    tasks: tasksReducer,
    notifications: notificationsReducer,
    studentProposals: studentProposalsReducer,
    groups: groupsReducer,
    groupChat: groupChatReducer
  }
})

export default store
