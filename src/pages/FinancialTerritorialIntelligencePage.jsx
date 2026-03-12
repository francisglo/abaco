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
  Divider,
  LinearProgress,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Snackbar,
  useMediaQuery,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import {
  MdAccountBalance,
  MdAreaChart,
  MdAutoGraph,
  MdBusinessCenter,
  MdInsights,
  MdMap,
  MdTrendingUp,
  MdWarning,
  MdContentCopy,
  MdShare,
} from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { useViewContext } from '../context/ViewContext'
import { fetchFinancialIntelligenceSummary, resolveZoneIdByTerritory } from '../api'

const financialSegments = [
  'Bancos',
  'Cooperativas financieras',
  'Microfinancieras',
  'Fintech',
  'Crédito productivo',
  'Fondos territoriales',
]

const fallbackOpportunityByZone = [
  { zone: 'Zona A', dominantSector: 'Comercio', creditPotential: 84, riskScore: 28 },
  { zone: 'Zona B', dominantSector: 'Agricultura', creditPotential: 72, riskScore: 36 },
  { zone: 'Zona C', dominantSector: 'Transporte', creditPotential: 67, riskScore: 31 },
]

const fallbackCoverageInsights = [
  'Municipios subatendidos por cobertura bancaria',
  'Barrios con crecimiento comercial acelerado',
  'Zonas con alta demanda de crédito productivo',
]

const DEFAULT_FILTERS = {
  zone_id: 'all',
  sector: 'all',
  min_credit_potential: '',
  max_risk_score: ''
}

const FILTER_RESET_VALUES = {
  zone_id: 'all',
  sector: 'all',
  min_credit_potential: '',
  max_risk_score: ''
}

function parseFiltersFromSearchParams(searchParams) {
  return {
    zone_id: searchParams.get('zone_id') || 'all',
    sector: searchParams.get('sector') || 'all',
    min_credit_potential: searchParams.get('min_credit_potential') || '',
    max_risk_score: searchParams.get('max_risk_score') || ''
  }
}

function buildSearchParamsFromFilters(filters) {
  const params = new URLSearchParams()
  if (filters.zone_id && filters.zone_id !== 'all') params.set('zone_id', String(filters.zone_id))
  if (filters.sector && filters.sector !== 'all') params.set('sector', String(filters.sector))
  if (filters.min_credit_potential !== '') params.set('min_credit_potential', String(filters.min_credit_potential))
  if (filters.max_risk_score !== '') params.set('max_risk_score', String(filters.max_risk_score))
  return params
}

function areFiltersEqual(left, right) {
  return (
    String(left?.zone_id || 'all') === String(right?.zone_id || 'all')
    && String(left?.sector || 'all') === String(right?.sector || 'all')
    && String(left?.min_credit_potential || '') === String(right?.min_credit_potential || '')
    && String(left?.max_risk_score || '') === String(right?.max_risk_score || '')
  )
}

