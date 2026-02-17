import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MapView from './MapView'
import StatsCard from './StatsCard'
import { fetchZones as fetchZonesThunk } from '../store/zonesSlice'
import { fetchGeoJSON as fetchGeoThunk } from '../store/geoSlice'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { fetchLogs } from '../api'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { zones, loading: zonesLoading, error: zonesError } = useSelector(s => s.zones)
  const { geojson, loading: geoLoading, error: geoError } = useSelector(s => s.geo)
  const { user } = useSelector(s => s.auth)
  const { voters } = useSelector(s => s.voters)
  const [recentLogs, setRecentLogs] = useState([])

  useEffect(() => {
    if (!zones || zones.length === 0) dispatch(fetchZonesThunk())
    if (!geojson) dispatch(fetchGeoThunk())
  }, [dispatch])

  useEffect(() => {
    fetchLogs().then(setRecentLogs).catch(() => {})
  }, [])

  return (
    <section className="dashboard">
      <h2>Dashboard</h2>
      <p>Visualizaciones, mapas y métricas aparecerán aquí.</p>

      {/* Role-based info */}
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      {user && <p>Rol activo: <strong>{user.role}</strong></p>}

      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2">Total Votantes</Typography>
                  <Typography variant="h5">{(voters || []).length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2">Confirmados</Typography>
                  <Typography variant="h5">{(voters || []).filter(v=>v.status==='confirmed').length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2">Pendientes</Typography>
                  <Typography variant="h5">{(voters || []).filter(v=>v.status==='pending').length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2">Activos</Typography>
                  <Typography variant="h5">{(voters || []).filter(v=>v.active || false).length}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Contactos recientes</Typography>
                  <ul>
                    {recentLogs.slice(0,6).map(r=> (
                      <li key={r.id}>{new Date(r.timestamp).toLocaleString()} — Votante {r.voterId} — {r.note}</li>
                    ))}
                  </ul>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Mapa territorial</Typography>
              {geoLoading && <p>Cargando mapa...</p>}
              {geoError && <p style={{ color: 'red' }}>Error: {geoError}</p>}
              {!geoLoading && geojson && <Box sx={{ height: 300 }}><MapView geojson={geojson} /></Box>}
            </Paper>
          </Grid>
        </Grid>
      </Box>
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
