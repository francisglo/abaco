import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import ZonesPage from './pages/ZonesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>ABACO</h1>
              <p>Plataforma de inteligencia electoral y territorial</p>
              <nav style={{ marginTop: 8 }}>
                <Link to="/" style={{ marginRight: 12, color: '#fff' }}>Dashboard</Link>
                <Link to="/zones" style={{ marginRight: 12, color: '#fff' }}>Zonas</Link>
              </nav>
            </div>
            <div>
              <Login />
            </div>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/zones" element={<ZonesPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
