import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography, Slider, LinearProgress, Skeleton } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { MdCompareArrows, MdInsights, MdWarningAmber } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { fetchStrategicDecisionEngine } from '../api'

const CAPABILITIES = [
  { label: 'Análisis comparativo entre zonas', icon: <MdCompareArrows size={18} /> },
  { label: 'Tendencias territoriales', icon: <MdInsights size={18} /> },
  { label: 'Identificación de riesgos político', icon: <MdWarningAmber size={18} /> }
]

export default function StrategicIntelligencePage() {
  const theme = useTheme()
  const { token, user } = useAuth()
  const [horizonDays, setHorizonDays] = useState(45)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [engine, setEngine] = useState(null)

  useEffect(() => {
    if (!token) return

    let active = true
    setLoading(true)
    setError('')

    fetchStrategicDecisionEngine(token, {
      horizon_days: horizonDays,
      limit: 6,
      role: user?.role
    })
      .then((data) => {
        if (!active) return
        setEngine(data)
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'No fue posible cargar escenarios estratégicos')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token, horizonDays, user?.role])

  const topScenario = useMemo(() => {
    const scenarios = Array.isArray(engine?.scenarios) ? engine.scenarios : []
    return scenarios.length ? scenarios[0] : null
  }, [engine])

  return (
    <Box>
      <Card
        sx={{
          mb: 2,
          background: `linear-gradient(130deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.secondary.main} 100%)`,
          color: 'white'
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={800}>Módulo de Inteligencia Estratégica</Typography>
          <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
            Motor estratégico matemático para anticipar decisiones por rol según comportamiento real de los datos.
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 2 }}>
        Vista activa para rol: <strong>{engine?.role_context?.label || user?.role || 'operador'}</strong>. El modelo proyecta prioridades y escenarios a {horizonDays} días.
      </Alert>

      <Card sx={{ mb: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Horizonte de proyección (días)
          </Typography>
          <Slider
            value={horizonDays}
            onChange={(_, value) => setHorizonDays(Array.isArray(value) ? value[0] : value)}
            min={15}
            max={180}
            step={15}
            marks
            valueLabelDisplay="auto"
          />
        </CardContent>
      </Card>

      {loading && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Grid item xs={12} md={4} key={`skeleton-${idx}`}>
              <Card><CardContent><Skeleton variant="text" width="70%" /><Skeleton variant="rectangular" height={70} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && topScenario && (
        <Card sx={{ mb: 2, border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  Zona prioritaria: {topScenario.zone_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prioridad {topScenario.priority_level} · Score {topScenario.decision_score} · Confianza {topScenario.confidence_percent}%
                </Typography>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: 260 } }}>
                <Typography variant="caption" color="text.secondary">Índice estratégico proyectado</Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Number(topScenario.decision_score || 0), 100)}
                  sx={{ mt: 0.5, height: 10, borderRadius: 99 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {CAPABILITIES.map((item) => (
          <Grid item xs={12} md={6} key={item.label}>
            <Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: theme.palette.primary.main }}>{item.icon}</Box>
                  <Typography fontWeight={700}>{item.label}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && !error && Array.isArray(engine?.scenarios) && engine.scenarios.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {engine.scenarios.map((scenario) => (
            <Grid item xs={12} md={6} key={scenario.zone_id}>
              <Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography fontWeight={700}>{scenario.zone_name}</Typography>
                    <Chip
                      size="small"
                      label={scenario.priority_level}
                      color={scenario.priority_level === 'CRÍTICA' ? 'error' : scenario.priority_level === 'ALTA' ? 'warning' : 'primary'}
                    />
                  </Stack>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Score {scenario.decision_score} · Tendencia {scenario.metrics.trend_percent}% · Ejecución {scenario.metrics.execution_rate_percent}%
                  </Typography>

                  <Stack spacing={0.7}>
                    {scenario.recommendations.map((item) => (
                      <Typography key={item} variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        • {item}
                      </Typography>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.08) }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Proyección a {horizonDays} días
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Solicitudes esperadas: {scenario.forecast.requests_next_horizon} · Pendientes: {scenario.forecast.pending_next_horizon}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && Array.isArray(engine?.future_timeline) && engine.future_timeline.length > 0 && (
        <Card sx={{ mt: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Visualización futura de decisiones
            </Typography>
            <Grid container spacing={1.5}>
              {engine.future_timeline.map((point) => (
                <Grid item xs={12} sm={4} key={point.horizon_days}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                    <Typography variant="caption" color="text.secondary">{point.horizon_days} días</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{point.projected_risk_index}</Typography>
                    <Typography variant="caption" color="text.secondary">Prioridad {point.projected_priority}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
        <Chip size="small" label="Estado: Operativo" color="primary" />
        <Chip size="small" label="Modelo: Matemático" variant="outlined" />
        <Chip size="small" label="Salida: Escenarios + Recomendaciones" variant="outlined" />
      </Stack>
    </Box>
  )
}
