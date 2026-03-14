import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Container, Typography, Card, CardContent, Stack, Chip, List, ListItem, ListItemText, alpha, useTheme, Button, Slider, Grid, LinearProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { MdArrowBack } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { useViewContext } from '../context/ViewContext'
import { getModuleActionsByRole, getRoleLabel } from '../config/roleAccess'
import { clearActiveUrbanScenario, getActiveUrbanScenario, saveUrbanScenario } from '../utils/urbanScenarioStorage'
import { fetchDemographicSocialSummary, fetchZonesSecure, resolveZoneIdByTerritory } from '../api'

const verticalContent = {
  'desarrollo-economico-territorial': {
    title: 'Desarrollo Económico Territorial',
    subtitle: 'Observatorio para empleo, empresas y crecimiento regional',
    operationalPath: '/financial-intelligence',
    operationalLabel: 'Módulo operativo: Inteligencia Financiera Territorial',
    problem: 'La brecha entre políticas económicas y realidades territoriales dificulta focalizar incentivos, empleo y productividad local.',
    features: [
      'Mapeo económico por región y sector estratégico.',
      'Indicadores de competitividad y atracción de inversión local.',
      'Análisis de empleo, empresas y tejido productivo.',
      'Escenarios de intervención para desarrollo regional.'
    ]
  },
  'inversion-publica': {
    title: 'Inversión Pública',
    subtitle: 'Priorización y seguimiento de proyectos con impacto',
    operationalPath: '/abaco-gubernamental',
    operationalLabel: 'Módulo operativo: Panel Gubernamental',
    problem: 'La inversión pública suele carecer de trazabilidad territorial y priorización basada en evidencia.',
    features: [
      'Panel de cartera de proyectos por territorio.',
      'Seguimiento de ejecución física y financiera.',
      'Matriz de priorización por impacto social y económico.',
      'Alertas tempranas de riesgo en proyectos estratégicos.'
    ]
  },
  'inclusion-financiera': {
    title: 'Inclusión Financiera',
    subtitle: 'Acceso y uso de servicios financieros para población vulnerable',
    operationalPath: '/financial-intelligence',
    operationalLabel: 'Módulo operativo: Inteligencia Financiera Territorial',
    problem: 'Persisten zonas con baja bancarización y limitada oferta de crédito productivo.',
    features: [
      'Mapa de cobertura de servicios financieros por territorio.',
      'Segmentación de población excluida del sistema financiero.',
      'Monitoreo de acceso a crédito, ahorro y medios de pago.',
      'Diseño de estrategias para inclusión financiera focalizada.'
    ]
  },
  'cooperacion-desarrollo': {
    title: 'Cooperación y Desarrollo',
    subtitle: 'Gestión territorial de cooperación internacional',
    operationalPath: '/abaco-gubernamental',
    operationalLabel: 'Módulo operativo: Panel Gubernamental',
    problem: 'La cooperación se dispersa sin coordinación efectiva ni alineación con prioridades territoriales.',
    features: [
      'Inventario territorial de proyectos de cooperación.',
      'Identificación de donantes y líneas de financiamiento.',
      'Alineación entre agendas locales y objetivos de desarrollo.',
      'Trazabilidad de impacto de iniciativas de cooperación.'
    ]
  },
  'ambiental-cambio-climatico': {
    title: 'Ambiental y Cambio Climático',
    subtitle: 'Riesgos, adaptación y sostenibilidad territorial',
    operationalPath: '/georeference',
    operationalLabel: 'Módulo operativo: Georreferencia',
    problem: 'Los territorios enfrentan presiones ambientales crecientes sin sistemas integrados de información para decisiones climáticas.',
    features: [
      'Monitoreo de riesgos ambientales y vulnerabilidad climática.',
      'Evaluación territorial de emisiones y transición sostenible.',
      'Priorización de medidas de adaptación y resiliencia.',
      'Indicadores para seguimiento de políticas ambientales.'
    ]
  },
  'seguridad-gobernanza-territorial': {
    title: 'Seguridad y Gobernanza Territorial',
    subtitle: 'Gestión de riesgo, seguridad y capacidad institucional',
    operationalPath: '/strategic-intelligence',
    operationalLabel: 'Módulo operativo: Inteligencia Estratégica',
    problem: 'La fragmentación institucional limita la prevención de riesgos y la coordinación para seguridad territorial.',
    features: [
      'Mapa de riesgos territoriales y conflictividad.',
      'Indicadores de capacidad institucional y gobernanza.',
      'Seguimiento de seguridad ciudadana por región.',
      'Escenarios de respuesta y coordinación interinstitucional.'
    ]
  },
  'infraestructura-conectividad': {
    title: 'Infraestructura y Conectividad',
    subtitle: 'Brechas de acceso, movilidad y servicios esenciales',
    operationalPath: '/abaco-gubernamental',
    operationalLabel: 'Módulo operativo: Panel Gubernamental',
    problem: 'Las brechas de infraestructura limitan desarrollo productivo, integración regional y calidad de vida.',
    features: [
      'Diagnóstico territorial de brechas de infraestructura.',
      'Análisis de conectividad vial, digital y logística.',
      'Priorización de intervenciones por impacto social y económico.',
      'Monitoreo de cobertura y calidad de servicios públicos.'
    ]
  },
  'inteligencia-demografica-social': {
    title: 'Inteligencia Demográfica y Social',
    subtitle: 'Estructura poblacional y dinámicas sociales para decisiones territoriales',
    operationalPath: '/abaco-bi-integrador',
    operationalLabel: 'Módulo operativo: BI Integrador',
    problem: 'Muchas decisiones de política pública, desarrollo económico e inclusión financiera se toman sin lectura demográfica del territorio, lo que reduce impacto y precisión en la focalización de servicios.',
    features: [
      'Mapa de distribución poblacional con densidad, crecimiento, migración interna y urbanización.',
      'Análisis de estructura demográfica por edad, composición de hogares, educación y empleo.',
      'Proyección de crecimiento poblacional para demanda futura de servicios públicos.',
      'Identificación de territorios vulnerables por pobreza, desempleo, baja escolaridad y exclusión social.'
    ]
  },
  'ordenamiento-territorial-planeacion-urbana': {
    title: 'Inteligencia de Ordenamiento Territorial y Planeación Urbana',
    subtitle: 'Uso del suelo, expansión urbana y planificación territorial sostenible',
    operationalPath: '/georeference',
    operationalLabel: 'Módulo operativo: Georreferencia',
    problem: 'Muchos territorios enfrentan crecimiento urbano desordenado, expansión informal, déficit de vivienda y conflictos entre desarrollo económico y planificación del suelo sin análisis territorial integrado.',
    features: [
      'Mapa de uso del suelo para zonas urbanas, rurales, industriales, agrícolas y de conservación.',
      'Análisis de expansión urbana para identificar crecimiento reciente y urbanización informal o irregular.',
      'Identificación de déficit urbano en vivienda, servicios públicos, transporte y equipamientos.',
      'Simulación de escenarios para decidir dónde expandir ciudad, proteger ecosistemas o priorizar proyectos urbanos.'
    ]
  }
}

