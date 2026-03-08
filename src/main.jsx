import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import 'leaflet/dist/leaflet.css'
import { Provider } from 'react-redux'
import { store } from './store/store'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
)
