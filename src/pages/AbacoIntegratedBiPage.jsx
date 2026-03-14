import React, { useEffect, useMemo, useState } from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Stack, Chip, Button, alpha, useTheme, LinearProgress, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MdAutoGraph, MdArrowForward, MdHub, MdHowToVote, MdCorporateFare, MdAccountBalance, MdPublic, MdForest, MdShield, MdGroups } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { useViewContext } from '../context/ViewContext'
import { fetchIntegratedVerticalsBI } from '../api'
import { getRoleLabel, canByCapability } from '../config/roleAccess'
import { clearActiveUrbanScenario, getUrbanScenariosForContext, setActiveUrbanScenario } from '../utils/urbanScenarioStorage'

const moduleMap = [
  { family: 'Gobierno y Política', name: 'Inteligencia Electoral', path: '/abaco-electoral', icon: <MdHowToVote size={16} /> },
  { family: 'Gobierno y Política', name: 'Inteligencia Territorial Pública', path: '/abaco-gubernamental', icon: <MdCorporateFare size={16} /> },
  { family: 'Economía y Finanzas', name: 'Inteligencia Financiera Territorial', path: '/financial-intelligence', icon: <MdAccountBalance size={16} /> },
  { family: 'Economía y Finanzas', name: 'Inclusión Financiera', path: '/abaco-verticales/inclusion-financiera', icon: <MdAccountBalance size={16} /> },
  { family: 'Economía y Finanzas', name: 'Desarrollo Económico Territorial', path: '/abaco-verticales/desarrollo-economico-territorial', icon: <MdAutoGraph size={16} /> },
  { family: 'Demografía y Sociedad', name: 'Inteligencia Demográfica y Social', path: '/abaco-verticales/inteligencia-demografica-social', icon: <MdGroups size={16} /> },
  { family: 'Planeación y Desarrollo', name: 'Algoritmos Operativos Territoriales', path: '/operational-algorithms', icon: <MdAutoGraph size={16} /> },
  { family: 'Planeación y Desarrollo', name: 'Inversión Pública', path: '/abaco-verticales/inversion-publica', icon: <MdHub size={16} /> },
  { family: 'Planeación y Desarrollo', name: 'Infraestructura y Conectividad', path: '/abaco-verticales/infraestructura-conectividad', icon: <MdHub size={16} /> },
  { family: 'Planeación y Desarrollo', name: 'Ordenamiento Territorial y Planeación Urbana', path: '/abaco-verticales/ordenamiento-territorial-planeacion-urbana', icon: <MdHub size={16} /> },
  { family: 'Desarrollo Internacional', name: 'Cooperación y Desarrollo', path: '/abaco-verticales/cooperacion-desarrollo', icon: <MdPublic size={16} /> },
  { family: 'Sostenibilidad', name: 'Inteligencia Ambiental', path: '/abaco-verticales/ambiental-cambio-climatico', icon: <MdForest size={16} /> },
  { family: 'Gobernanza', name: 'Seguridad y Riesgo Territorial', path: '/abaco-verticales/seguridad-gobernanza-territorial', icon: <MdShield size={16} /> },
]

