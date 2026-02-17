import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MapView from './MapView'
import StatsCard from './StatsCard'
import { fetchZones as fetchZonesThunk } from '../store/zonesSlice'
import { fetchGeoJSON as fetchGeoThunk } from '../store/geoSlice'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { zones, loading: zonesLoading, error: zonesError } = useSelector(s => s.zones)
  const { geojson, loading: geoLoading, error: geoError } = useSelector(s => s.geo)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    if (!zones || zones.length === 0) dispatch(fetchZonesThunk())
    if (!geojson) dispatch(fetchGeoThunk())
  }, [dispatch])

  return (
    <section className="dashboard">
      <h2>Dashboard</h2>
      <p>Visualizaciones, mapas y métricas aparecerán aquí.</p>

      {/* Role-based info */}
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      {user && <p>Rol activo: <strong>{user.role}</strong></p>}

      <div className="cards">
        <div className="card">
          <h3>Zonas</h3>
          {zonesLoading && <p>Cargando zonas...</p>}
          {zonesError && <p style={{ color: 'red' }}>Error: {zonesError}</p>}
          {!zonesLoading && !zonesError && (
            <ul>
              {(!zones || zones.length === 0) && <li>No hay zonas definidas.</li>}
              {zones && zones.map(z => (
                <li key={z.id}>{z.name} (prioridad: {z.priority ?? '—'})</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <StatsCard />
        </div>

        <div className="card">Acciones prioritarias</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>Mapa territorial</h3>
        {geoLoading && <p>Cargando mapa...</p>}
        {geoError && <p style={{ color: 'red' }}>Error: {geoError}</p>}
        {!geoLoading && geojson && <MapView geojson={geojson} />}
      </div>
      {user && user.role === 'admin' && (
        <div style={{ marginTop: 16 }} className="card">
          <h3>Panel administrador</h3>
          <p>Acciones sensibles y controles administrativos visibles solo para administradores.</p>
        </div>
      )}
    </section>
  )
}
