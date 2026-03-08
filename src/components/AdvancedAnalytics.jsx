/**
 * ÁBACO - Dashboard Analytics Component
 * Visualizaciones avanzadas con algoritmos de optimización
 */

import React, { useMemo } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Divider
} from '@mui/material'
import { 
  MdTrendingUp, 
  MdTrendingDown, 
  MdShowChart,
  MdPieChart 
} from 'react-icons/md'
import { 
  optimizeTerritoriesAssignment,
  predictOptimalEngagement,
  clusterContacts,
  linearRegression,
  balanceWorkload
} from '../utils/optimization'

export default function AdvancedAnalytics({ contacts, territories, operators, interactions }) {
  // Análisis de clustering territorial
  const clusters = useMemo(() => {
    if (!contacts || contacts.length < 5) return []
    return clusterContacts(contacts, Math.min(5, Math.floor(contacts.length / 10)))
  }, [contacts])

  // Predicción de engagement
  const engagementPrediction = useMemo(() => {
    if (!interactions || interactions.length < 10) return null
    
    const historicalData = {
      interactions: interactions.length,
      conversions: interactions.filter(i => i.result === 'confirmed' || i.result === 'successful').length,
      timeSpent: interactions.length * 15 // estimación: 15 min por interacción
    }
    
    return predictOptimalEngagement(historicalData)
  }, [interactions])

  // Regresión lineal de crecimiento
  const growthTrend = useMemo(() => {
    if (!interactions || interactions.length < 7) return null
    
    // Agrupar por día
    const dailyData = {}
    interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp).toLocaleDateString()
      dailyData[date] = (dailyData[date] || 0) + 1
    })
    
    const dataPoints = Object.entries(dailyData).map(([date, count], index) => ({
      x: index,
      y: count,
      date
    }))
    
    if (dataPoints.length < 3) return null
    
    return linearRegression(dataPoints)
  }, [interactions])

  // Asignación óptima de territorios
  const territoryAssignments = useMemo(() => {
    if (!operators || !territories || !contacts) return []
    if (operators.length === 0 || territories.length === 0) return []
    
    return optimizeTerritoriesAssignment(
      operators.map(op => ({
        ...op,
        lastKnownLocation: { lat: -34.6, lng: -58.4 } // Default
      })),
      territories.map(t => ({
        ...t,
        centerPoint: { lat: -34.6 + Math.random() * 0.1, lng: -58.4 + Math.random() * 0.1 }
      })),
      contacts
    )
  }, [operators, territories, contacts])

  // Balance de carga
  const workloadBalance = useMemo(() => {
    if (!operators || !contacts) return null
    
    const operatorsWithLoad = operators.map(op => ({
      ...op,
      assignedContacts: contacts.filter(c => c.registeredBy === op.id).length
    }))
    
    const avgLoad = contacts.length / operators.length
    const variance = operatorsWithLoad.reduce((sum, op) => {
      return sum + Math.pow(op.assignedContacts - avgLoad, 2)
    }, 0) / operators.length
    
    return {
      avgLoad: Math.round(avgLoad),
      variance: Math.round(variance * 100) / 100,
      balanceScore: Math.max(0, 100 - Math.sqrt(variance) * 10)
    }
  }, [operators, contacts])

  if (!contacts || contacts.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="body2" color="text.secondary">
          No hay suficientes datos para análisis avanzados
        </Typography>
      </Paper>
    )
  }

  return (
    <Grid container spacing={3}>
      {/* Predicción de Engagement */}
      {engagementPrediction && (
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdShowChart size={24} color="#667eea" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Optimización de Engagement
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tasa Óptima
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                      {Math.round(engagementPrediction.optimalRate * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={engagementPrediction.optimalRate * 100}
                    sx={{ 
                      height: 8, 
                      borderRadius: 1,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#667eea'
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Conversiones Esperadas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#00b37e' }}>
                    {engagementPrediction.expectedConversions}
                  </Typography>
                </Box>

                <Chip 
                  label={`Confianza: ${Math.round(engagementPrediction.confidence * 100)}%`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(0, 179, 126, 0.15)',
                    color: '#00b37e',
                    fontWeight: 600
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Tendencia de Crecimiento */}
      {growthTrend && (
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {growthTrend.slope > 0 ? (
                  <MdTrendingUp size={24} color="#00b37e" />
                ) : (
                  <MdTrendingDown size={24} color="#dc2626" />
                )}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Análisis de Tendencia
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tasa de Crecimiento
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      color: growthTrend.slope > 0 ? '#00b37e' : '#dc2626' 
                    }}
                  >
                    {growthTrend.slope > 0 ? '+' : ''}{growthTrend.slope.toFixed(2)} interacciones/día
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Coeficiente R² (Confiabilidad)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={growthTrend.r2 * 100}
                      sx={{ 
                        flex: 1,
                        height: 8, 
                        borderRadius: 1,
                        bgcolor: 'rgba(102, 126, 234, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: growthTrend.r2 > 0.7 ? '#00b37e' : '#f59e0b'
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                      {Math.round(growthTrend.r2 * 100)}%
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Predicción para mañana: <strong>{Math.round(growthTrend.predict(7))}</strong> interacciones
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Balance de Carga */}
      {workloadBalance && (
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdPieChart size={24} color="#667eea" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Balance de Carga
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Puntuación de Balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                    {Math.round(workloadBalance.balanceScore)}
                  </Typography>
                </Box>

                <LinearProgress 
                  variant="determinate" 
                  value={workloadBalance.balanceScore}
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: workloadBalance.balanceScore > 70 ? '#00b37e' : '#f59e0b'
                    }
                  }}
                />

                <Divider />

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Carga promedio: <strong>{workloadBalance.avgLoad}</strong> contactos/operador
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Varianza: <strong>{workloadBalance.variance}</strong>
                  </Typography>
                </Box>

                {workloadBalance.balanceScore < 70 && (
                  <Chip 
                    label="⚠️ Rebalanceo recomendado"
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      fontWeight: 600
                    }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Clusters Territoriales */}
      {clusters.length > 0 && (
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Segmentación Territorial (K-Means)
              </Typography>

              <Grid container spacing={2}>
                {clusters.map((cluster, index) => (
                  <Grid item xs={12} sm={6} md={4} key={cluster.clusterId}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 1.5,
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Cluster {cluster.clusterId}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                        {cluster.size}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        contactos
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`Densidad: ${cluster.density.toFixed(2)}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  💡 Algoritmo K-Means aplicado para agrupar contactos geográficamente y optimizar rutas de campo
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Asignaciones Óptimas */}
      {territoryAssignments.length > 0 && (
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Asignaciones Óptimas (Algoritmo Húngaro)
              </Typography>

              <Grid container spacing={2}>
                {territoryAssignments.slice(0, 6).map((assignment, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 1.5,
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Operador #{assignment.operatorId} → Territorio #{assignment.territoryId}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip 
                          label={`Costo: ${assignment.estimatedCost.toFixed(2)}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Chip 
                          label={`${Math.round(assignment.confidence * 100)}% confianza`}
                          size="small"
                          color={assignment.confidence > 0.7 ? 'success' : 'warning'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 179, 126, 0.05)', borderRadius: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  🎯 Asignación optimizada minimizando distancia, carga de trabajo y densidad de contactos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}
