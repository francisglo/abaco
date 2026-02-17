import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import 'leaflet/dist/leaflet.css'
import { Provider } from 'react-redux'
import { store } from './store/store'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
