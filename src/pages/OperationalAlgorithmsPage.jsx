import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  alpha,
  useTheme,
} from '@mui/material'
import { MdAutoGraph, MdRefresh, MdRoute, MdWarning, MdBalance, MdRule } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { useViewContext } from '../context/ViewContext'
import {
  fetchZonesSecure,
  resolveZoneIdByTerritory,
  fetchOperationalZonePrioritization,
  fetchOperationalBrigadeAssignment,
  fetchOperationalTerritorialRouting,
  fetchOperationalSemaphoreAlerts,
  fetchOperationalLoadBalance,
  fetchOperationalRulesCatalog,
  evaluateOperationalRules,
  fetchOperationalAdvancedCatalog,
  runOperationalAdvancedSuite,
  fetchOperationalPredictiveCatalog,
  runOperationalPredictiveSuite,
  fetchOperationalOptimizationCatalog,
  runOperationalOptimizationSuite,
  runOperationalWhatIfSimulation,
  fetchOperationalActionCenter,
  fetchOperationalEarlyAlerts,
  fetchOperationalEarlyAlertsNotifierStatus,
  notifyOperationalEarlyAlerts,
  fetchOperationalDecisionLog,
  createOperationalDecisionLogEntry,
  fetchOperationalTemporalComparison,
  fetchOperationalDailyBoard,
  fetchOperationalDataQualityReport
} from '../api'

const PREFERENCES_STORAGE_KEY = 'abaco.operational.algorithms.preferences.v1'

function loadStoredPreferences() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function getStoredNumber(preferences, key, fallback) {
  const value = Number(preferences?.[key])
  return Number.isFinite(value) ? value : fallback
}