export default function AbacoIntegratedBiPage() {
    React.useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
  const theme = useTheme()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { territory, project, territoryFilterMode } = useViewContext()
  const roleLabel = getRoleLabel(user?.role)
  const canManageUsers = canByCapability(user?.role, 'manage_users')
  const canUploadData = canByCapability(user?.role, 'upload_datasets')
  const canCreateModels = canByCapability(user?.role, 'create_models')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snapshot, setSnapshot] = useState(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!token) {
        if (active) {
          setLoading(false)
          setError('No hay sesión activa para cargar el BI Integrador.')
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await fetchIntegratedVerticalsBI(token, { territory, project, territoryFilterMode })
        if (!active) return
        setSnapshot(response)
      } catch (loadError) {
        if (!active) return
        setError(String(loadError?.message || 'No se pudo cargar el BI Integrador'))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [token, territory, project, territoryFilterMode])

  const familySummary = useMemo(() => {
    const index = new Map()
    moduleMap.forEach((item) => {
      if (!index.has(item.family)) index.set(item.family, 0)
      index.set(item.family, index.get(item.family) + 1)
    })
    return Array.from(index.entries()).map(([family, count]) => ({ family, count }))
  }, [])

  const urbanScenarios = useMemo(() => getUrbanScenariosForContext(territory, project), [territory, project])
  const bestUrbanScenario = useMemo(() => {
    if (!urbanScenarios.length) return null
    return [...urbanScenarios].sort((a, b) => {
      const scoreA = Number(a?.indices?.sustainabilityIndex || 0) - Number(a?.indices?.pressureIndex || 0)
      const scoreB = Number(b?.indices?.sustainabilityIndex || 0) - Number(b?.indices?.pressureIndex || 0)
      return scoreB - scoreA
    })[0]
  }, [urbanScenarios])

  const demographicSocialPulse = useMemo(() => {
    const governance = Number(snapshot?.governance_index || 0)
    const coverage = Number(snapshot?.signals?.geo_coverage_percent || 0)
    const scenarios = Number(snapshot?.signals?.scenarios_count || 0)
    const vulnerability = Number(snapshot?.signals?.demographic_vulnerability_index || 0)
    const pulse = Math.round((governance * 0.45) + (coverage * 0.25) + ((100 - vulnerability) * 0.2) + Math.min(10, scenarios * 1.0))
    return Math.max(0, Math.min(100, pulse))
  }, [snapshot])

  const applyBestScenario = () => {
    if (!bestUrbanScenario) return

    setActiveUrbanScenario({
      slot: bestUrbanScenario.slot,
      territory,
      project
    })

    const minCreditPotential = Math.max(20, Number(bestUrbanScenario?.indices?.sustainabilityIndex || 0) - 10)
    const maxRiskScore = Math.max(20, Math.min(95, 90 - Number(bestUrbanScenario?.indices?.pressureIndex || 0)))

    const params = new URLSearchParams({
      min_credit_potential: String(minCreditPotential),
      max_risk_score: String(maxRiskScore)
    })

    if (snapshot?.context?.zone_id) {
      params.set('zone_id', String(snapshot.context.zone_id))
    }

    navigate(`/financial-intelligence?${params.toString()}`)
  }

  const revertAppliedScenario = () => {
    clearActiveUrbanScenario()
    navigate('/financial-intelligence')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
          }}
        >
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
              <Chip label="BI Integrador" color="primary" />
              <Chip label="Orquestación multi-vertical" variant="outlined" />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
              Resumen Unificado de Verticales ÁBACO
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 980 }}>
              Este módulo integra señales de Gobierno y Política, Economía y Finanzas, Planeación y Desarrollo, Desarrollo Internacional, Sostenibilidad y Gobernanza en una sola lectura ejecutiva tipo BI.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2 }}>
              <Chip label={`Vista actual: ${roleLabel}`} color="secondary" variant="outlined" />
              <Chip label={`Territorio: ${territory}`} variant="outlined" />
              <Chip label={`Proyecto: ${project}`} variant="outlined" />
              <Chip label={`Filtro zona: ${territoryFilterMode === 'manual' ? 'Manual' : 'Auto'}`} variant="outlined" />
              <Chip label={`Gestión de usuarios: ${canManageUsers ? 'Sí' : 'No'}`} variant="outlined" />
              <Chip label={`Subida de datos: ${canUploadData ? 'Sí' : 'No'}`} variant="outlined" />
              <Chip label={`Modelos predictivos: ${canCreateModels ? 'Sí' : 'No'}`} variant="outlined" />
              <Chip
                label={snapshot?.context?.scoped ? `Filtrado real por zona #${snapshot?.context?.zone_id}` : 'Vista agregada nacional'}
                color={snapshot?.context?.scoped ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>
          </CardContent>
        </Card>

        {loading && (
          <Card sx={{ mb: 2.5, borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                Sincronizando módulos verticales...
              </Typography>
              <LinearProgress />
            </CardContent>
          </Card>
        )}

        {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

        <Grid container spacing={2.2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Score de orquestación</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {snapshot?.score ?? 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Índice compuesto entre disponibilidad de módulos y señales operativas integradas.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Índice de gobernanza</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {snapshot?.governance_index ?? 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Mezcla de decisión territorial, inteligencia financiera y cobertura geoespacial.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Cobertura geo sincronizada</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {snapshot?.signals?.geo_coverage_percent ?? 0}%
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Nivel de cobertura territorial sincronizada para análisis transversal.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
              <CardContent>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Pulso demográfico-social</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {demographicSocialPulse}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Señal integrada de capa poblacional para priorización territorial de servicios y política pública.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.2 }}>
                  Familias verticales conectadas
                </Typography>
                <Stack spacing={1}>
                  {familySummary.map((item) => (
                    <Stack key={item.family} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{item.family}</Typography>
                      <Chip label={`${item.count} módulos`} size="small" variant="outlined" />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}`, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.2 }}>
                  Señales del núcleo analítico
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Escenarios estratégicos: <strong>{snapshot?.signals?.scenarios_count ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Score promedio de decisión: <strong>{snapshot?.signals?.avg_decision_score ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    IADT financiero: <strong>{snapshot?.signals?.financial_iadt_score ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Zonas financieras monitorizadas: <strong>{snapshot?.signals?.financial_zones ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Vulnerabilidad demográfica-social: <strong>{snapshot?.signals?.demographic_vulnerability_index ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Demanda futura de servicios: <strong>{snapshot?.signals?.demographic_service_demand_index ?? 0}</strong>
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 2.2, borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.2 }}>
              Comparador de escenarios urbanos (A/B/C)
            </Typography>

            {!urbanScenarios.length && (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                No hay escenarios guardados para este contexto. Crea y guarda A/B/C desde el módulo de Ordenamiento Territorial y Planeación Urbana.
              </Typography>
            )}

            {urbanScenarios.length > 0 && (
              <>
                <Grid container spacing={1.2}>
                  {urbanScenarios.map((item) => (
                    <Grid item xs={12} md={4} key={item.slot}>
                      <Card variant="outlined" sx={{ borderColor: alpha(theme.palette.primary.main, 0.2), height: '100%' }}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Escenario {item.slot}</Typography>
                            {bestUrbanScenario?.slot === item.slot && <Chip size="small" label="Sugerido" color="success" />}
                          </Stack>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Presión territorial: <strong>{item.indices?.pressureIndex ?? 0}</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Sostenibilidad: <strong>{item.indices?.sustainabilityIndex ?? 0}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: theme.palette.text.secondary }}>
                            {item.recommendation}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Typography variant="body2" sx={{ mt: 1.2, color: theme.palette.text.secondary }}>
                  Recomendación BI: priorizar escenario {bestUrbanScenario?.slot || '-'} para {territory} · {project}.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.2 }}>
                  <Button size="small" variant="contained" onClick={applyBestScenario}>
                    Aplicar escenario sugerido
                  </Button>
                  <Button size="small" variant="outlined" color="warning" onClick={revertAppliedScenario}>
                    Revertir aplicación
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/abaco-verticales/ordenamiento-territorial-planeacion-urbana')}
                  >
                    Abrir simulador urbano
                  </Button>
                </Stack>
              </>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mt: 2.2, borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.13)}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.2 }}>
              Mapa operativo por módulo
            </Typography>
            <Grid container spacing={1.2}>
              {moduleMap.map((item) => (
                <Grid item xs={12} md={6} lg={4} key={`${item.family}-${item.name}`}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={item.icon}
                    endIcon={<MdArrowForward size={15} />}
                    onClick={() => navigate(item.path)}
                    sx={{ justifyContent: 'space-between', borderColor: alpha(theme.palette.primary.main, 0.25), color: theme.palette.primary.main }}
                  >
                    {item.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
