/**
 * ÁBACO - Panel de Optimización Numérica Avanzada
 * Interfaz para usar los algoritmos de optimización
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  TextField,
  Slider,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import {
  MdCalculate,
  MdShowChart,
  MdAutoGraph,
  MdSettings,
  MdTrendingUp,
  MdDownload
} from 'react-icons/md'
import {
  linearOptimization,
  dynamicCoverage,
  gradientDescentLocationOptimization,
  newtonRaphsonDensityOptimization,
  monteCarloScenarioSimulation,
  bisectionMethodEquilibrium,
  polynomialInterpolation,
  fourierAnalysis
} from '../utils/numericalOptimization'

export default function NumericalOptimizationPage() {
  const [tabValue, setTabValue] = useState(0)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [parameters, setParameters] = useState({
    budget: 10000,
    simulations: 1000,
    iterations: 100,
    variability: 15,
    degree: 3
  })

  // Mock data
  const mockContacts = [
    { id: 1, coords: { lat: -34.60, lng: -58.40 }, weight: 1.2, engagement: 0.8, territoryId: 1 },
    { id: 2, coords: { lat: -34.61, lng: -58.41 }, weight: 0.9, engagement: 0.6, territoryId: 1 },
    { id: 3, coords: { lat: -34.62, lng: -58.42 }, weight: 1.5, engagement: 0.9, territoryId: 2 },
  ]

  const mockTerritories = [
    { id: 1, coords: { lat: -34.60, lng: -58.40 }, priority: 1, population: 5000 },
    { id: 2, coords: { lat: -34.62, lng: -58.42 }, priority: 2, population: 8000 },
  ]

  const mockTimeSeries = [100, 120, 115, 140, 135, 160, 155, 180, 175, 200]

  const runLinearOptimization = () => {
    setLoading(true)
    const result = linearOptimization([], mockTerritories)
    setResults({ type: 'linear', data: result })
    setLoading(false)
  }

  const runDynamicCoverage = () => {
    setLoading(true)
    const result = dynamicCoverage(mockTerritories, parameters.budget, { 1: 500, 2: 800 })
    setResults({ type: 'coverage', data: result })
    setLoading(false)
  }

  const runGradientDescent = () => {
    setLoading(true)
    const result = gradientDescentLocationOptimization(mockContacts, parameters.iterations)
    setResults({ type: 'gradient', data: result })
    setLoading(false)
  }

  const runNewtonRaphson = () => {
    setLoading(true)
    const result = newtonRaphsonDensityOptimization(mockContacts)
    setResults({ type: 'newton', data: result })
    setLoading(false)
  }

  const runMonteCarlo = () => {
    setLoading(true)
    const baselineMetrics = {
      contactsRegistered: 100,
      engagementRate: 0.65,
      coveragePercentage: 45,
      responseTime: 2.5
    }
    const result = monteCarloScenarioSimulation(baselineMetrics, parameters.variability / 100, parameters.simulations)
    setResults({ type: 'montecarlo', data: result })
    setLoading(false)
  }

  const runBisection = () => {
    setLoading(true)
    const resources = [
      { id: 1, capacity: 100, efficiency: 0.8 },
      { id: 2, capacity: 150, efficiency: 0.9 }
    ]
    const demand = [
      { id: 1, amount: 80, priority: 1 },
      { id: 2, amount: 120, priority: 2 }
    ]
    const result = bisectionMethodEquilibrium(resources, demand)
    setResults({ type: 'bisection', data: result })
    setLoading(false)
  }

  const runPolynomial = () => {
    setLoading(true)
    const dataPoints = mockTimeSeries.map((y, i) => ({ x: i + 1, y }))
    const result = polynomialInterpolation(dataPoints, parameters.degree)
    setResults({ type: 'polynomial', data: result })
    setLoading(false)
  }

  const runFourier = () => {
    setLoading(true)
    const result = fourierAnalysis(mockTimeSeries, 4)
    setResults({ type: 'fourier', data: result })
    setLoading(false)
  }

  const renderLinearResult = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Asignación Óptima de Recursos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                  <Typography color="text.secondary" variant="caption">
                    Costo Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea' }}>
                    {results.data.totalCost?.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                  <Typography color="text.secondary" variant="caption">
                    Eficiencia
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea' }}>
                    {(results.data.efficiency * 100)?.toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                  <Typography color="text.secondary" variant="caption">
                    Asignaciones
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea' }}>
                    {results.data.assignment?.filter(a => a !== -1).length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const renderGradientResult = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Centro Óptimo
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Latitud: {results.data.optimalCenter.lat.toFixed(6)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Longitud: {results.data.optimalCenter.lng.toFixed(6)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Costo Final: {results.data.finalCost?.toFixed(4)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Convergencia: {results.data.convergence?.toFixed(4)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={results.data.costHistory?.map((cost, i) => ({ iter: i, cost: cost.toFixed(2) }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="iter" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cost" stroke="#667eea" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Grid>
    </Grid>
  )

  const renderMonteCarloResult = () => (
    <Grid container spacing={2}>
      {Object.entries(results.data.statistics).map(([key, stats]) => (
        <Grid item xs={12} md={6} key={key}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                {key}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Media</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{stats.mean}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Desv. Est.</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{stats.stdDev}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">P5</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{stats.p5}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">P95</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{stats.p95}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  const renderPolynomialResult = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            R² = {results.data.rSquared} (Grado {results.data.degree})
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={results.data.predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke="#667eea" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Grid>
    </Grid>
  )

  const renderFourierResult = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Análisis de Ciclos
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {results.data.analysis}
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Frecuencia</TableCell>
                    <TableCell>Magnitud</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell>Fortaleza</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.data.frequencies?.map((freq, i) => (
                    <TableRow key={i}>
                      <TableCell>{freq.frequency}</TableCell>
                      <TableCell>{freq.magnitude}</TableCell>
                      <TableCell>{freq.period} días</TableCell>
                      <TableCell>{freq.strength}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Optimización Numérica Avanzada
        </Typography>
        <Chip
          label="Métodos Numéricos"
          color="primary"
          icon={<MdCalculate />}
        />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Linear" icon={<MdAutoGraph />} iconPosition="start" />
          <Tab label="Cobertura" icon={<MdSettings />} iconPosition="start" />
          <Tab label="Gradiente" icon={<MdTrendingUp />} iconPosition="start" />
          <Tab label="Newton-Raphson" icon={<MdCalculate />} iconPosition="start" />
          <Tab label="Monte Carlo" icon={<MdShowChart />} iconPosition="start" />
          <Tab label="Bisección" icon={<MdAutoGraph />} iconPosition="start" />
          <Tab label="Polinomios" icon={<MdTrendingUp />} iconPosition="start" />
          <Tab label="Fourier" icon={<MdShowChart />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Linear Optimization */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Resuelve el problema de asignación linear minimizando costos
              </Typography>
              <Button
                variant="contained"
                onClick={runLinearOptimization}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Ejecutar Optimización Linear
              </Button>
            </Box>
          )}

          {/* Coverage */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Maximiza cobertura territorial con presupuesto limitado (Problema de Mochila)
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Presupuesto: ${parameters.budget}
                </Typography>
                <Slider
                  value={parameters.budget}
                  onChange={(e, v) => setParameters({ ...parameters, budget: v })}
                  min={1000}
                  max={50000}
                  step={1000}
                />
              </Box>
              <Button
                variant="contained"
                onClick={runDynamicCoverage}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Calcular Cobertura Óptima
              </Button>
            </Box>
          )}

          {/* Gradient Descent */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Encuentra la ubicación óptima minimizando distancia ponderada
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Iteraciones: {parameters.iterations}
                </Typography>
                <Slider
                  value={parameters.iterations}
                  onChange={(e, v) => setParameters({ ...parameters, iterations: v })}
                  min={10}
                  max={500}
                  step={10}
                />
              </Box>
              <Button
                variant="contained"
                onClick={runGradientDescent}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Optimizar Ubicación
              </Button>
            </Box>
          )}

          {/* Newton-Raphson */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Optimiza densidad de contactos por territorio
              </Typography>
              <Button
                variant="contained"
                onClick={runNewtonRaphson}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Ejecutar Newton-Raphson
              </Button>
            </Box>
          )}

          {/* Monte Carlo */}
          {tabValue === 4 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Simula escenarios con variabilidad para análisis de riesgo
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Simulaciones: {parameters.simulations}
                </Typography>
                <Slider
                  value={parameters.simulations}
                  onChange={(e, v) => setParameters({ ...parameters, simulations: v })}
                  min={100}
                  max={5000}
                  step={100}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Variabilidad: {parameters.variability}%
                </Typography>
                <Slider
                  value={parameters.variability}
                  onChange={(e, v) => setParameters({ ...parameters, variability: v })}
                  min={5}
                  max={50}
                  step={1}
                />
              </Box>
              <Button
                variant="contained"
                onClick={runMonteCarlo}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Ejecutar Simulación
              </Button>
            </Box>
          )}

          {/* Bisection */}
          {tabValue === 5 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Encuentra punto de equilibrio entre recursos y demanda
              </Typography>
              <Button
                variant="contained"
                onClick={runBisection}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Calcular Equilibrio
              </Button>
            </Box>
          )}

          {/* Polynomial */}
          {tabValue === 6 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Interpola polinomio para predecir tendencias
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Grado del polinomio: {parameters.degree}
                </Typography>
                <Slider
                  value={parameters.degree}
                  onChange={(e, v) => setParameters({ ...parameters, degree: v })}
                  min={1}
                  max={5}
                  step={1}
                />
              </Box>
              <Button
                variant="contained"
                onClick={runPolynomial}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Interpolación Polinomial
              </Button>
            </Box>
          )}

          {/* Fourier */}
          {tabValue === 7 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Analiza ciclos y patrones periódicos en datos
              </Typography>
              <Button
                variant="contained"
                onClick={runFourier}
                disabled={loading}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Análisis de Fourier
              </Button>
            </Box>
          )}

          {loading && <LinearProgress sx={{ mt: 2 }} />}

          {results && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Resultados
              </Typography>
              {results.type === 'linear' && renderLinearResult()}
              {results.type === 'gradient' && renderGradientResult()}
              {results.type === 'montecarlo' && renderMonteCarloResult()}
              {results.type === 'polynomial' && renderPolynomialResult()}
              {results.type === 'fourier' && renderFourierResult()}
              {results.type !== 'linear' && results.type !== 'gradient' && results.type !== 'montecarlo' && results.type !== 'polynomial' && results.type !== 'fourier' && (
                <Paper sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(results.data, null, 2)}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