function getStoredString(preferences, key, fallback) {
  const value = preferences?.[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

export default function OperationalAlgorithmsPage() {
  const theme = useTheme()
  const { token, user } = useAuth()
  const { territory, project, territoryFilterMode } = useViewContext()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zoneOptions, setZoneOptions] = useState([])
  const [zoneFilter, setZoneFilter] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredString(preferences, 'zoneFilter', 'auto')
  })
  const [limit, setLimit] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'limit', 10)
  })
  const [analysisTab, setAnalysisTab] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredString(preferences, 'analysisTab', 'operational')
  })
  const [predictiveHorizonDays, setPredictiveHorizonDays] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'predictiveHorizonDays', 45)
  })
  const [optimizationBrigades, setOptimizationBrigades] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'optimizationBrigades', 12)
  })
  const [optimizationMaxInterventions, setOptimizationMaxInterventions] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'optimizationMaxInterventions', 6)
  })
  const [optimizationBudget, setOptimizationBudget] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'optimizationBudget', 120000)
  })
  const [optimizationSpeedKmh, setOptimizationSpeedKmh] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'optimizationSpeedKmh', 28)
  })
  const [whatIfExpectedTurnoutDelta, setWhatIfExpectedTurnoutDelta] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'whatIfExpectedTurnoutDelta', 0)
  })
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const preferences = loadStoredPreferences()
    return Boolean(preferences?.autoRefreshEnabled)
  })
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(() => {
    const preferences = loadStoredPreferences()
    return getStoredNumber(preferences, 'autoRefreshSeconds', 60)
  })
  const [decisionSaving, setDecisionSaving] = useState(false)
  const [alertDispatching, setAlertDispatching] = useState(false)
  const [snapshot, setSnapshot] = useState(null)

  const resolvedZoneId = useMemo(() => {
    if (!snapshot?.context) return null
    return snapshot.context.zone_id || null
  }, [snapshot])

  const loadData = async () => {
    if (!token) {
      setLoading(false)
      setError('No hay sesión activa para ejecutar algoritmos operativos.')
      return
    }

    setLoading(true)
    setError('')

    try {
      let zoneId = null
      if (zoneFilter !== 'all' && zoneFilter !== 'auto') {
        zoneId = Number(zoneFilter)
      } else if (zoneFilter === 'auto' && territoryFilterMode === 'auto') {
        zoneId = await resolveZoneIdByTerritory(token, territory)
      }

      const [
        zonesResponse,
        prioritization,
        assignment,
        routing,
        alerts,
        loadBalance,
        rulesCatalog,
        rulesEval,
        advancedCatalog,
        advancedRun,
        predictiveCatalog,
        predictiveRun,
        optimizationCatalog,
        optimizationRun,
        whatIfSimulation,
        actionCenter,
        earlyAlertsIntelligence,
        decisionLog,
        temporalComparison,
        dailyBoard,
        dataQuality,
        alertsNotifierStatus
      ] = await Promise.all([
        fetchZonesSecure(token, { page: 1, limit: 500, sortBy: 'name', order: 'ASC' }),
        fetchOperationalZonePrioritization(token, { zone_id: zoneId || 'all', limit }),
        fetchOperationalBrigadeAssignment(token, { zone_id: zoneId, limit: Math.max(30, limit * 6), apply: false }),
        fetchOperationalTerritorialRouting(token, { zone_id: zoneId || 'all', limit: Math.max(30, limit * 5), speed_kmh: 30 }),
        fetchOperationalSemaphoreAlerts(token, { zone_id: zoneId || 'all' }),
        fetchOperationalLoadBalance(token, { zone_id: zoneId || 'all', capacity: 10, apply: false }),
        fetchOperationalRulesCatalog(token),
        evaluateOperationalRules(token, {
          role: user?.role,
          case_status: 'in_progress',
          context: {
            sensitivity: 'high',
            owns_case: true,
            channel: territoryFilterMode === 'manual' ? 'internal' : 'public_portal',
            territory,
            project
          }
        }),
        fetchOperationalAdvancedCatalog(token),
        runOperationalAdvancedSuite(token, { zone_id: zoneId || 'all', limit, auto: true, include_experimental: true }),
        fetchOperationalPredictiveCatalog(token),
        runOperationalPredictiveSuite(token, { zone_id: zoneId || 'all', limit, horizon_days: predictiveHorizonDays }),
        fetchOperationalOptimizationCatalog(token),
        runOperationalOptimizationSuite(token, {
          zone_id: zoneId || 'all',
          limit,
          brigades: optimizationBrigades,
          max_interventions: optimizationMaxInterventions,
          budget: optimizationBudget,
          speed_kmh: optimizationSpeedKmh
        }),
        runOperationalWhatIfSimulation(token, {
          zone_id: zoneId || 'all',
          limit,
          horizon_days: predictiveHorizonDays,
          budget: optimizationBudget,
          brigades: optimizationBrigades,
          expected_turnout_delta: whatIfExpectedTurnoutDelta
        }),
        fetchOperationalActionCenter(token, {
          zone_id: zoneId || 'all',
          limit: Math.max(5, limit),
          horizon_days: predictiveHorizonDays,
          budget: optimizationBudget,
          brigades: optimizationBrigades
        }),
        fetchOperationalEarlyAlerts(token, {
          zone_id: zoneId || 'all',
          risk_threshold: 70,
          coverage_threshold: 60,
          horizon_days: predictiveHorizonDays,
          budget: optimizationBudget,
          brigades: optimizationBrigades
        }),
        fetchOperationalDecisionLog(token, { zone_id: zoneId || 'all', limit: 10 }),
        fetchOperationalTemporalComparison(token, { zone_id: zoneId || 'all', period: 'weekly', buckets: 8 }),
        fetchOperationalDailyBoard(token, {
          zone_id: zoneId || 'all',
          budget: optimizationBudget,
          brigades: optimizationBrigades,
          speed_kmh: optimizationSpeedKmh
        }),
        fetchOperationalDataQualityReport(token),
        fetchOperationalEarlyAlertsNotifierStatus(token)
      ])

      const zones = Array.isArray(zonesResponse?.data)
        ? zonesResponse.data
        : Array.isArray(zonesResponse?.zones)
          ? zonesResponse.zones
          : []

      setZoneOptions(zones.map((item) => ({ id: Number(item.id || item.zone_id), name: item.name || item.zone_name })))

      setSnapshot({
        context: {
          zone_id: zoneId,
          territory,
          project,
          territory_filter_mode: territoryFilterMode
        },
        prioritization,
        assignment,
        routing,
        alerts,
        loadBalance,
        rulesCatalog,
        rulesEval,
        advancedCatalog,
        advancedRun,
        predictiveCatalog,
        predictiveRun,
        optimizationCatalog,
        optimizationRun,
        whatIfSimulation,
        actionCenter,
        earlyAlertsIntelligence,
        decisionLog,
        temporalComparison,
        dailyBoard,
        dataQuality,
        alertsNotifierStatus
      })
    } catch (loadError) {
      setError(String(loadError?.message || 'No se pudo cargar el panel de algoritmos operativos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [
    token,
    zoneFilter,
    limit,
    territory,
    project,
    territoryFilterMode,
    predictiveHorizonDays,
    optimizationBrigades,
    optimizationMaxInterventions,
    optimizationBudget,
    optimizationSpeedKmh,
    whatIfExpectedTurnoutDelta
  ])

  useEffect(() => {
    if (!autoRefreshEnabled || !Number.isFinite(autoRefreshSeconds) || autoRefreshSeconds < 10) return undefined
    const timer = window.setInterval(() => {
      loadData()
    }, autoRefreshSeconds * 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [autoRefreshEnabled, autoRefreshSeconds, token, zoneFilter, limit, territory, project, territoryFilterMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = {
      zoneFilter,
      limit,
      analysisTab,
      predictiveHorizonDays,
      optimizationBrigades,
      optimizationMaxInterventions,
      optimizationBudget,
      optimizationSpeedKmh,
      whatIfExpectedTurnoutDelta,
      autoRefreshEnabled,
      autoRefreshSeconds
    }
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(payload))
  }, [
    zoneFilter,
    limit,
    analysisTab,
    predictiveHorizonDays,
    optimizationBrigades,
    optimizationMaxInterventions,
    optimizationBudget,
    optimizationSpeedKmh,
    whatIfExpectedTurnoutDelta,
    autoRefreshEnabled,
    autoRefreshSeconds
  ])

  const topZones = Array.isArray(snapshot?.prioritization?.data) ? snapshot.prioritization.data : []
  const topZone = topZones[0] || null
  const alertSummary = snapshot?.alerts?.summary || { red: 0, yellow: 0, green: 0 }
  const assignmentSummary = snapshot?.assignment?.summary || {}
  const loadSummary = snapshot?.loadBalance?.summary || {}
  const firstRoute = Array.isArray(snapshot?.routing?.data) ? snapshot.routing.data[0] : null
  const rulesEval = snapshot?.rulesEval?.data || null
  const advancedSummary = snapshot?.advancedRun?.summary || {}
  const advancedTop = Array.isArray(snapshot?.advancedRun?.integrated_ranking)
    ? snapshot.advancedRun.integrated_ranking[0]
    : null
  const advancedAlgorithms = Array.isArray(snapshot?.advancedRun?.algorithms)
    ? snapshot.advancedRun.algorithms
    : []
  const predictiveSummary = snapshot?.predictiveRun?.summary || {}
  const predictiveTop = Array.isArray(snapshot?.predictiveRun?.integrated_ranking)
    ? snapshot.predictiveRun.integrated_ranking[0]
    : null
  const predictiveModels = Array.isArray(snapshot?.predictiveRun?.models)
    ? snapshot.predictiveRun.models
    : []
  const optimizationSummary = snapshot?.optimizationRun?.summary || {}
  const optimizationTop = Array.isArray(snapshot?.optimizationRun?.optimization_ranking)
    ? snapshot.optimizationRun.optimization_ranking[0]
    : null
  const optimizationPlans = snapshot?.optimizationRun?.plans || {}
  const optimizationRoute = optimizationPlans?.response_time_optimization || { sequence: [], total_distance_km: 0, estimated_minutes: 0 }
  const optimizationBrigadePlan = Array.isArray(optimizationPlans?.brigade_capacity_optimization)
    ? optimizationPlans.brigade_capacity_optimization
    : []
  const optimizationBudgetPlan = Array.isArray(optimizationPlans?.budget_impact_optimization)
    ? optimizationPlans.budget_impact_optimization
    : []
  const whatIfSummary = snapshot?.whatIfSimulation?.summary || {}
  const actionRecommendations = Array.isArray(snapshot?.actionCenter?.data) ? snapshot.actionCenter.data : []
  const intelligenceAlerts = Array.isArray(snapshot?.earlyAlertsIntelligence?.data) ? snapshot.earlyAlertsIntelligence.data : []
  const decisionLogRows = Array.isArray(snapshot?.decisionLog?.data) ? snapshot.decisionLog.data : []
  const temporalTrendActivations = Array.isArray(snapshot?.temporalComparison?.trend?.activations) ? snapshot.temporalComparison.trend.activations : []
  const dailyTopActions = Array.isArray(snapshot?.dailyBoard?.top_actions) ? snapshot.dailyBoard.top_actions : []
  const dataQualitySummary = snapshot?.dataQuality?.summary || {}
  const alertsNotifierStatus = snapshot?.alertsNotifierStatus || { summary: {}, channels: {} }

  const registerTopRecommendationInDecisionLog = async () => {
    if (!token || actionRecommendations.length === 0 || decisionSaving) return

    const firstRecommendation = actionRecommendations[0]
    setDecisionSaving(true)
    setError('')

    try {
      await createOperationalDecisionLogEntry(token, {
        zone_id: firstRecommendation.zone_id,
        action_title: firstRecommendation.action_title,
        rationale: firstRecommendation.rationale,
        priority: firstRecommendation.priority,
        owner_role: firstRecommendation.owner_role,
        estimated_cost: firstRecommendation.estimated_cost,
        source_module: 'action_center',
        expected_impact_score: firstRecommendation.expected_impact_score,
        due_window_hours: firstRecommendation.due_window_hours,
        recommendation_id: firstRecommendation.recommendation_id
      })
      await loadData()
    } catch (saveError) {
      setError(String(saveError?.message || 'No se pudo registrar la recomendación en bitácora'))
    } finally {
      setDecisionSaving(false)
    }
  }

  const dispatchCriticalAlerts = async () => {
    if (!token || alertDispatching) return
    setAlertDispatching(true)
    setError('')

    try {
      await notifyOperationalEarlyAlerts(token, {
        zone_id: resolvedZoneId,
        risk_threshold: 70,
        coverage_threshold: 60,
        horizon_days: predictiveHorizonDays,
        budget: optimizationBudget,
        brigades: optimizationBrigades,
        dispatch: true
      })
      await loadData()
    } catch (dispatchError) {
      setError(String(dispatchError?.message || 'No se pudo ejecutar despacho de alertas'))
    } finally {
      setAlertDispatching(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Card
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
          }}
        >
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MdAutoGraph size={20} color={theme.palette.primary.main} />
                  <Chip label="Operaciones determinísticas" color="primary" />
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.7 }}>
                  Panel Operativo de Algoritmos
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  Priorización territorial, asignación de brigadas, ruteo diario, semaforización, balanceo de carga y motor de reglas por rol/contexto.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" startIcon={<MdRefresh />} onClick={loadData}>
                  Actualizar
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.4 }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Zona</InputLabel>
                <Select value={zoneFilter} label="Zona" onChange={(event) => setZoneFilter(event.target.value)}>
                  <MenuItem value="auto">Automático por territorio</MenuItem>
                  <MenuItem value="all">Todas las zonas</MenuItem>
                  {zoneOptions.map((zone) => (
                    <MenuItem key={zone.id} value={String(zone.id)}>{zone.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Top zonas</InputLabel>
                <Select value={limit} label="Top zonas" onChange={(event) => setLimit(Number(event.target.value))}>
                  {[5, 10, 15, 20].map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Chip label={`Territorio: ${territory}`} variant="outlined" />
              <Chip label={`Proyecto: ${project}`} variant="outlined" />
              <Chip label={resolvedZoneId ? `Zona efectiva: #${resolvedZoneId}` : 'Zona efectiva: agregada'} color={resolvedZoneId ? 'success' : 'default'} variant="outlined" />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <FormControlLabel
                control={<Switch checked={autoRefreshEnabled} onChange={(event) => setAutoRefreshEnabled(event.target.checked)} />}
                label="Auto-refresh"
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Intervalo</InputLabel>
                <Select
                  value={autoRefreshSeconds}
                  label="Intervalo"
                  onChange={(event) => setAutoRefreshSeconds(Number(event.target.value))}
                  disabled={!autoRefreshEnabled}
                >
                  {[30, 60, 120, 300].map((item) => (
                    <MenuItem key={item} value={item}>{`${item}s`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip
                label={autoRefreshEnabled ? `Actualización cada ${autoRefreshSeconds}s` : 'Actualización manual'}
                color={autoRefreshEnabled ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>

            <Tabs
              value={analysisTab}
              onChange={(_event, nextValue) => setAnalysisTab(nextValue)}
              sx={{ mt: 1.5 }}
            >
              <Tab value="operational" label="Operativo" />
              <Tab value="predictive" label="Predictivo" />
              <Tab value="optimization" label="Optimización" />
              <Tab value="intelligence" label="Inteligencia" />
            </Tabs>
          </CardContent>
        </Card>

        {loading && (
          <Card sx={{ mb: 2.5, borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                Ejecutando algoritmos operativos...
              </Typography>
              <LinearProgress />
            </CardContent>
          </Card>
        )}

        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

        {analysisTab === 'operational' && (
          <>
            <Grid container spacing={2.2}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Zona prioritaria</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {topZone?.zone_name || '—'}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Score: <strong>{topZone?.score ?? 0}</strong> · Semáforo: <strong>{String(topZone?.semaphore || 'n/a').toUpperCase()}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Alertas críticas</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.error.main }}>
                  {alertSummary.red || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Amarillas: <strong>{alertSummary.yellow || 0}</strong> · Verdes: <strong>{alertSummary.green || 0}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Asignación brigadas</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {assignmentSummary.assigned_items || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Sin asignar: <strong>{assignmentSummary.unassigned_items || 0}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Suite avanzada</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {advancedSummary.algorithms_executed || snapshot?.advancedCatalog?.total_algorithms || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Activación autónoma por situación territorial (sin activación manual).
                </Typography>
              </CardContent>
            </Card>
          </Grid>
            </Grid>

            <Grid container spacing={2.2} sx={{ mt: 0.2 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                  Nueva Suite Avanzada (40 algoritmos)
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.8 }}>
                  Zona líder integrada: <strong>{advancedTop?.zone_name || 'n/d'}</strong> · Score compuesto: <strong>{advancedTop?.composite_score ?? 0}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.8 }}>
                  Modo autónomo: <strong>{advancedSummary.autonomous_mode ? 'Activo' : 'Inactivo'}</strong> · Activaciones totales: <strong>{advancedSummary.total_activations || 0}</strong>
                </Typography>
                <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.7 }}>
                  {advancedAlgorithms.slice(0, 8).map((item) => (
                    <Chip key={item.id} size="small" label={`${item.name}: ${item.avg_score}`} variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.1 }}>
                  <MdWarning color={theme.palette.warning.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Semaforización y prioridades
                  </Typography>
                </Stack>
                <Stack spacing={0.8}>
                  {topZones.slice(0, 6).map((item) => (
                    <Stack key={item.zone_id} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {item.zone_name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={item.semaphore} color={item.semaphore === 'red' ? 'error' : item.semaphore === 'yellow' ? 'warning' : 'success'} />
                        <Chip size="small" label={`Score ${item.score}`} variant="outlined" />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.1 }}>
                  <MdRoute color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Ruteo territorial (VRP simplificado)
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.8 }}>
                  Brigada líder: <strong>{firstRoute?.brigade?.name || 'n/d'}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.8 }}>
                  Distancia estimada: <strong>{firstRoute?.total_distance_km ?? 0} km</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.8 }}>
                  Paradas estimadas: <strong>{firstRoute?.total_stops ?? 0}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Tiempo de desplazamiento: <strong>{firstRoute?.estimated_travel_minutes ?? 0} min</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
            </Grid>

            <Grid container spacing={2.2} sx={{ mt: 0.2 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.1 }}>
                  <MdBalance color={theme.palette.success.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Balanceador de carga operativa
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.6 }}>
                  Operadores: <strong>{loadSummary.operators || 0}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.6 }}>
                  Tareas abiertas: <strong>{loadSummary.total_open_tasks || 0}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.6 }}>
                  Utilización objetivo: <strong>{loadSummary.target_utilization || 0}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Transferencias propuestas: <strong>{loadSummary.proposed_transfers || 0}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.1 }}>
                  <MdRule color={theme.palette.info.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Motor de reglas de permisos/acciones
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.8 }}>
                  Acciones permitidas para rol actual: <strong>{(rulesEval?.allowed_actions || []).length}</strong>
                </Typography>
                <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.7 }}>
                  {(rulesEval?.allowed_actions || []).slice(0, 8).map((action) => (
                    <Chip key={action} size="small" label={action} color="success" variant="outlined" />
                  ))}
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 1.1, color: theme.palette.text.secondary }}>
                  Reglas catalogadas: {snapshot?.rulesCatalog?.roles_supported?.join(', ') || 'n/d'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
            </Grid>
          </>
        )}

        {analysisTab === 'predictive' && (
          <Grid container spacing={2.2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Modelos predictivos</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {predictiveSummary.models_executed || snapshot?.predictiveCatalog?.total_models || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Horizonte analítico: <strong>{predictiveHorizonDays} días</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                      Parámetros predictivos
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Horizonte (días)</InputLabel>
                        <Select
                          value={predictiveHorizonDays}
                          label="Horizonte (días)"
                          onChange={(event) => setPredictiveHorizonDays(Number(event.target.value))}
                        >
                          {[15, 30, 45, 60, 90, 120].map((item) => (
                            <MenuItem key={item} value={item}>{item}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip label="La actualización aplica automáticamente" variant="outlined" />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Zona con mayor riesgo proyectado</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {predictiveTop?.zone_name || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Score: <strong>{predictiveTop?.predictive_risk_score ?? 0}</strong> · Banda: <strong>{String(predictiveTop?.forecast_band || 'n/a').toUpperCase()}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Cobertura de predicción</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {predictiveSummary.zones_evaluated || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Zonas evaluadas en la corrida actual.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Modelos y score promedio
                  </Typography>
                  <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.7 }}>
                    {predictiveModels.slice(0, 12).map((item) => (
                      <Chip key={item.id} size="small" label={`${item.name}: ${item.avg_forecast}`} variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisTab === 'optimization' && (
          <Grid container spacing={2.2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Zona priorizada para optimización</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {optimizationTop?.zone_name || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Score óptimo: <strong>{optimizationTop?.optimization_score ?? 0}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Ruta óptima estimada</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {optimizationRoute?.sequence?.length || optimizationSummary.route_stops || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Distancia: <strong>{optimizationRoute?.total_distance_km ?? 0} km</strong> · Tiempo: <strong>{optimizationRoute?.estimated_minutes ?? 0} min</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Plan presupuestal óptimo</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {optimizationBudgetPlan.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Asignaciones con impacto esperado para zonas objetivo.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Parámetros de optimización
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <InputLabel>Brigadas</InputLabel>
                      <Select
                        value={optimizationBrigades}
                        label="Brigadas"
                        onChange={(event) => setOptimizationBrigades(Number(event.target.value))}
                      >
                        {[6, 8, 10, 12, 16, 20, 24].map((item) => (
                          <MenuItem key={item} value={item}>{item}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 190 }}>
                      <InputLabel>Intervenciones máx.</InputLabel>
                      <Select
                        value={optimizationMaxInterventions}
                        label="Intervenciones máx."
                        onChange={(event) => setOptimizationMaxInterventions(Number(event.target.value))}
                      >
                        {[3, 4, 5, 6, 8, 10, 12].map((item) => (
                          <MenuItem key={item} value={item}>{item}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 210 }}>
                      <InputLabel>Presupuesto</InputLabel>
                      <Select
                        value={optimizationBudget}
                        label="Presupuesto"
                        onChange={(event) => setOptimizationBudget(Number(event.target.value))}
                      >
                        {[60000, 90000, 120000, 180000, 240000, 300000].map((item) => (
                          <MenuItem key={item} value={item}>{`$ ${item}`}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <InputLabel>Velocidad km/h</InputLabel>
                      <Select
                        value={optimizationSpeedKmh}
                        label="Velocidad km/h"
                        onChange={(event) => setOptimizationSpeedKmh(Number(event.target.value))}
                      >
                        {[20, 25, 28, 30, 35, 40, 50].map((item) => (
                          <MenuItem key={item} value={item}>{item}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Chip label="La actualización aplica automáticamente" variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Asignación óptima de brigadas
                  </Typography>
                  <Stack spacing={0.8}>
                    {optimizationBrigadePlan.slice(0, 6).map((item) => (
                      <Stack key={item.zone_id} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {item.zone_name}
                        </Typography>
                        <Chip size="small" label={`Brigadas ${item.brigades_assigned}`} variant="outlined" />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Asignación óptima de presupuesto
                  </Typography>
                  <Stack spacing={0.8}>
                    {optimizationBudgetPlan.slice(0, 6).map((item) => (
                      <Stack key={item.zone_id} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {item.zone_name}
                        </Typography>
                        <Chip size="small" label={`$ ${item.allocated_budget}`} variant="outlined" />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analysisTab === 'intelligence' && (
          <Grid container spacing={2.2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Simulador What-if</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    Δ {whatIfSummary.delta_composite ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Baseline: <strong>{whatIfSummary.baseline_composite_avg ?? 0}</strong> · Escenario: <strong>{whatIfSummary.scenario_composite_avg ?? 0}</strong>
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Participación esperada Δ</InputLabel>
                    <Select
                      value={whatIfExpectedTurnoutDelta}
                      label="Participación esperada Δ"
                      onChange={(event) => setWhatIfExpectedTurnoutDelta(Number(event.target.value))}
                    >
                      {[-20, -10, -5, 0, 5, 10, 15, 20].map((item) => (
                        <MenuItem key={item} value={item}>{item > 0 ? `+${item}` : item}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Centro de recomendaciones</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {actionRecommendations.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Top acción: <strong>{actionRecommendations[0]?.zone_name || 'n/d'}</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={registerTopRecommendationInDecisionLog}
                    disabled={decisionSaving || actionRecommendations.length === 0}
                  >
                    {decisionSaving ? 'Guardando...' : 'Registrar top acción en bitácora'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Alertas tempranas inteligentes</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.error.main }}>
                    {intelligenceAlerts.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Críticas: <strong>{intelligenceAlerts.filter((item) => item.severity === 'critical').length}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Canales configurados: <strong>{alertsNotifierStatus?.summary?.configured_channels ?? 0}/3</strong>
                  </Typography>
                  <Stack direction="row" spacing={0.6} sx={{ mt: 0.8, mb: 0.6, flexWrap: 'wrap', gap: 0.6 }}>
                    <Chip
                      size="small"
                      label={`Webhook ${alertsNotifierStatus?.channels?.webhook?.configured ? 'ON' : 'OFF'}`}
                      color={alertsNotifierStatus?.channels?.webhook?.configured ? 'success' : 'default'}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`Email ${alertsNotifierStatus?.channels?.email?.configured ? 'ON' : 'OFF'}`}
                      color={alertsNotifierStatus?.channels?.email?.configured ? 'success' : 'default'}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`WhatsApp ${alertsNotifierStatus?.channels?.whatsapp?.configured ? 'ON' : 'OFF'}`}
                      color={alertsNotifierStatus?.channels?.whatsapp?.configured ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Stack>
                  <Button
                    sx={{ mt: 1 }}
                    variant="outlined"
                    size="small"
                    onClick={dispatchCriticalAlerts}
                    disabled={alertDispatching}
                  >
                    {alertDispatching ? 'Enviando...' : 'Notificar alertas críticas'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Modo operativo diario
                  </Typography>
                  <Stack spacing={0.8}>
                    {dailyTopActions.slice(0, 5).map((item) => (
                      <Stack key={item.recommendation_id} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {item.action_title}
                        </Typography>
                        <Chip size="small" label={item.priority} color={item.priority === 'critical' ? 'error' : item.priority === 'high' ? 'warning' : 'default'} />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Calidad de datos operacional
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.6 }}>
                    Score: <strong>{dataQualitySummary.quality_score ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.6 }}>
                    Issues: <strong>{dataQualitySummary.issues_total ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Severidad alta: <strong>{dataQualitySummary.high_severity ?? 0}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Bitácora de decisiones
                  </Typography>
                  <Stack spacing={0.8}>
                    {decisionLogRows.slice(0, 5).map((item) => (
                      <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {item.action_title}
                        </Typography>
                        <Chip size="small" label={item.status || 'planned'} variant="outlined" />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.1 }}>
                    Comparador temporal por zona
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.6 }}>
                    Buckets con activaciones: <strong>{temporalTrendActivations.length}</strong>
                  </Typography>
                  <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.7 }}>
                    {temporalTrendActivations.slice(0, 6).map((item) => (
                      <Chip
                        key={String(item.bucket_date)}
                        size="small"
                        label={`${String(item.bucket_date).slice(0, 10)} · ${item.activation_events}`}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  )
}
