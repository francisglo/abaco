/**
 * ÁBACO - Panel de Control Integrado
 * Dashboard ejecutivo con todos los sistemas
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,   
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  MdCheckCircle,
  MdSpeed,
  MdTrendingUp,
  MdStorage,
  MdMemory,
  MdSettings,
  MdRefresh,
  MdDownload,
  MdInfo,
  MdWarning,
  MdError,
  MdApi,
  MdPeople,
  MdLocationOn,
  MdAssignment,
} from 'react-icons/md'

const statusColors = {
  operational: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  loading: '#3b82f6'
}

const systemData = [
  {
    name: 'Métodos Numéricos',
    status: 'operational',
    algorithms: 8,
    uptime: 99.9,
    lastCheck: '2m ago',
    responseTime: '12ms',
    requests: 1250,
    color: '#667eea'
  },
  {
    name: 'Machine Learning',
    status: 'operational',
    algorithms: 8,
    uptime: 99.8,
    lastCheck: '1m ago',
    responseTime: '35ms',
    requests: 890,
    color: '#764ba2'
  },
  {
    name: 'Base de Datos',
    status: 'operational',
    size: '2.4MB',
    uptime: 100,
    lastCheck: '30s ago',
    responseTime: '8ms',
    records: 3200,
    color: '#43e97b'
  },
  {
    name: 'API Mock',
    status: 'operational',
    endpoints: 25,
    uptime: 99.9,
    lastCheck: '45s ago',
    responseTime: '15ms',
    requests: 5420,
    color: '#fa709a'
  }
]

const performanceData = [
  { time: '00:00', cpu: 24, memory: 35, requests: 400 },
  { time: '04:00', cpu: 18, memory: 28, requests: 300 },
  { time: '08:00', cpu: 45, memory: 65, requests: 1200 },
  { time: '12:00', cpu: 38, memory: 58, requests: 950 },
  { time: '16:00', cpu: 52, memory: 72, requests: 1500 },
  { time: '20:00', cpu: 41, memory: 61, requests: 1100 },
  { time: '24:00', cpu: 28, memory: 42, requests: 600 },
]

const algorithmPerformance = [
  { name: 'Linear Opt', execTime: 12, accuracy: 98, calls: 245 },
  { name: 'Dynamic Prog', execTime: 28, accuracy: 95, calls: 156 },
  { name: 'Gradient', execTime: 45, accuracy: 97, calls: 189 },
  { name: 'Newton', execTime: 52, accuracy: 96, calls: 142 },
  { name: 'Monte Carlo', execTime: 180, accuracy: 94, calls: 98 },
  { name: 'Bisección', execTime: 15, accuracy: 99, calls: 203 },
  { name: 'Polynomial', execTime: 34, accuracy: 92, calls: 167 },
  { name: 'Fourier', execTime: 67, accuracy: 93, calls: 110 },
]

export default function ControlPanelPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [systemStats, setSystemStats] = useState({
    totalAlgorithms: 16,
    totalExecutions: 12500,
    uptime: 99.9,
    avgResponseTime: 31,
    activeUsers: 1,
    databases: 1,
  })

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              🎛️ Centro de Control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitoreo integrado de todos los sistemas ÁBACO
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={20} /> : <MdRefresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Actualizar
            </Button>
            <Button variant="contained" startIcon={<MdDownload />}>
              Exportar
            </Button>
          </Box>
        </Box>

        {/* Estado General */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Algoritmos Totales', value: systemStats.totalAlgorithms, icon: <MdApi /> },
            { label: 'Ejecuciones Hoy', value: systemStats.totalExecutions, icon: <MdSpeed /> },
            { label: 'Uptime', value: `${systemStats.uptime}%`, icon: <MdCheckCircle /> },
            { label: 'Resp. Promedio', value: `${systemStats.avgResponseTime}ms`, icon: <MdTrendingUp /> },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: '#667eea', fontSize: 28 }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Sistema Operativo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Estado de Sistemas"
                subheader="Monitoreo de componentes principales"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  {systemData.map((system, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          border: `2px solid ${system.color}`,
                          borderRadius: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {system.name}
                          </Typography>
                          <Chip
                            icon={<MdCheckCircle />}
                            label="Online"
                            size="small"
                            sx={{ bgcolor: statusColors[system.status], color: 'white' }}
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={system.uptime}
                          sx={{ mb: 1.5, height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Uptime: {system.uptime}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Respuesta: {system.responseTime}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Verificado: {system.lastCheck}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader title="Rendimiento del Sistema" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      stroke="#667eea"
                      fillOpacity={1}
                      fill="url(#colorCpu)"
                      name="CPU %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader title="Solicitudes por Hora" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#764ba2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Desempeño de Algoritmos */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Desempeño de Algoritmos"
                subheader="Tiempo de ejecución, precisión y uso"
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="execTime" name="Tiempo (ms)" />
                    <YAxis dataKey="accuracy" name="Precisión %" domain={[80, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      name="Algoritmos"
                      data={algorithmPerformance}
                      fill="#667eea"
                      shape="circle"
                    >
                      {algorithmPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#a8edea'][index]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    {algorithmPerformance.map((algo, i) => (
                      <Grid item xs={12} sm={6} md={3} key={i}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {algo.name}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              {algo.execTime}ms
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#10b981' }}>
                              {algo.accuracy}%
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Configuración Avanzada */}
        {showAdvanced && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardHeader title="Configuración Avanzada" />
                <Divider />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <MdMemory />
                      </ListItemIcon>
                      <ListItemText
                        primary="Caché de resultados"
                        secondary="Almacena últimas 100 ejecuciones"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label=""
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <MdSettings />
                      </ListItemIcon>
                      <ListItemText
                        primary="Validación de entrada"
                        secondary="Verifica parámetros antes de ejecutar"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label=""
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <MdStorage />
                      </ListItemIcon>
                      <ListItemText
                        primary="Persistencia de datos"
                        secondary="Guarda resultados en localStorage"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label=""
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Toggle Avanzado */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="text"
            onClick={() => setShowAdvanced(!showAdvanced)}
            endIcon={showAdvanced ? '⬆️' : '⬇️'}
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} Configuración Avanzada
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography variant="body2" color="text.secondary">
            Centro de Control ÁBACO v1.0 | Actualizado: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
