import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import zonesReducer from './zonesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    zones: zonesReducer
  }
})

export default store
