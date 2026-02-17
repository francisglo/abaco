import React from 'react'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ABACO</h1>
        <p>Plataforma de inteligencia electoral y territorial</p>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  )
}