function truncateLabel(value, max = 16) {
  const text = String(value || '')
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1))}…`
}

export default function FinancialTerritorialIntelligencePage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { token } = useAuth()
  const { territory, project, territoryFilterMode } = useViewContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [financialData, setFinancialData] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null)
  const [filters, setFilters] = useState(() => parseFiltersFromSearchParams(searchParams))

  const appliedFilters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams])

  const loadSummary = async (nextFilters) => {
    if (!token) {
      setLoading(false)
      setError('No hay sesión activa para consultar datos financieros.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetchFinancialIntelligenceSummary(token, {
        limit: 6,
        zone_id: nextFilters.zone_id,
        sector: nextFilters.sector,
        min_credit_potential: nextFilters.min_credit_potential,
        max_risk_score: nextFilters.max_risk_score
      })
      setFinancialData(response)
    } catch (loadError) {
      setError(String(loadError?.message || 'No se pudo cargar inteligencia financiera'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const loadSummary = async () => {
      if (!token) {
        if (active) {
          setLoading(false)
          setError('No hay sesión activa para consultar datos financieros.')
        }
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await fetchFinancialIntelligenceSummary(token, {
          limit: 6,
          zone_id: appliedFilters.zone_id,
          sector: appliedFilters.sector,
          min_credit_potential: appliedFilters.min_credit_potential,
          max_risk_score: appliedFilters.max_risk_score
        })
        if (!active) return
        setFinancialData(response)
      } catch (loadError) {
        if (!active) return
        setError(String(loadError?.message || 'No se pudo cargar inteligencia financiera'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSummary()

    return () => {
      active = false
    }
  }, [token, appliedFilters])

  useEffect(() => {
    setFilters(appliedFilters)
  }, [appliedFilters])

  useEffect(() => {
    if (areFiltersEqual(filters, appliedFilters)) return

    const timeoutId = setTimeout(() => {
      const nextParams = buildSearchParamsFromFilters(filters)
      setSearchParams(nextParams, { replace: true })
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [filters, appliedFilters, setSearchParams])

  useEffect(() => {
    let active = true

    const syncTerritoryWithZoneFilter = async () => {
      if (!token) return
      if (territoryFilterMode !== 'auto') return
      if (String(territory || '').toLowerCase() === 'nacional') return

      const currentZone = searchParams.get('zone_id')
      if (currentZone && currentZone !== 'all') return

      const resolvedZoneId = await resolveZoneIdByTerritory(token, territory)
      if (!active || !resolvedZoneId) return

      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('zone_id', String(resolvedZoneId))
      setSearchParams(nextParams, { replace: true })
    }

    syncTerritoryWithZoneFilter()

    return () => {
      active = false
    }
  }, [token, territory, territoryFilterMode, searchParams, setSearchParams])

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleResetFilters = () => {
    const reset = { ...DEFAULT_FILTERS }
    setFilters(reset)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const handleRemoveFilter = (filterKey) => {
    const resetValue = FILTER_RESET_VALUES[filterKey]
    if (resetValue === undefined) return
    setFilters((current) => ({ ...current, [filterKey]: resetValue }))
  }

  const handleCopyUrl = async () => {
    closeActionsMenu()
    try {
      await navigator.clipboard.writeText(window.location.href)
      setFeedbackMessage('URL copiada al portapapeles')
      setFeedbackOpen(true)
    } catch {
      setError('No se pudo copiar la URL en este navegador/dispositivo')
    }
  }

  const openActionsMenu = (event) => {
    setActionsAnchorEl(event.currentTarget)
  }

  const closeActionsMenu = () => {
    setActionsAnchorEl(null)
  }

  const handleShareUrl = async () => {
    closeActionsMenu()
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ÁBACO · Inteligencia Financiera Territorial',
          text: 'Vista filtrada de Inteligencia Financiera Territorial',
          url: window.location.href
        })
        setFeedbackMessage('Enlace compartido')
        setFeedbackOpen(true)
        return
      }

      await navigator.clipboard.writeText(window.location.href)
      setFeedbackMessage('Compartir no disponible. URL copiada al portapapeles')
      setFeedbackOpen(true)
    } catch {
      setError('No se pudo compartir o copiar la URL en este dispositivo')
    }
  }

  const handleCopyAsText = async () => {
    closeActionsMenu()
    try {
      const lines = [
        'ÁBACO · Inteligencia Financiera Territorial',
        activeFilterItems.length > 0
          ? `Filtros: ${activeFilterItems.map((item) => item.fullLabel || item.label).join(' | ')}`
          : 'Filtros: Sin filtros activos',
        `Enlace: ${window.location.href}`
      ]

      await navigator.clipboard.writeText(lines.join('\n'))
      setFeedbackMessage('Resumen + URL copiados al portapapeles')
      setFeedbackOpen(true)
    } catch {
      setError('No se pudo copiar el resumen en este navegador/dispositivo')
    }
  }

  const opportunityByZone = useMemo(() => {
    if (!Array.isArray(financialData?.segments) || financialData.segments.length === 0) {
      return fallbackOpportunityByZone
    }

    return financialData.segments.slice(0, 6).map((item) => ({
      zone: item.zone_name,
      dominantSector: item.dominant_sector,
      creditPotential: Number(item.credit_potential || 0),
      riskScore: Number(item.risk_score || 0),
      recommendedProduct: item.recommended_product || 'Crédito escalonado'
    }))
  }, [financialData])

  const coverageInsights = useMemo(() => {
    if (!Array.isArray(financialData?.coverage_opportunities) || financialData.coverage_opportunities.length === 0) {
      return fallbackCoverageInsights
    }

    return financialData.coverage_opportunities.map((item) => `${item.zone_name}: ${item.reason}`)
  }, [financialData])

  const iadtScore = useMemo(() => {
    if (Number.isFinite(Number(financialData?.iadt?.score))) {
      return Number(financialData.iadt.score)
    }
    const totalOpportunity = opportunityByZone.reduce((acc, item) => acc + item.creditPotential, 0)
    const totalRisk = opportunityByZone.reduce((acc, item) => acc + item.riskScore, 0)
    const normalized = Math.max(0, Math.min(100, Math.round((totalOpportunity / opportunityByZone.length) - (totalRisk / opportunityByZone.length) * 0.35)))
    return normalized
  }, [financialData, opportunityByZone])

  const summary = financialData?.summary || {}
  const tracking = financialData?.credit_program_tracking || {}
  const availableFilters = financialData?.available_filters || { zones: [], sectors: [] }
  const activeFilterItems = useMemo(() => {
    const items = []

    if (filters.zone_id !== 'all') {
      const zone = (availableFilters.zones || []).find((item) => String(item.id) === String(filters.zone_id))
      const zoneName = zone?.name || filters.zone_id
      const shortZoneName = isMobile ? truncateLabel(zoneName, 14) : zoneName
      items.push({
        key: 'zone_id',
        label: isMobile ? `Z: ${shortZoneName}` : `Zona: ${zoneName}`,
        fullLabel: `Zona: ${zoneName}`
      })
    }

    if (filters.sector !== 'all') {
      items.push({
        key: 'sector',
        label: isMobile ? `Sec: ${filters.sector}` : `Sector: ${filters.sector}`,
        fullLabel: `Sector: ${filters.sector}`
      })
    }

    if (filters.min_credit_potential !== '') {
      items.push({
        key: 'min_credit_potential',
        label: isMobile ? `Pot. mín: ${filters.min_credit_potential}` : `Potencial mín: ${filters.min_credit_potential}`,
        fullLabel: `Potencial mín: ${filters.min_credit_potential}`
      })
    }

    if (filters.max_risk_score !== '') {
      items.push({
        key: 'max_risk_score',
        label: isMobile ? `R. máx: ${filters.max_risk_score}` : `Riesgo máx: ${filters.max_risk_score}`,
        fullLabel: `Riesgo máx: ${filters.max_risk_score}`
      })
    }

    return items
  }, [filters, availableFilters.zones, isMobile])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default, py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Card
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          }}
        >
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                  Inteligencia Financiera Territorial
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 880 }}>
                  Vertical especializado para entidades financieras: analiza potencial económico, riesgo territorial, cobertura y programas de crédito sin mezclar la operación electoral.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2 }}>
                  <Chip label={`Territorio: ${territory}`} size="small" variant="outlined" />
                  <Chip label={`Proyecto: ${project}`} size="small" variant="outlined" />
                  <Chip label={`Filtro zona: ${territoryFilterMode === 'manual' ? 'Manual' : 'Auto'}`} size="small" variant="outlined" />
                </Stack>
              </Box>
              <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {financialSegments.map((segment) => (
                    <Chip key={segment} label={segment} size="small" color="primary" variant="outlined" />
                  ))}
                </Stack>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MdShare size={16} />}
                  onClick={openActionsMenu}
                >
                  Compartir y copiar
                </Button>
                <Menu
                  anchorEl={actionsAnchorEl}
                  open={Boolean(actionsAnchorEl)}
                  onClose={closeActionsMenu}
                  keepMounted
                  transitionDuration={{ enter: 220, exit: 180 }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: {
                      sx: {
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                        boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.14)}`
                      }
                    }
                  }}
                >
                  <MenuItem onClick={handleShareUrl}>Compartir</MenuItem>
                  <MenuItem onClick={handleCopyUrl}>Copiar URL con filtros</MenuItem>
                  <MenuItem onClick={handleCopyAsText}>Copiar resumen + URL</MenuItem>
                </Menu>
              </Stack>
            </Stack>
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Cargando resumen financiero territorial...
                </Typography>
              </Stack>
            )}
            {error && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {error}. Se muestran valores base del módulo mientras se restablece la conexión.
              </Alert>
            )}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mt: 1.5 }}>
              <Chip
                size="small"
                color={activeFilterItems.length > 0 ? 'secondary' : 'default'}
                label={`Filtros activos: ${activeFilterItems.length}`}
                variant={activeFilterItems.length > 0 ? 'filled' : 'outlined'}
              />
              {activeFilterItems.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {activeFilterItems.map((item) => (
                    <Tooltip
                      key={item.key}
                      title={item.fullLabel || item.label}
                      arrow
                      enterTouchDelay={0}
                      leaveTouchDelay={2200}
                    >
                      <Chip
                        size="small"
                        label={item.label}
                        variant="outlined"
                        onDelete={() => handleRemoveFilter(item.key)}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              )}
            </Stack>
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="financial-zone-label">Zona</InputLabel>
                  <Select
                    labelId="financial-zone-label"
                    value={filters.zone_id}
                    label="Zona"
                    onChange={(event) => handleFilterChange('zone_id', event.target.value)}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {Array.isArray(availableFilters.zones) && availableFilters.zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="financial-sector-label">Sector</InputLabel>
                  <Select
                    labelId="financial-sector-label"
                    value={filters.sector}
                    label="Sector"
                    onChange={(event) => handleFilterChange('sector', event.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {Array.isArray(availableFilters.sectors) && availableFilters.sectors.map((sector) => (
                      <MenuItem key={sector} value={String(sector).toLowerCase()}>{sector}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Potencial mín."
                  type="number"
                  value={filters.min_credit_potential}
                  onChange={(event) => handleFilterChange('min_credit_potential', event.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Riesgo máx."
                  type="number"
                  value={filters.max_risk_score}
                  onChange={(event) => handleFilterChange('max_risk_score', event.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={handleResetFilters} sx={{ flex: 1 }}>
                    Limpiar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {territory !== 'Nacional' && territoryFilterMode === 'auto' && (
          <Alert severity="info" sx={{ mb: 2.5 }}>
            Se aplica filtro territorial automático para <strong>{territory}</strong> cuando existe coincidencia de zona en el backend.
          </Alert>
        )}

        {territory !== 'Nacional' && territoryFilterMode === 'manual' && (
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            El filtro territorial está en modo manual. Puedes escoger la zona directamente en los filtros sin sobrescritura automática.
          </Alert>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MdBusinessCenter size={22} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Segmentación Financiera</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Clasifica territorios por capacidad económica, informalidad y sectores productivos para diseñar productos de crédito específicos.
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1.2, color: theme.palette.primary.main, fontWeight: 700 }}>
                  Potencial promedio: {Math.round(Number(summary.financial_opportunity_score || 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MdMap size={22} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Mapa de Potencial</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Visualiza actividad económica, densidad poblacional y crecimiento comercial para decidir expansión territorial.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${alpha(theme.palette.warning.main, 0.28)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MdWarning size={22} color={theme.palette.warning.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Mapa de Riesgo</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Detecta morosidad territorial, baja actividad económica y riesgo social para proteger cartera financiera.
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1.2, color: theme.palette.warning.main, fontWeight: 700 }}>
                  Riesgo territorial: {Math.round(Number(summary.territorial_risk_score || 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${alpha(theme.palette.secondary.main, 0.24)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MdAccountBalance size={22} color={theme.palette.secondary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Programas de Crédito</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Seguimiento territorial de créditos, beneficiarios e impacto para banca de desarrollo y cooperativas.
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1.2, color: theme.palette.secondary.main, fontWeight: 700 }}>
                  Créditos estimados: {Number(tracking.active_credits_estimate || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <MdAreaChart size={22} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Oportunidades por Zona</Typography>
                </Stack>
                <Grid container spacing={2}>
                  {opportunityByZone.map((item) => (
                    <Grid item xs={12} md={4} key={item.zone}>
                      <Card variant="outlined" sx={{ borderRadius: 2, borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.zone}</Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.2 }}>
                            Sector dominante: {item.dominantSector}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Potencial de crédito</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={item.creditPotential}
                            sx={{ mt: 0.6, mb: 1.1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Riesgo territorial</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={item.riskScore}
                            color="warning"
                            sx={{ mt: 0.6, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: theme.palette.text.secondary }}>
                            {item.recommendedProduct}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <MdAutoGraph size={22} color={theme.palette.secondary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Índice IADT (MVP)</Typography>
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.secondary.main, lineHeight: 1 }}>
                  {iadtScore}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.5 }}>
                  Índice ÁBACO de Desarrollo Territorial (versión inicial de referencia analítica).
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Beneficiarios estimados: {Number(tracking.beneficiaries_estimate || 0)}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.5 }}>
                  Índice de impacto: {Math.round(Number(tracking.impact_index || 0))}
                </Typography>
                <Divider sx={{ mb: 1.2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.8 }}>
                  Oportunidades de expansión
                </Typography>
                <Stack spacing={1}>
                  {coverageInsights.map((insight) => (
                    <Stack key={insight} direction="row" spacing={1} alignItems="center">
                      <MdTrendingUp size={16} color={theme.palette.success.main} />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{insight}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MdInsights size={22} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Arquitectura de Verticales ÁBACO</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  La plataforma mantiene verticales separados para maximizar foco analítico: Electoral, Gobierno e Inteligencia Financiera Territorial, compartiendo el mismo motor de datos geoespaciales y de decisión.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={feedbackOpen}
        autoHideDuration={1800}
        onClose={() => setFeedbackOpen(false)}
        message={feedbackMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}