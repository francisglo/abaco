import React from 'react'
import Dashboard from './components/Dashboard'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>ABACO</h1>
            <p>Plataforma de inteligencia electoral y territorial</p>
          </div>
          <div>
            <Login />
          </div>
        </header>
        <main>
          <Dashboard />
        </main>
      </div>
    </AuthProvider>
  )
}
