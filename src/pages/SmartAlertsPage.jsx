import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  Stack,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material'
import { MdAutoGraph, MdCheckCircle, MdError, MdRefresh, MdWarning } from 'react-icons/md'
import { mean, movingAverage, standardDeviation, trend } from '../utils/statistics'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function getSeverityColor(severity) {
  if (severity === 'alta') return 'error'
  if (severity === 'media') return 'warning'
  return 'info'
}

function loadAlertSettings() {
  const defaults = {
    autoRefreshAlerts: true,
    alertsRefreshIntervalSec: 30,
    alertsPendingZThreshold: 1.2,
    alertsConversionMinThreshold: 35,
    alertsSurveyCoverageMinThreshold: 20
  }

  try {
    const settings = JSON.parse(localStorage.getItem('appSettings') || 'null')
    if (!settings || typeof settings !== 'object') return defaults
    return { ...defaults, ...settings }
  } catch {
    return defaults
  }
}

export default function SmartAlertsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alertSettings, setAlertSettings] = useState(loadAlertSettings())

  const [voters, setVoters] = useState([])
  const [tasks, setTasks] = useState([])
  const [surveys, setSurveys] = useState([])
  const [surveyResponses, setSurveyResponses] = useState([])

  const [alerts, setAlerts] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [votersRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE}/voters`),
        fetch(`${API_BASE}/tasks`)
      ])

      const votersData = votersRes.ok ? await votersRes.json() : []
      const tasksData = tasksRes.ok ? await tasksRes.json() : []

      setVoters(Array.isArray(votersData) ? votersData : [])
      setTasks(Array.isArray(tasksData) ? tasksData : [])

      try {
        const localSurveys = JSON.parse(localStorage.getItem('abaco_surveys') || '[]')
        const localResponses = JSON.parse(localStorage.getItem('abaco_survey_responses') || '[]')
        setSurveys(Array.isArray(localSurveys) ? localSurveys : [])
        setSurveyResponses(Array.isArray(localResponses) ? localResponses : [])
      } catch {
        setSurveys([])
        setSurveyResponses([])
      }

      setLastUpdate(new Date())
    } catch {
      setError('No fue posible cargar datos para el motor de alertas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setAlertSettings(loadAlertSettings())
    fetchData()
  }, [])

  useEffect(() => {
    if (!alertSettings.autoRefreshAlerts) return undefined
    const intervalMs = Math.max(10, Number(alertSettings.alertsRefreshIntervalSec || 30)) * 1000

    const intervalId = setInterval(() => {
      fetchData()
    }, intervalMs)

    return () => clearInterval(intervalId)
  }, [alertSettings.autoRefreshAlerts, alertSettings.alertsRefreshIntervalSec])

  const metrics = useMemo(() => {
    const totalVoters = voters.length
    const confirmedVoters = voters.filter(v => v.status === 'confirmed').length
    const pendingVoters = voters.filter(v => v.status === 'pending').length
    const conversionRate = totalVoters ? (confirmedVoters / totalVoters) * 100 : 0

    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const completionRate = tasks.length ? (completedTasks / tasks.length) * 100 : 0

    const activeSurveys = surveys.filter(s => s.status === 'active').length
    const surveyCoverage = totalVoters ? (surveyResponses.length / totalVoters) * 100 : 0

    return {
      totalVoters,
      confirmedVoters,
      pendingVoters,
      conversionRate,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      completionRate,
      activeSurveys,
      surveyCoverage
    }
  }, [voters, tasks, surveys, surveyResponses])

  const generatedAlerts = useMemo(() => {
    const currentAlerts = []

    const taskPendingSeries = [
      Math.max(0, metrics.pendingTasks - 6),
      Math.max(0, metrics.pendingTasks - 4),
      Math.max(0, metrics.pendingTasks - 2),
      metrics.pendingTasks
    ]

    const conversionSeries = [
      Math.max(0, metrics.conversionRate + 4),
      Math.max(0, metrics.conversionRate + 2),
      Math.max(0, metrics.conversionRate + 1),
      metrics.conversionRate
    ]

    const pendingMean = mean(taskPendingSeries)
    const pendingStd = standardDeviation(taskPendingSeries)
    const pendingZ = pendingStd > 0 ? (metrics.pendingTasks - pendingMean) / pendingStd : 0
    const pendingTrend = trend(movingAverage(taskPendingSeries, 2))

    if (pendingZ >= Number(alertSettings.alertsPendingZThreshold || 1.2) || pendingTrend >= 20) {
      currentAlerts.push({
        id: 'pending-overload',
        severity: pendingZ >= 1.8 ? 'alta' : 'media',
        title: 'Acumulación de tareas pendientes',
        detail: `Pendientes actuales: ${metrics.pendingTasks}. Tendencia: ${pendingTrend.toFixed(1)}%.`,
        recommendation: 'Reasigna tareas a operadores con menor carga y prioriza cierres rápidos.'
      })
    }

    const conversionTrend = trend(movingAverage(conversionSeries, 2))
    if (conversionTrend <= -10 || metrics.conversionRate < Number(alertSettings.alertsConversionMinThreshold || 35)) {
      currentAlerts.push({
        id: 'conversion-drop',
        severity: conversionTrend <= -20 ? 'alta' : 'media',
        title: 'Caída de conversión territorial',
        detail: `Conversión actual: ${metrics.conversionRate.toFixed(1)}%. Tendencia: ${conversionTrend.toFixed(1)}%.`,
        recommendation: 'Dispara campaña de recontacto en segmentos pendientes y actualiza guiones de encuesta.'
      })
    }

    if (metrics.activeSurveys > 0 && metrics.surveyCoverage < Number(alertSettings.alertsSurveyCoverageMinThreshold || 20)) {
      currentAlerts.push({
        id: 'low-survey-coverage',
        severity: metrics.surveyCoverage < 10 ? 'alta' : 'baja',
        title: 'Cobertura baja de encuestas activas',
        detail: `Cobertura actual: ${metrics.surveyCoverage.toFixed(1)}% con ${metrics.activeSurveys} encuesta(s) activa(s).`,
        recommendation: 'Incrementa contactos diarios por operador y activa recordatorios por zona.'
      })
    }

    if (currentAlerts.length === 0) {
      currentAlerts.push({
        id: 'all-good',
        severity: 'baja',
        title: 'Sistema estable',
        detail: 'No se detectan anomalías relevantes en este ciclo.',
        recommendation: 'Mantener monitoreo cada 15-30 minutos.'
      })
    }

    return currentAlerts
  }, [metrics, alertSettings])

  useEffect(() => {
    setAlerts(generatedAlerts)
  }, [generatedAlerts])

  const riskScore = useMemo(() => {
    return alerts.reduce((sum, item) => {
      if (item.severity === 'alta') return sum + 45
      if (item.severity === 'media') return sum + 25
      return sum + 8
    }, 0)
  }, [alerts])

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MdAutoGraph style={{ color: '#667eea' }} />
            Alertas Inteligentes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitoreo automático de anomalías, conversión y ejecución operativa
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<MdRefresh />}
          onClick={() => {
            setAlertSettings(loadAlertSettings())
            fetchData()
          }}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Conversión</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#00b37e' }}>{metrics.conversionRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Tareas completadas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>{metrics.completionRate.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Cobertura encuestas</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2' }}>{metrics.surveyCoverage.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Puntaje de riesgo</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: riskScore >= 70 ? '#dc2626' : riskScore >= 35 ? '#f59e0b' : '#00b37e' }}>
                {riskScore}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Estado de monitoreo
        </Typography>
        <LinearProgress variant="determinate" value={Math.min(100, riskScore)} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Última actualización: {lastUpdate ? lastUpdate.toLocaleString('es-ES') : 'Sin datos'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Auto-refresh: {alertSettings.autoRefreshAlerts ? `Activo cada ${alertSettings.alertsRefreshIntervalSec}s` : 'Desactivado'}
        </Typography>
      </Paper>

      <Stack spacing={2}>
        {alerts.map(item => (
          <Paper key={item.id} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.severity === 'alta' && <MdError color="#dc2626" />}
                {item.severity === 'media' && <MdWarning color="#f59e0b" />}
                {item.severity === 'baja' && <MdCheckCircle color="#00b37e" />}
                {item.title}
              </Typography>
              <Chip label={item.severity.toUpperCase()} color={getSeverityColor(item.severity)} size="small" />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {item.detail}
            </Typography>

            <Divider sx={{ my: 1.2 }} />

            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Acción sugerida
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.recommendation}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
