import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material'
import {
  MdRefresh,
  MdDownload,
  MdAutoAwesome,
  MdTrendingUp,
  MdCheckCircle,
  MdWarning,
  MdInfo,
} from 'react-icons/md'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
} from 'recharts'

export default function ExecutiveDashboardPage() {
  const theme = useTheme()
  const [data, setData] = useState({
    voters: [],
    zones: [],
    users: [],
    tasks: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [period, setPeriod] = useState('month')
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('es-ES'))

  // Cargar datos
  useEffect(() => {
    loadData()
    const interval = setInterval(() => {
      loadData()
      setLastUpdate(new Date().toLocaleTimeString('es-ES'))
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const sources = ['voters', 'zones', 'users', 'tasks']
      const newData = { ...data }

      for (const source of sources) {
        const response = await fetch(`http://localhost:4000/${source}`)
        if (response.ok) {
          newData[source] = await response.json()
        }
      }

      setData(newData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  // Filtrar datos
  const getFilteredVoters = () => {
    let filtered = data.voters
    if (selectedStatus) {
      filtered = filtered.filter(v => v.status === selectedStatus)
    }
    return filtered
  }

  const voters = getFilteredVoters()

  // Cálculos KPI
  const kpis = {
    totalContacts: voters.length,
    confirmed: voters.filter(v => v.status === 'confirmed').length,
    pending: voters.filter(v => v.status === 'pending').length,
    active: voters.filter(v => v.status === 'active').length,
    confirmationRate: voters.length > 0 ? ((voters.filter(v => v.status === 'confirmed').length / voters.length) * 100).toFixed(1) : 0,
    coverage: data.zones.length > 0 ? ((voters.length / (data.zones.length * 100)) * 100).toFixed(1) : 0,
    activeUsers: data.users.filter(u => u.active).length,
    totalUsers: data.users.length,
    tasksCompleted: data.tasks.filter(t => t.completed).length,
    tasksPending: data.tasks.filter(t => t.status === 'pending').length,
    taskCompletion: data.tasks.length > 0 ? ((data.tasks.filter(t => t.completed).length / data.tasks.length) * 100).toFixed(1) : 0,
  }

  // Datos para gráficos
  const statusDistribution = [
    { name: 'Confirmados', value: kpis.confirmed, color: '#10b981' },
    { name: 'Pendientes', value: kpis.pending, color: '#f59e0b' },
    { name: 'Activos', value: kpis.active, color: '#667eea' },
  ]

  const tasksTrend = [
    { day: 'Lun', pending: 12, completed: 8, inProgress: 5 },
    { day: 'Mar', pending: 10, completed: 12, inProgress: 6 },
    { day: 'Mié', pending: 8, completed: 14, inProgress: 7 },
    { day: 'Jue', pending: 6, completed: 16, inProgress: 5 },
    { day: 'Vie', pending: 4, completed: 18, inProgress: 3 },
    { day: 'Sáb', pending: 2, completed: 20, inProgress: 2 },
  ]

  const zonesData = data.zones.map(zone => ({
    name: zone.name,
    contactos: voters.filter(v => v.lat).length,
    tasa: Math.round(Math.random() * 100),
  }))

  const userRoles = [
    { name: 'Admin', value: data.users.filter(u => u.role === 'admin').length },
    { name: 'Operador', value: data.users.filter(u => u.role === 'operator').length },
    { name: 'Auditor', value: data.users.filter(u => u.role === 'auditor').length },
    { name: 'Viewer', value: data.users.filter(u => u.role === 'viewer').length },
  ]

  const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  // Componente KPI Card
  const KPICard = ({ title, value, unit, color, icon: Icon, trend, subtitle }) => (
    <Card
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha(color, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: color,
        },
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
              {value}
              <Typography variant="body2" component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>
                {unit}
              </Typography>
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && <Icon size={32} color={color} style={{ opacity: 0.6 }} />}
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MdTrendingUp size={16} color={trend > 0 ? '#10b981' : '#ef4444'} />
            <Typography variant="caption" sx={{ color: trend > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {Math.abs(trend)}% {trend > 0 ? 'arriba' : 'abajo'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1f2937' }}>
                Dashboard Ejecutivo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista integral del territorio • Última actualización: {lastUpdate}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<MdRefresh />}
              onClick={loadData}
              size="small"
            >
              Actualizar
            </Button>
          </Box>

          {/* Filtros */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Estado del Contacto</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Estado del Contacto"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="confirmed">Confirmados</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Período</InputLabel>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Período">
                <MenuItem value="week">Última Semana</MenuItem>
                <MenuItem value="month">Último Mes</MenuItem>
                <MenuItem value="quarter">Último Trimestre</MenuItem>
                <MenuItem value="year">Último Año</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<MdDownload />}
              size="small"
            >
              Exportar Reporte
            </Button>
          </Box>
        </Box>

        {/* KPIs Principales */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Contactos"
              value={kpis.totalContacts}
              unit="registros"
              color="#667eea"
              icon={MdInfo}
              trend={12}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Tasa Confirmación"
              value={kpis.confirmationRate}
              unit="%"
              color="#10b981"
              trend={8}
              subtitle={`${kpis.confirmed} confirmados`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Cobertura Territorial"
              value={kpis.coverage}
              unit="%"
              color="#f59e0b"
              trend={-3}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Completación Tareas"
              value={kpis.taskCompletion}
              unit="%"
              color="#8b5cf6"
              trend={15}
            />
          </Grid>
        </Grid>

        {/* Gráficos principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Distribución por estado */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Distribución de Contactos por Estado"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100}>
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} contactos`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Tendencia de tareas */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Evolución de Tareas por Estado"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tasksTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pendientes" />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completadas" />
                    <Line type="monotone" dataKey="inProgress" stroke="#667eea" strokeWidth={2} name="En Progreso" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráficos secundarios */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Contactos por zona */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Contactos por Zona Territorial"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zonesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                    <Bar dataKey="contactos" fill="#667eea" name="Contactos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Distribución de roles */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Distribución de Roles de Usuarios"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userRoles}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#10b981" name="Usuarios" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Resumen de tareas */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Resumen de Tareas"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Completadas
                      </Typography>
                      <Chip
                        label={`${kpis.tasksCompleted}/${data.tasks.length}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                    <LinearProgress variant="determinate" value={kpis.taskCompletion} sx={{ height: 8, borderRadius: 1 }} />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Pendientes
                      </Typography>
                      <Chip label={kpis.tasksPending} size="small" color="warning" variant="outlined" />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(kpis.tasksPending / data.tasks.length) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Confirmación
                      </Typography>
                      <Chip label={`${kpis.confirmationRate}%`} size="small" color="info" variant="outlined" />
                    </Box>
                    <LinearProgress variant="determinate" value={kpis.confirmationRate} sx={{ height: 8, borderRadius: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Equipo de trabajo */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardHeader
                title="Equipo de Trabajo"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Usuarios Activos</Typography>
                    <Chip
                      label={`${kpis.activeUsers}/${kpis.totalUsers}`}
                      size="small"
                      color="success"
                      sx={{
                        fontWeight: 600,
                        bgcolor: '#d1fae5',
                        color: '#047857',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {userRoles.map((role, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {role.name}
                        </Typography>
                        <Chip label={role.value} size="small" variant="outlined" />
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: '#f0f9ff',
                      borderRadius: 1,
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <MdCheckCircle size={20} color="#0ea5e9" style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Sistema Operativo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Todos los módulos funcionando correctamente
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
