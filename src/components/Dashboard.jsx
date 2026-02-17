import React from 'react'

export default function Dashboard() {
  return (
    <section className="dashboard">
      <h2>Dashboard</h2>
      <p>Visualizaciones, mapas y métricas aparecerán aquí.</p>
      <div className="cards">
        <div className="card">Mapa (geo)</div>
        <div className="card">Indicadores</div>
        <div className="card">Acciones prioritarias</div>
      </div>
    </section>
  )
}
