import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MapView from './MapView'
import StatsCard from './StatsCard'
import AdvancedAnalytics from './AdvancedAnalytics'
import { fetchZones as fetchZonesThunk } from '../store/zonesSlice'
import { fetchGeoJSON as fetchGeoThunk } from '../store/geoSlice'
import { fetchUsers } from '../store/authSlice'
import { Box, Grid, Paper, Typography, Card, CardContent, Avatar, Chip, Tabs, Tab } from '@mui/material'
import { fetchLogs } from '../api'
import { MdPeople, MdCheckCircle, MdPending, MdTrendingUp, MdInsights } from 'react-icons/md'
import { HiLocationMarker } from 'react-icons/hi'

export default function Dashboard() {
  const dispatch = useDispatch()
  const { zones, loading: zonesLoading, error: zonesError } = useSelector(s => s.zones)
  const { geojson, loading: geoLoading, error: geoError } = useSelector(s => s.geo)
  const { user, users } = useSelector(s => s.auth)
  const { voters } = useSelector(s => s.voters)
  const [recentLogs, setRecentLogs] = useState([])
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    if (!zones || zones.length === 0) dispatch(fetchZonesThunk())
    if (!geojson) dispatch(fetchGeoThunk())
    if (!users || users.length === 0) dispatch(fetchUsers())
  }, [dispatch])

  useEffect(() => {
    fetchLogs().then(setRecentLogs).catch(() => {})
  }, [])

  const stats = [
    { 
      title: 'Total Contactos', 
      value: (voters || []).length,
      icon: <MdPeople size={32} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)'
    },
    { 
      title: 'Confirmados', 
      value: (voters || []).filter(v=>v.status==='confirmed').length,
      icon: <MdCheckCircle size={32} />,
      color: '#00b37e',
      bgColor: 'rgba(0, 179, 126, 0.1)'
    },
    { 
      title: 'Pendientes', 
      value: (voters || []).filter(v=>v.status==='pending').length,
      icon: <MdPending size={32} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    { 
      title: 'Engagement', 
      value: `${Math.round(((voters || []).filter(v=>v.status==='confirmed').length / ((voters || []).length || 1)) * 100)}%`,
      icon: <MdTrendingUp size={32} />,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
  ]

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1f2937',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <HiLocationMarker style={{ color: '#667eea' }} />
          Dashboard Territorial
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión y análisis de contactos en tiempo real
        </Typography>
        {user && (
          <Chip 
            label={`Rol: ${user.role}`} 
            size="small" 
            color="primary" 
            sx={{ mt: 1, fontWeight: 600 }}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: stat.bgColor, color: stat.color, width: 56, height: 56 }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 0,
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                }
              }}
            >
              <Tab label="Mapa Territorial" />
              <Tab label="Análisis Avanzado" icon={<MdInsights />} iconPosition="end" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1f2937' }}>
                    Mapa Territorial Interactivo
                  </Typography>
                  <MapView geojson={geojson} contacts={voters || []} />
                </Box>
              )}

              {tabValue === 1 && (
                <AdvancedAnalytics 
                  contacts={voters || []}
                  territories={zones || []}
                  operators={users || []}
                  interactions={recentLogs || []}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1f2937' }}>
              Interacciones Recientes
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 500, overflowY: 'auto' }}>
              {recentLogs.slice(0, 8).map(log => (
                <Card 
                  key={log.id} 
                  elevation={0}
                  sx={{ 
                    p: 1.5,
                    bgcolor: '#f8f9fa',
                    borderRadius: 1.5,
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label={log.result || log.contactType || 'contacto'} 
                      size="small" 
                      sx={{ 
                        height: 18, 
                        fontSize: '0.65rem',
                        bgcolor: log.result === 'confirmed' ? 'rgba(0, 179, 126, 0.15)' : 'rgba(102, 126, 234, 0.15)',
                        color: log.result === 'confirmed' ? '#00b37e' : '#667eea',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#4b5563' }}>
                    {log.note || 'Sin notas'}
                  </Typography>
                </Card>
              ))}
              {recentLogs.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay interacciones registradas
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
