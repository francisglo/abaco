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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tab,
  Tabs,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material'
import {
  MdAdd,
  MdDelete,
  MdSearch,
  MdDownload,
  MdAnalytics,
  MdRefresh,
  MdCheckCircle,
  MdFilterList,
  MdTrendingUp,
  MdCompare,
} from 'react-icons/md'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'

export default function QueryAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [queries, setQueries] = useState([])
  const [biReports, setBiReports] = useState([])
  const [selectedQuery, setSelectedQuery] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [openQueryDialog, setOpenQueryDialog] = useState(false)
  const [openResultsView, setOpenResultsView] = useState(false)
  const [message, setMessage] = useState('')
  const [chartType, setChartType] = useState('table')

  // Estado del generador de consultas
  const [queryConfig, setQueryConfig] = useState({
    name: '',
    dataSource: 'voters',
    variables: [],
    filters: [],
    aggregation: 'count',
    groupBy: '',
    orderBy: 'id',
  })

  // Datos disponibles
  const [data, setData] = useState({
    voters: [],
    zones: [],
    users: [],
    tasks: [],
  })

  // Definiciones de variables por fuente
  const variableDefinitions = {
    voters: [
      { key: 'id', label: 'ID', type: 'numeric' },
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'dni', label: 'DNI/Cédula', type: 'text' },
      { key: 'status', label: 'Estado', type: 'categorical' },
      { key: 'priority', label: 'Prioridad', type: 'categorical' },
      { key: 'phone', label: 'Teléfono', type: 'text' },
      { key: 'address', label: 'Dirección', type: 'text' },
    ],
    zones: [
      { key: 'id', label: 'ID', type: 'numeric' },
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'priority', label: 'Prioridad', type: 'numeric' },
      { key: 'manager', label: 'Responsable', type: 'text' },
    ],
    users: [
      { key: 'id', label: 'ID', type: 'numeric' },
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'role', label: 'Rol', type: 'categorical' },
      { key: 'active', label: 'Activo', type: 'boolean' },
    ],
    tasks: [
      { key: 'id', label: 'ID', type: 'numeric' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'status', label: 'Estado', type: 'categorical' },
      { key: 'priority', label: 'Prioridad', type: 'categorical' },
      { key: 'completed', label: 'Completada', type: 'boolean' },
    ],
  }

  // Cargar datos
  useEffect(() => {
    loadAllData()

    try {
      const savedQueries = JSON.parse(localStorage.getItem('abaco_bi_queries') || '[]')
      const savedReports = JSON.parse(localStorage.getItem('abaco_bi_reports') || '[]')
      if (Array.isArray(savedQueries)) setQueries(savedQueries)
      if (Array.isArray(savedReports)) setBiReports(savedReports)
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('abaco_bi_queries', JSON.stringify(queries))
  }, [queries])

  useEffect(() => {
    localStorage.setItem('abaco_bi_reports', JSON.stringify(biReports))
  }, [biReports])

  const loadAllData = async () => {
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
    } catch (error) {
      setMessage(`Error cargando datos: ${error.message}`)
    }
  }

  // Ejecutar consulta
  const handleExecuteQuery = async () => {
    if (!queryConfig.name || !queryConfig.dataSource) {
      setMessage('Configura nombre y fuente de datos')
      return
    }

    try {
      setLoading(true)
      const sourceData = data[queryConfig.dataSource] || []

      // Aplicar filtros
      let filtered = [...sourceData]
      queryConfig.filters.forEach(filter => {
        filtered = filtered.filter(item => {
          const value = item[filter.field]
          switch (filter.operator) {
            case 'equals':
              return value === filter.value
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
            case 'greater':
              return Number(value) > Number(filter.value)
            case 'less':
              return Number(value) < Number(filter.value)
            default:
              return true
          }
        })
      })

      // Agrupar y agregar
      let resultData = filtered
      if (queryConfig.groupBy && queryConfig.aggregation) {
        const grouped = {}
        filtered.forEach(item => {
          const key = item[queryConfig.groupBy]
          if (!grouped[key]) {
            grouped[key] = []
          }
          grouped[key].push(item)
        })

        resultData = Object.entries(grouped).map(([key, items]) => {
          const agg = {}
          agg[queryConfig.groupBy] = key
          agg['count'] = items.length
          
          if (queryConfig.aggregation === 'avg') {
            const numValues = items.map(i => Number(i[queryConfig.variables[0]]) || 0)
            agg['avg'] = (numValues.reduce((a, b) => a + b, 0) / items.length).toFixed(2)
          }
          
          return agg
        })
      }

      setResults({
        query: queryConfig,
        data: resultData,
        count: resultData.length,
        timestamp: new Date().toLocaleString('es-ES'),
      })

      setOpenResultsView(true)
      setMessage(`Consulta ejecutada: ${resultData.length} registros`)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Guardar consulta
  const handleSaveQuery = () => {
    if (!queryConfig.name.trim()) {
      setMessage('Ingresa un nombre para la consulta')
      return
    }

    const newQuery = { id: Date.now(), ...queryConfig }
    setQueries([...queries, newQuery])
    setOpenQueryDialog(false)
    setQueryConfig({
      name: '',
      dataSource: 'voters',
      variables: [],
      filters: [],
      aggregation: 'count',
      groupBy: '',
      orderBy: 'id',
    })
    setMessage(`Consulta guardada: ${queryConfig.name}`)
  }

  // Cargar consulta guardada
  const handleLoadQuery = (query) => {
    setQueryConfig(query)
    setMessage(`Consulta cargada: ${query.name}`)
  }

  // Eliminar consulta
  const handleDeleteQuery = (id) => {
    setQueries(queries.filter(q => q.id !== id))
    setMessage('Consulta eliminada')
  }

  const handleCreateBIReport = () => {
    if (!results) {
      setMessage('Ejecuta una consulta antes de crear un BI')
      return
    }

    const report = {
      id: Date.now(),
      name: `BI - ${results.query.name}`,
      source: results.query.dataSource,
      records: results.count,
      chartType,
      createdAt: new Date().toISOString(),
      query: results.query,
      sample: results.data.slice(0, 10)
    }

    setBiReports(prev => [report, ...prev])
    setMessage(`BI creado: ${report.name}`)
  }

  const handleDeleteBIReport = (id) => {
    setBiReports(prev => prev.filter(r => r.id !== id))
    setMessage('Reporte BI eliminado')
  }

  // Exportar resultados
  const handleExportResults = () => {
    if (!results) return

    const csv = [
      Object.keys(results.data[0] || {}).join(','),
      ...results.data.map(row => Object.values(row).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analisis_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setMessage('Resultados exportados')
  }

  // Preparar datos para gráficos
  const getChartData = () => {
    if (!results) return []
    return results.data.slice(0, 20) // Limitar a 20 para gráficos
  }

  const availableVariables = variableDefinitions[queryConfig.dataSource] || []

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1f2937' }}>
            Análisis y Consultas (BI Operativo)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis dinámico de datos para decisiones tácticas rápidas
          </Typography>
        </Box>

        {/* Messages */}
        {message && (
          <Alert severity="success" onClose={() => setMessage('')} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Panel izquierdo: Constructor de consultas */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 20 }}>
              <CardHeader
                title="Constructor de Consultas"
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              />
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Nombre */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre de la consulta"
                    value={queryConfig.name}
                    onChange={(e) => setQueryConfig({ ...queryConfig, name: e.target.value })}
                  />

                  {/* Fuente de datos */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Fuente de datos</InputLabel>
                    <Select
                      value={queryConfig.dataSource}
                      onChange={(e) => {
                        setQueryConfig({ ...queryConfig, dataSource: e.target.value, variables: [], groupBy: '' })
                      }}
                      label="Fuente de datos"
                    >
                      <MenuItem value="voters">Votantes/Contactos</MenuItem>
                      <MenuItem value="zones">Zonas Territoriales</MenuItem>
                      <MenuItem value="users">Usuarios</MenuItem>
                      <MenuItem value="tasks">Tareas</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Variables a consultar */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Variables</InputLabel>
                    <Select
                      multiple
                      value={queryConfig.variables}
                      onChange={(e) => setQueryConfig({ ...queryConfig, variables: e.target.value })}
                      label="Variables"
                    >
                      {availableVariables.map(v => (
                        <MenuItem key={v.key} value={v.key}>{v.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Grupo Por */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Agrupar por</InputLabel>
                    <Select
                      value={queryConfig.groupBy}
                      onChange={(e) => setQueryConfig({ ...queryConfig, groupBy: e.target.value })}
                      label="Agrupar por"
                    >
                      <MenuItem value="">Ninguno</MenuItem>
                      {availableVariables.map(v => (
                        <MenuItem key={v.key} value={v.key}>{v.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Agregación */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Agregación</InputLabel>
                    <Select
                      value={queryConfig.aggregation}
                      onChange={(e) => setQueryConfig({ ...queryConfig, aggregation: e.target.value })}
                      label="Agregación"
                    >
                      <MenuItem value="count">Contar</MenuItem>
                      <MenuItem value="sum">Suma</MenuItem>
                      <MenuItem value="avg">Promedio</MenuItem>
                      <MenuItem value="max">Máximo</MenuItem>
                      <MenuItem value="min">Mínimo</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Filtros */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Filtros Avanzados
                    </Typography>
                    {queryConfig.filters.map((filter, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                        <Select
                          size="small"
                          value={filter.field}
                          onChange={(e) => {
                            const newFilters = [...queryConfig.filters]
                            newFilters[idx].field = e.target.value
                            setQueryConfig({ ...queryConfig, filters: newFilters })
                          }}
                          sx={{ flex: 1 }}
                        >
                          {availableVariables.map(v => (
                            <MenuItem key={v.key} value={v.key}>{v.label}</MenuItem>
                          ))}
                        </Select>
                        <Select
                          size="small"
                          value={filter.operator}
                          onChange={(e) => {
                            const newFilters = [...queryConfig.filters]
                            newFilters[idx].operator = e.target.value
                            setQueryConfig({ ...queryConfig, filters: newFilters })
                          }}
                          sx={{ flex: 0.7 }}
                        >
                          <MenuItem value="equals">Igual</MenuItem>
                          <MenuItem value="contains">Contiene</MenuItem>
                          <MenuItem value="greater">Mayor</MenuItem>
                          <MenuItem value="less">Menor</MenuItem>
                        </Select>
                        <Button
                          size="small"
                          onClick={() => {
                            const newFilters = queryConfig.filters.filter((_, i) => i !== idx)
                            setQueryConfig({ ...queryConfig, filters: newFilters })
                          }}
                          sx={{ color: '#ef4444' }}
                        >
                          <MdDelete />
                        </Button>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<MdAdd />}
                      onClick={() => {
                        setQueryConfig({
                          ...queryConfig,
                          filters: [...queryConfig.filters, { field: '', operator: 'equals', value: '' }],
                        })
                      }}
                      sx={{ color: '#667eea', mt: 1 }}
                    >
                      Agregar filtro
                    </Button>
                  </Box>

                  {/* Botones de acción */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<MdAnalytics />}
                      onClick={handleExecuteQuery}
                      disabled={loading}
                      sx={{ bgcolor: '#667eea' }}
                    >
                      Ejecutar
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<MdAdd />}
                      onClick={() => setOpenQueryDialog(true)}
                    >
                      Guardar
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel derecho: Resultados */}
          <Grid item xs={12} md={8}>
            {loading ? (
              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', p: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Ejecutando consulta...</Typography>
              </Card>
            ) : results ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Info de resultados */}
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardHeader
                    title={`Resultados: ${results.query.name}`}
                    subheader={results.timestamp}
                    sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                    action={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<MdDownload />}
                          onClick={handleExportResults}
                        >
                          Exportar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<MdRefresh />}
                          onClick={handleExecuteQuery}
                        >
                          Actualizar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<MdTrendingUp />}
                          onClick={handleCreateBIReport}
                        >
                          Crear BI
                        </Button>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Registros
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                            {results.count}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Fuente
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {results.query.dataSource}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Filtros
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {results.query.filters.length}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Agrupación
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {results.query.groupBy || 'Ninguna'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Pestañas de visualización */}
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <Tabs
                    value={chartType}
                    onChange={(e, v) => setChartType(v)}
                    sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                  >
                    <Tab label="Tabla" value="table" />
                    <Tab label="Gráfico de Barras" value="bar" />
                    <Tab label="Gráfico de Líneas" value="line" />
                    <Tab label="Gráfico de Pastel" value="pie" />
                  </Tabs>

                  <CardContent sx={{ pt: 3 }}>
                    {chartType === 'table' ? (
                      <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
                        <Table>
                          <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                            <TableRow>
                              {Object.keys(results.data[0] || {}).map(key => (
                                <TableCell key={key} sx={{ fontWeight: 600 }}>
                                  {key}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {results.data.map((row, idx) => (
                              <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                                {Object.values(row).map((val, i) => (
                                  <TableCell key={i}>
                                    {typeof val === 'number' ? val.toFixed(2) : val}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : chartType === 'bar' ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={Object.keys(results.data[0] || {})[0]} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#667eea" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : chartType === 'line' ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={Object.keys(results.data[0] || {})[0]} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#667eea" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : chartType === 'pie' ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            dataKey="count"
                            nameKey={Object.keys(results.data[0] || {})[0]}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {getChartData().map((_, idx) => (
                              <Cell key={idx} fill={['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : null}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', p: 6, textAlign: 'center' }}>
                <MdAnalytics size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                <Typography color="text.secondary">
                  Ejecuta una consulta para ver resultados aquí
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Consultas guardadas */}
        {queries.length > 0 && (
          <Card sx={{ borderRadius: 2, mt: 4, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardHeader
              title="Consultas Guardadas"
              sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {queries.map(query => (
                  <Grid item xs={12} sm={6} md={4} key={query.id}>
                    <Card sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)', p: 2, cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea' }}>
                            {query.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Fuente: {query.dataSource} | Filtros: {query.filters.length}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            onClick={() => handleLoadQuery(query)}
                            sx={{ color: '#667eea' }}
                          >
                            Cargar
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleDeleteQuery(query.id)}
                            sx={{ color: '#ef4444' }}
                          >
                            <MdDelete />
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {biReports.length > 0 && (
          <Card sx={{ borderRadius: 2, mt: 4, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardHeader
              title="Reportes BI Creados"
              sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {biReports.map(report => (
                  <Grid item xs={12} sm={6} md={4} key={report.id}>
                    <Card sx={{ borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)', p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea' }}>
                        {report.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Fuente: {report.source}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Registros: {report.records}
                      </Typography>
                      <Button size="small" color="error" onClick={() => handleDeleteBIReport(report.id)}>
                        <MdDelete />
                      </Button>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Diálogo para guardar consulta */}
        <Dialog open={openQueryDialog} onClose={() => setOpenQueryDialog(false)}>
          <DialogTitle sx={{ fontWeight: 600, bgcolor: '#f3f4f6' }}>
            Guardar Consulta
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              La consulta será guardada en la sesión actual
            </Typography>
            <TextField
              fullWidth
              label="Nombre de la consulta"
              value={queryConfig.name}
              onChange={(e) => setQueryConfig({ ...queryConfig, name: e.target.value })}
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#f3f4f6', p: 2 }}>
            <Button onClick={() => setOpenQueryDialog(false)} sx={{ color: '#666' }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuery} variant="contained" sx={{ bgcolor: '#667eea' }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