export default function AbacoVerticalDetailPage() {
    React.useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
  const theme = useTheme()
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user, token } = useAuth()
  const { territory, project, territoryFilterMode } = useViewContext()
  const content = verticalContent[slug]
  const roleActions = getModuleActionsByRole(user?.role, slug, { territory, project })
  const roleLabel = getRoleLabel(user?.role)
  const [urbanExpansion, setUrbanExpansion] = useState(55)
  const [ecosystemProtection, setEcosystemProtection] = useState(50)
  const [housingDeficit, setHousingDeficit] = useState(62)
  const [youngPopulation, setYoungPopulation] = useState(26)
  const [agingPopulation, setAgingPopulation] = useState(13)
  const [povertyLevel, setPovertyLevel] = useState(28)
  const [unemploymentLevel, setUnemploymentLevel] = useState(12)
  const [urbanizationLevel, setUrbanizationLevel] = useState(66)
  const [internalMigration, setInternalMigration] = useState(7)
  const [scenarioSavedMessage, setScenarioSavedMessage] = useState('')
  const [demographicLoading, setDemographicLoading] = useState(false)
  const [demographicError, setDemographicError] = useState('')
  const [demographicData, setDemographicData] = useState(null)
  const [demographicZoneFilter, setDemographicZoneFilter] = useState('auto')
  const [demographicLimit, setDemographicLimit] = useState(8)
  const [zoneOptions, setZoneOptions] = useState([])
  const demographicCacheRef = useRef(new Map())

  const urbanScenario = useMemo(() => {
    const pressureIndex = Math.round((urbanExpansion * 0.45) + (housingDeficit * 0.4) - (ecosystemProtection * 0.25))
    const sustainabilityIndex = Math.max(0, Math.min(100, Math.round((ecosystemProtection * 0.6) + ((100 - urbanExpansion) * 0.2) + ((100 - housingDeficit) * 0.2))))

    let recommendation = 'Mantener balance entre expansión urbana y conservación.'
    if (pressureIndex >= 70) {
      recommendation = 'Priorizar equipamientos urbanos y control de expansión informal en suelo de alto riesgo.'
    } else if (sustainabilityIndex >= 70) {
      recommendation = 'Escenario favorable para consolidar proyectos urbanos sostenibles y corredores verdes.'
    } else if (housingDeficit >= 70) {
      recommendation = 'Acelerar suelo para vivienda y servicios básicos en zonas de mayor déficit.'
    }

    return { pressureIndex, sustainabilityIndex, recommendation }
  }, [urbanExpansion, ecosystemProtection, housingDeficit])

  const handleSaveScenario = (slot) => {
    try {
      const saved = saveUrbanScenario({
        slot,
        territory,
        project,
        values: { urbanExpansion, ecosystemProtection, housingDeficit },
        indices: {
          pressureIndex: urbanScenario.pressureIndex,
          sustainabilityIndex: urbanScenario.sustainabilityIndex
        },
        recommendation: urbanScenario.recommendation,
        userRole: user?.role
      })
      setScenarioSavedMessage(`Escenario ${saved.slot} guardado (${territory} · ${project})`)
    } catch {
      setScenarioSavedMessage('No se pudo guardar el escenario')
    }
  }

  const handleRevertAppliedScenario = () => {
    clearActiveUrbanScenario()
    setUrbanExpansion(55)
    setEcosystemProtection(50)
    setHousingDeficit(62)
    setScenarioSavedMessage('Escenario activo revertido. Valores base restaurados.')
  }

  const demographicScenario = useMemo(() => {
    const activePopulation = Math.max(1, 100 - (youngPopulation + agingPopulation))
    const dependencyRatio = Math.round(((youngPopulation + agingPopulation) / activePopulation) * 100)
    const socialVulnerability = Math.round((povertyLevel * 0.5) + (unemploymentLevel * 0.35) + ((100 - youngPopulation) * 0.15))
    const serviceDemandPressure = Math.round((urbanizationLevel * 0.5) + (internalMigration * 0.3) + (youngPopulation * 0.2))
    const projectedGrowth = Math.max(-3, Math.min(9, Number(((internalMigration * 0.45) + (youngPopulation * 0.12) - (agingPopulation * 0.09) + (urbanizationLevel * 0.04)).toFixed(1))))

    const alerts = []
    if (agingPopulation >= 20) alerts.push('Territorio con envejecimiento acelerado: priorizar salud y cuidado de larga duración.')
    if (socialVulnerability >= 55) alerts.push('Alta vulnerabilidad social: focalizar programas de empleo, educación y protección social.')
    if (serviceDemandPressure >= 65) alerts.push('Demanda creciente de servicios: planificar expansión de infraestructura urbana y equipamientos.')
    if (!alerts.length) alerts.push('Escenario demográfico estable: fortalecer monitoreo preventivo y planificación de mediano plazo.')

    return {
      dependencyRatio,
      socialVulnerability,
      serviceDemandPressure,
      projectedGrowth,
      alerts
    }
  }, [youngPopulation, agingPopulation, povertyLevel, unemploymentLevel, urbanizationLevel, internalMigration])

  useEffect(() => {
    if (slug !== 'ordenamiento-territorial-planeacion-urbana') return

    const activeScenario = getActiveUrbanScenario(territory, project)
    if (!activeScenario) return

    setUrbanExpansion(Number(activeScenario?.values?.urbanExpansion || 55))
    setEcosystemProtection(Number(activeScenario?.values?.ecosystemProtection || 50))
    setHousingDeficit(Number(activeScenario?.values?.housingDeficit || 62))
    setScenarioSavedMessage(`Escenario ${activeScenario.slot} aplicado desde BI (${territory} · ${project})`)
  }, [slug, territory, project])

  useEffect(() => {
    let active = true

    const loadDemographic = async () => {
      if (slug !== 'inteligencia-demografica-social') return
      if (!token) {
        if (active) {
          setDemographicLoading(false)
          setDemographicError('No hay sesión activa para consultar datos demográficos.')
        }
        return
      }

      setDemographicLoading(true)
      setDemographicError('')

      try {
        let resolvedZoneId = null
        if (demographicZoneFilter === 'auto') {
          const shouldResolveZone = territoryFilterMode !== 'manual' && String(territory || '').toLowerCase() !== 'nacional'
          resolvedZoneId = shouldResolveZone ? await resolveZoneIdByTerritory(token, territory) : null
        } else if (demographicZoneFilter !== 'all') {
          resolvedZoneId = Number(demographicZoneFilter)
        }

        const cacheKey = `${territory}|${project}|${territoryFilterMode}|${demographicZoneFilter}|${demographicLimit}|${resolvedZoneId || 'all'}`
        const cached = demographicCacheRef.current.get(cacheKey)
        const cacheTtlMs = 1000 * 60 * 2
        if (cached && (Date.now() - cached.timestamp) < cacheTtlMs) {
          if (active) {
            setDemographicData(cached.payload)
            setDemographicLoading(false)
          }
          return
        }

        const response = await fetchDemographicSocialSummary(token, {
          limit: demographicLimit,
          ...(resolvedZoneId ? { zone_id: resolvedZoneId } : {})
        })
        if (!active) return
        demographicCacheRef.current.set(cacheKey, { payload: response, timestamp: Date.now() })
        setDemographicData(response)
      } catch (error) {
        if (!active) return
        setDemographicError(String(error?.message || 'No se pudo cargar la lectura demográfica-social'))
      } finally {
        if (active) setDemographicLoading(false)
      }
    }

    loadDemographic()

    return () => {
      active = false
    }
  }, [slug, token, territory, project, territoryFilterMode, demographicZoneFilter, demographicLimit])

  useEffect(() => {
    let active = true

    const loadZones = async () => {
      if (slug !== 'inteligencia-demografica-social') return
      if (!token) return

      try {
        const response = await fetchZonesSecure(token, { page: 1, limit: 300, sortBy: 'name', order: 'ASC' })
        if (!active) return
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.zones)
            ? response.zones
            : []

        const mapped = rows.map((item) => ({
          id: Number(item?.id || item?.zone_id || 0),
          name: String(item?.name || item?.zone_name || item?.nombre || '')
        })).filter((item) => item.id > 0 && item.name)

        setZoneOptions(mapped)
      } catch {
        if (active) setZoneOptions([])
      }
    }

    loadZones()

    return () => {
      active = false
    }
  }, [slug, token])

  const exportDemographicCsv = () => {
    if (!Array.isArray(demographicData?.territories) || !demographicData.territories.length) return

    const rows = demographicData.territories.map((item) => ({
      zone_id: item.zone_id,
      zone_name: item.zone_name,
      population_proxy: item.population_proxy,
      growth_rate: item.growth_rate,
      migration_index: item.migration_index,
      urbanization_rate: item.urbanization_rate,
      youth_share: item?.demographic_structure?.youth_share,
      aging_share: item?.demographic_structure?.aging_share,
      dependency_ratio: item?.demographic_structure?.dependency_ratio,
      schooling_level: item?.social_structure?.schooling_level,
      unemployment_rate: item?.social_structure?.unemployment_rate,
      poverty_rate: item?.social_structure?.poverty_rate,
      vulnerability_index: item?.vulnerability_index,
      service_demand_index: item?.service_demand_index
    }))

    const headers = Object.keys(rows[0] || {})
    const escapeCsv = (value) => {
      const text = String(value ?? '')
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }

    const csvLines = [headers.join(',')]
    rows.forEach((row) => {
      csvLines.push(headers.map((header) => escapeCsv(row[header])).join(','))
    })

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `demografia_social_${territory}_${project}_${Date.now()}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  if (!content) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Vertical no encontrado</Typography>
            <Button variant="contained" onClick={() => navigate('/abaco-verticales')}>Volver al panel</Button>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Button startIcon={<MdArrowBack />} variant="text" onClick={() => navigate('/abaco-verticales')} sx={{ mb: 2 }}>
          Panel de Verticales
        </Button>

        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            background: `linear-gradient(140deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(theme.palette.secondary.main, 0.07)} 100%)`
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Vertical ÁBACO" color="primary" />
              <Chip label="Enfoque territorial" variant="outlined" />
              <Chip label={`Vista ${roleLabel}`} color="secondary" variant="outlined" />
              <Chip label={`Territorio: ${territory}`} variant="outlined" />
              <Chip label={`Proyecto: ${project}`} variant="outlined" />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
              {content.title}
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              {content.subtitle}
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.8 }}>
              Problema que resuelve
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              {content.problem}
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.8 }}>
              Funcionalidades clave
            </Typography>
            <List dense sx={{ p: 0 }}>
              {content.features.map((feature) => (
                <ListItem key={feature} sx={{ px: 0 }}>
                  <ListItemText primary={feature} primaryTypographyProps={{ color: theme.palette.text.secondary }} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.8, mt: 1 }}>
              Acciones disponibles en tu vista
            </Typography>
            <List dense sx={{ p: 0 }}>
              {roleActions.map((action) => (
                <ListItem key={action} sx={{ px: 0 }}>
                  <ListItemText primary={action} primaryTypographyProps={{ color: theme.palette.text.secondary }} />
                </ListItem>
              ))}
            </List>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => navigate(content.operationalPath)}>
                {content.operationalLabel}
              </Button>
              <Button variant="contained" onClick={() => navigate('/abaco-bi-integrador')}>
                Ver BI Integrador
              </Button>
            </Stack>

            {slug === 'ordenamiento-territorial-planeacion-urbana' && (
              <Card sx={{ mt: 2.2, borderRadius: 2.2, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.6 }}>
                    Simulación de escenarios urbanos
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.5 }}>
                    Ajusta variables clave para explorar escenarios de expansión, conservación y déficit urbano antes de decidir intervenciones.
                  </Typography>

                  <Grid container spacing={1.8}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Expansión urbana: {urbanExpansion}
                      </Typography>
                      <Slider size="small" value={urbanExpansion} min={0} max={100} onChange={(_, value) => setUrbanExpansion(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Protección ecosistémica: {ecosystemProtection}
                      </Typography>
                      <Slider size="small" value={ecosystemProtection} min={0} max={100} onChange={(_, value) => setEcosystemProtection(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Déficit urbano: {housingDeficit}
                      </Typography>
                      <Slider size="small" value={housingDeficit} min={0} max={100} onChange={(_, value) => setHousingDeficit(Number(value))} />
                    </Grid>
                  </Grid>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2 }}>
                    <Chip label={`Presión territorial: ${urbanScenario.pressureIndex}`} color={urbanScenario.pressureIndex >= 70 ? 'warning' : 'default'} variant="outlined" />
                    <Chip label={`Índice sostenibilidad: ${urbanScenario.sustainabilityIndex}`} color={urbanScenario.sustainabilityIndex >= 70 ? 'success' : 'default'} variant="outlined" />
                  </Stack>

                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1.2 }}>
                    {urbanScenario.recommendation}
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.4 }}>
                    <Button size="small" variant="outlined" onClick={() => handleSaveScenario('A')}>Guardar escenario A</Button>
                    <Button size="small" variant="outlined" onClick={() => handleSaveScenario('B')}>Guardar escenario B</Button>
                    <Button size="small" variant="outlined" onClick={() => handleSaveScenario('C')}>Guardar escenario C</Button>
                    <Button size="small" variant="outlined" color="warning" onClick={handleRevertAppliedScenario}>Revertir escenario aplicado</Button>
                  </Stack>

                  {scenarioSavedMessage && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: theme.palette.success.main, fontWeight: 600 }}>
                      {scenarioSavedMessage}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {slug === 'inteligencia-demografica-social' && (
              <Card sx={{ mt: 2.2, borderRadius: 2.2, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.6 }}>
                    Simulador demográfico y social
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.5 }}>
                    Ajusta variables poblacionales y sociales para evaluar presión de demanda, vulnerabilidad territorial y proyección de crecimiento.
                  </Typography>

                  <Grid container spacing={1.2} sx={{ mb: 1.2 }}>
                    <Grid item xs={12} md={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="demography-zone-filter-label">Zona</InputLabel>
                        <Select
                          labelId="demography-zone-filter-label"
                          value={demographicZoneFilter}
                          label="Zona"
                          onChange={(event) => setDemographicZoneFilter(String(event.target.value))}
                        >
                          <MenuItem value="auto">Automática por territorio</MenuItem>
                          <MenuItem value="all">Todas las zonas</MenuItem>
                          {zoneOptions.map((item) => (
                            <MenuItem key={`zone-${item.id}`} value={String(item.id)}>{item.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="demography-limit-filter-label">Límite</InputLabel>
                        <Select
                          labelId="demography-limit-filter-label"
                          value={demographicLimit}
                          label="Límite"
                          onChange={(event) => setDemographicLimit(Number(event.target.value))}
                        >
                          {[5, 8, 10, 15, 20, 30].map((value) => (
                            <MenuItem key={`limit-${value}`} value={value}>{value}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        size="medium"
                        variant="outlined"
                        onClick={exportDemographicCsv}
                        disabled={!Array.isArray(demographicData?.territories) || !demographicData.territories.length}
                      >
                        Exportar reporte CSV
                      </Button>
                    </Grid>
                  </Grid>

                  {demographicLoading && (
                    <Box sx={{ mb: 1.4 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Cargando datos reales demográficos...
                      </Typography>
                      <LinearProgress sx={{ mt: 0.6 }} />
                    </Box>
                  )}

                  {demographicError && (
                    <Alert severity="warning" sx={{ mb: 1.4 }}>
                      {demographicError}
                    </Alert>
                  )}

                  {!demographicLoading && !demographicError && demographicData?.summary && (
                    <>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
                        <Chip label={`Territorios analizados: ${demographicData.summary.territories_analyzed ?? 0}`} variant="outlined" />
                        <Chip label={`Población proxy: ${demographicData.summary.total_population_proxy ?? 0}`} variant="outlined" />
                        <Chip label={`Vulnerabilidad promedio: ${demographicData.summary.average_vulnerability_index ?? 0}`} color="warning" variant="outlined" />
                        <Chip label={`Demanda futura: ${demographicData.summary.average_service_demand_index ?? 0}`} color="info" variant="outlined" />
                      </Stack>

                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.2 }}>
                        Proyección a 3 años: <strong>{demographicData?.projections?.three_year_population_growth ?? 0}%</strong> ·
                        crecimiento de demanda de servicios: <strong>{demographicData?.projections?.service_demand_growth ?? 0}%</strong>.
                      </Typography>

                      {Array.isArray(demographicData?.vulnerable_territories) && demographicData.vulnerable_territories.length > 0 && (
                        <>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.4 }}>
                            Territorios vulnerables detectados
                          </Typography>
                          <List dense sx={{ p: 0, mb: 1.2 }}>
                            {demographicData.vulnerable_territories.slice(0, 3).map((item) => (
                              <ListItem key={`${item.zone_id}-${item.zone_name}`} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={`${item.zone_name} · índice ${item.vulnerability_index}`}
                                  secondary={item.priority_reason}
                                  primaryTypographyProps={{ color: theme.palette.text.primary }}
                                  secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </>
                      )}
                    </>
                  )}

                  <Grid container spacing={1.8}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Población joven: {youngPopulation}%
                      </Typography>
                      <Slider size="small" value={youngPopulation} min={10} max={45} onChange={(_, value) => setYoungPopulation(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Población envejecida: {agingPopulation}%
                      </Typography>
                      <Slider size="small" value={agingPopulation} min={4} max={35} onChange={(_, value) => setAgingPopulation(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Nivel de pobreza: {povertyLevel}%
                      </Typography>
                      <Slider size="small" value={povertyLevel} min={5} max={70} onChange={(_, value) => setPovertyLevel(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Desempleo: {unemploymentLevel}%
                      </Typography>
                      <Slider size="small" value={unemploymentLevel} min={2} max={35} onChange={(_, value) => setUnemploymentLevel(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Urbanización: {urbanizationLevel}%
                      </Typography>
                      <Slider size="small" value={urbanizationLevel} min={30} max={95} onChange={(_, value) => setUrbanizationLevel(Number(value))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Migración interna neta: {internalMigration}%
                      </Typography>
                      <Slider size="small" value={internalMigration} min={-5} max={25} onChange={(_, value) => setInternalMigration(Number(value))} />
                    </Grid>
                  </Grid>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={`Dependencia demográfica: ${demographicScenario.dependencyRatio}`} color={demographicScenario.dependencyRatio >= 70 ? 'warning' : 'default'} variant="outlined" />
                    <Chip label={`Vulnerabilidad social: ${demographicScenario.socialVulnerability}`} color={demographicScenario.socialVulnerability >= 55 ? 'error' : 'default'} variant="outlined" />
                    <Chip label={`Presión de servicios: ${demographicScenario.serviceDemandPressure}`} color={demographicScenario.serviceDemandPressure >= 65 ? 'warning' : 'default'} variant="outlined" />
                    <Chip label={`Proyección anual: ${demographicScenario.projectedGrowth}%`} color={demographicScenario.projectedGrowth >= 2 ? 'success' : 'default'} variant="outlined" />
                  </Stack>

                  <Typography variant="subtitle2" sx={{ mt: 1.2, fontWeight: 700 }}>
                    Territorios potencialmente vulnerables
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {demographicScenario.alerts.map((item) => (
                      <ListItem key={item} sx={{ px: 0 }}>
                        <ListItemText primary={item} primaryTypographyProps={{ color: theme.palette.text.secondary }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
