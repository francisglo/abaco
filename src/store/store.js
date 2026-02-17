import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import zonesReducer from './zonesSlice'
import metricsReducer from './metricsSlice'
import geoReducer from './geoSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zonesReducer,
    metrics: metricsReducer,
    geo: geoReducer
  }
})

export default store
