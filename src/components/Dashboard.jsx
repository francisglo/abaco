import React, { useEffect, useState } from 'react'
import { fetchZones, fetchGeoJSON } from '../api'
import MapView from './MapView'

export default function Dashboard() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [geojson, setGeojson] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchZones()
      .then(data => {
        if (!mounted) return
        setZones(data)
        setLoading(false)
      })
      .catch(err => {
        if (!mounted) return
        setError(err.message)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    setGeoLoading(true)
    fetchGeoJSON()
      .then(data => {
        if (!mounted) return
        setGeojson(data)
        setGeoLoading(false)
      })
      .catch(err => {
        if (!mounted) return
        setGeoError(err.message)
        setGeoLoading(false)
      })
    return () => { mounted = false }
  }, [])

  return (
    <section className="dashboard">
      <h2>Dashboard</h2>
      <p>Visualizaciones, mapas y métricas aparecerán aquí.</p>

      <div className="cards">
        <div className="card">
          <h3>Zonas</h3>
          {loading && <p>Cargando zonas...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {!loading && !error && (
            <ul>
              {zones.length === 0 && <li>No hay zonas definidas.</li>}
              {zones.map(z => (
                <li key={z.id}>{z.name} (prioridad: {z.priority ?? '—'})</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">Indicadores</div>
        <div className="card">Acciones prioritarias</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>Mapa territorial</h3>
        {geoLoading && <p>Cargando mapa...</p>}
        {geoError && <p style={{ color: 'red' }}>Error: {geoError}</p>}
        {!geoLoading && geojson && <MapView geojson={geojson} />}
      </div>
    </section>
  )
}
