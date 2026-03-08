import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  MdSpeed,
  MdStorage,
  MdRefresh,
  MdDelete,
  MdCheckCircle,
  MdWarning,
  MdCloudDone,
  MdCloudOff,
  MdTimer,
  MdMemory,
  MdNetworkCheck,
  MdTrendingUp,
  MdSettings,
  MdDataset,
} from 'react-icons/md'
import { useServerHealth } from '../hooks/useNetworkStatus'
import { useCacheManager } from '../hooks/useCache'
import { mean, median, standardDeviation, trend, movingAverage } from '../utils/statistics'

const RESOURCES = ['voters', 'users', 'zones', 'tasks', 'logs']

export default function PerformancePage() {
  const [config, setConfig] = useState({
    enableCache: localStorage.getItem('enableCache') !== 'false',
    cacheTTL: parseInt(localStorage.getItem('cacheTTL') || '300000', 10),
    enableLazyLoad: localStorage.getItem('enableLazyLoad') !== 'false',
    enablePagination: localStorage.getItem('enablePagination') !== 'false',
    pageSize: parseInt(localStorage.getItem('pageSize') || '20', 10),
  })

  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    loadTime: 0,
    apiCalls: 0,
    recordsLoaded: 0,
    throughput: 0,
  })

  const [probe, setProbe] = useState({
    successRate: 0,
    avgLatency: 0,
    p50Latency: 0,
    stdDevLatency: 0,
    trendLatency: 0,
    samples: []
  })

  const [alert, setAlert] = useState({ open: false, type: '', message: '' })
  const serverHealth = useServerHealth('http://localhost:4000/metrics', 15000)
  const { clearAllCache, getCacheSize } = useCacheManager()
  const [cacheSize, setCacheSize] = useState('0')

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message })
    setTimeout(() => setAlert({ open: false, type: '', message: '' }), 5000)
  }

  const runProbe = async () => {
    const latencies = []
    let success = 0
    let loaded = 0

    for (const resource of RESOURCES) {
      const start = performance.now()
      try {
        const response = await fetch(`http://localhost:4000/${resource}`, { cache: 'no-cache' })
        const elapsed = performance.now() - start
        latencies.push(elapsed)

        if (response.ok) {
          success += 1
          const payload = await response.json()
          loaded += Array.isArray(payload) ? payload.length : 1
        }
      } catch {
        const elapsed = performance.now() - start
        latencies.push(elapsed)
      }
    }

    const mergedSamples = [...probe.samples, ...latencies].slice(-40)
    const latencyMA = movingAverage(mergedSamples, 4)

    const avgLatency = mean(mergedSamples)
    const p50Latency = median(mergedSamples)
    const stdDevLatency = standardDeviation(mergedSamples)
    const trendLatency = trend(latencyMA)
    const successRate = (success / RESOURCES.length) * 100

    setProbe({
      successRate: Number(successRate.toFixed(1)),
      avgLatency: Number(avgLatency.toFixed(1)),
      p50Latency: Number(p50Latency.toFixed(1)),
      stdDevLatency: Number(stdDevLatency.toFixed(1)),
      trendLatency: Number(trendLatency.toFixed(1)),
      samples: mergedSamples
    })

    setMetrics(prev => ({
      ...prev,
      apiCalls: prev.apiCalls + RESOURCES.length,
      recordsLoaded: loaded,
      throughput: Number((loaded / Math.max(avgLatency, 1)).toFixed(3)),
    }))
  }

  useEffect(() => {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1048576
      setMetrics(prev => ({ ...prev, memoryUsage: Number(used.toFixed(2)) }))
    }

    setMetrics(prev => ({ ...prev, loadTime: Number((performance.now() / 1000).toFixed(2)) }))
    setCacheSize(getCacheSize())

    runProbe()
    const intervalId = setInterval(() => {
      setCacheSize(getCacheSize())
      runProbe()
    }, 20000)

    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCacheSize])

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    localStorage.setItem(key, String(value))
    showAlert('success', 'Configuración actualizada correctamente')
  }

  const handleClearCache = () => {
    if (clearAllCache()) {
      setCacheSize('0')
      showAlert('success', 'Caché limpiado correctamente')
    } else {
      showAlert('error', 'Error al limpiar caché')
    }
  }

  const getServerStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981'
      case 'degraded': return '#f59e0b'
      case 'offline': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getServerStatusText = (status) => {
    switch (status) {
      case 'healthy': return 'Óptimo'
      case 'degraded': return 'Degradado'
      case 'offline': return 'Desconectado'
      default: return 'Desconocido'
    }
  }

  const latencyQuality = useMemo(() => {
    if (!probe.avgLatency) return 'Sin datos'
    if (probe.avgLatency < 120) return 'Excelente'
    if (probe.avgLatency < 260) return 'Bueno'
    return 'Lento'
  }, [probe.avgLatency])

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {alert.open && (
        <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert({ open: false, type: '', message: '' })}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdNetworkCheck style={{ fontSize: 24, color: 'white', marginRight: 10 }} />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>Servidor</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>{getServerStatusText(serverHealth.status)}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Latencia media: {probe.avgLatency || serverHealth.latency || 0}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdDataset style={{ fontSize: 24, color: 'white', marginRight: 10 }} />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>API éxito</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>{probe.successRate}%</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Throughput: {metrics.throughput} reg/ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdMemory style={{ fontSize: 24, color: 'white', marginRight: 10 }} />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>Memoria</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>{metrics.memoryUsage} MB</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Cargados: {metrics.recordsLoaded} registros
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdStorage style={{ fontSize: 24, color: 'white', marginRight: 10 }} />
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>Caché</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>{cacheSize} KB</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Llamadas API: {metrics.apiCalls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MdSettings style={{ fontSize: 24, color: '#667eea', marginRight: 10 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Configuración de Rendimiento</Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon><MdStorage style={{ color: '#667eea' }} /></ListItemIcon>
                <ListItemText primary="Caché de datos" secondary="Reduce peticiones redundantes" />
                <Switch checked={config.enableCache} onChange={(e) => handleConfigChange('enableCache', e.target.checked)} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon><MdTrendingUp style={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText primary="Lazy loading" secondary="Carga componentes bajo demanda" />
                <Switch checked={config.enableLazyLoad} onChange={(e) => handleConfigChange('enableLazyLoad', e.target.checked)} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon><MdCheckCircle style={{ color: '#3b82f6' }} /></ListItemIcon>
                <ListItemText primary="Paginación automática" secondary="Mejora respuesta en listas grandes" />
                <Switch checked={config.enablePagination} onChange={(e) => handleConfigChange('enablePagination', e.target.checked)} />
              </ListItem>
            </List>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
              <Button variant="outlined" startIcon={<MdDelete />} onClick={handleClearCache} fullWidth>
                Limpiar caché
              </Button>
              <Button variant="contained" startIcon={<MdRefresh />} onClick={runProbe} fullWidth>
                Recalcular
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MdSpeed style={{ fontSize: 24, color: '#10b981', marginRight: 10 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Analítica estadística</Typography>
            </Box>

            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={12} sm={6}><Chip label={`Media: ${probe.avgLatency}ms`} color="primary" /></Grid>
              <Grid item xs={12} sm={6}><Chip label={`P50: ${probe.p50Latency}ms`} color="info" /></Grid>
              <Grid item xs={12} sm={6}><Chip label={`Desv: ${probe.stdDevLatency}ms`} color="warning" /></Grid>
              <Grid item xs={12} sm={6}><Chip label={`Tendencia: ${probe.trendLatency}%`} color={probe.trendLatency <= 0 ? 'success' : 'error'} /></Grid>
            </Grid>

            <List>
              <ListItem>
                <ListItemIcon>{serverHealth.status === 'healthy' ? <MdCloudDone style={{ color: '#10b981' }} /> : <MdCloudOff style={{ color: '#ef4444' }} />}</ListItemIcon>
                <ListItemText primary="Estado del backend" secondary={getServerStatusText(serverHealth.status)} />
                <Chip label={getServerStatusText(serverHealth.status)} size="small" sx={{ bgcolor: getServerStatusColor(serverHealth.status), color: 'white' }} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon><MdTimer style={{ color: '#667eea' }} /></ListItemIcon>
                <ListItemText primary="Calidad de latencia" secondary={`Evaluación: ${latencyQuality}`} />
                <Chip label={`${probe.avgLatency || serverHealth.latency || 0}ms`} size="small" color={latencyQuality === 'Excelente' ? 'success' : latencyQuality === 'Bueno' ? 'warning' : 'error'} />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tiempo de carga inicial: {metrics.loadTime}s</Typography>
            <LinearProgress variant="determinate" value={Math.min((Number(metrics.loadTime || 0) / 3) * 100, 100)} sx={{ height: 8, borderRadius: 4 }} />

            {Number(metrics.memoryUsage) > 100 && (
              <Alert severity="warning" icon={<MdWarning />} sx={{ mt: 2 }}>
                Uso de memoria alto. Ejecuta limpieza de caché para mejorar estabilidad.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
