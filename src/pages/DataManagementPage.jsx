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
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdFileDownload,
  MdFileUpload,
  MdSearch,
  MdRefresh,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdInfo,
  MdVerified,
  MdSync,
} from 'react-icons/md'

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [dataType, setDataType] = useState('voters') // voters, zones, users, tasks
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [validationStats, setValidationStats] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, success, error
  const [message, setMessage] = useState('')

  // Definiciones de campos por tipo de dato
  const fieldDefinitions = {
    voters: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'dni', label: 'DNI/Cédula', type: 'text', required: true, pattern: '^[0-9]{6,10}$' },
      { key: 'phone', label: 'Teléfono', type: 'text', required: true, pattern: '^[0-9\\-\\+\\s]{10,}$' },
      { key: 'email', label: 'Email', type: 'email', required: false, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      { key: 'address', label: 'Dirección', type: 'text', required: true },
      { key: 'status', label: 'Estado', type: 'select', required: true, options: ['pending', 'confirmed', 'active', 'inactive'] },
      { key: 'priority', label: 'Prioridad', type: 'select', required: true, options: ['low', 'medium', 'high'] },
      { key: 'lat', label: 'Latitud', type: 'number', required: false },
      { key: 'lng', label: 'Longitud', type: 'number', required: false },
    ],
    zones: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'priority', label: 'Prioridad', type: 'number', required: true },
      { key: 'manager', label: 'Responsable', type: 'text', required: false },
      { key: 'description', label: 'Descripción', type: 'text', required: false },
    ],
    users: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Teléfono', type: 'text', required: false },
      { key: 'role', label: 'Rol', type: 'select', required: true, options: ['admin', 'operator', 'auditor', 'viewer'] },
      { key: 'active', label: 'Activo', type: 'checkbox', required: false },
    ],
    tasks: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'text', required: false },
      { key: 'status', label: 'Estado', type: 'select', required: true, options: ['pending', 'in_progress', 'completed', 'cancelled'] },
      { key: 'priority', label: 'Prioridad', type: 'select', required: true, options: ['low', 'medium', 'high'] },
      { key: 'dueDate', label: 'Fecha Vencimiento', type: 'date', required: false },
    ],
  }

  // Cargar datos
  useEffect(() => {
    loadData()
  }, [dataType])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:4000/${dataType}`)
      if (response.ok) {
        const fetchedData = await response.json()
        setData(Array.isArray(fetchedData) ? fetchedData : [])
      }
    } catch (error) {
      setMessage(`Error cargando datos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar datos por búsqueda
  const filteredData = data.filter(item => {
    const searchStr = searchTerm.toLowerCase()
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchStr)
    )
  })

  // Validar un registro
  const validateRecord = (record) => {
    const fields = fieldDefinitions[dataType]
    const errors = []

    fields.forEach(field => {
      const value = record[field.key]
      
      if (field.required && !value) {
        errors.push(`${field.label} es requerido`)
      } else if (value && field.pattern) {
        const regex = new RegExp(field.pattern)
        if (!regex.test(String(value))) {
          errors.push(`${field.label} tiene formato inválido`)
        }
      }
    })

    return errors
  }

  // Abrir diálogo
  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id)
      setFormData(item)
    } else {
      setEditingId(null)
      setFormData({})
    }
    setOpenDialog(true)
  }

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({})
    setEditingId(null)
  }

  // Guardar registro
  const handleSave = async () => {
    const errors = validateRecord(formData)
    if (errors.length > 0) {
      setMessage(`Errores de validación: ${errors.join(', ')}`)
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId 
        ? `http://localhost:4000/${dataType}/${editingId}`
        : `http://localhost:4000/${dataType}`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage(`${editingId ? 'Actualizado' : 'Creado'} exitosamente`)
        handleCloseDialog()
        loadData()
      } else {
        setMessage('Error al guardar los datos')
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
  }

  // Eliminar registro
  const handleDelete = async (id) => {
    if (!window.confirm('¿Confirma la eliminación?')) return

    try {
      const response = await fetch(`http://localhost:4000/${dataType}/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setMessage('Eliminado exitosamente')
        loadData()
      }
    } catch (error) {
      setMessage(`Error al eliminar: ${error.message}`)
    }
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      setMessage('No hay datos para exportar')
      return
    }

    const fields = fieldDefinitions[dataType]
    const headers = fields.map(f => f.key)
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row =>
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${dataType}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setMessage('Datos exportados exitosamente')
  }

  // Importar desde CSV
  const handleImportCSV = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result
        const lines = csv.split('\n')
        const headers = lines[0].split(',')
        const fields = fieldDefinitions[dataType]

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue

          const values = lines[i].split(',')
          const newRecord = {}

          headers.forEach((header, idx) => {
            const field = fields.find(f => f.key === header.trim())
            if (field) {
              let value = values[idx]?.trim().replace(/^"|"$/g, '')
              
              if (field.type === 'number') value = Number(value)
              if (field.type === 'checkbox') value = value === 'true'
              
              newRecord[header.trim()] = value
            }
          })

          if (Object.keys(newRecord).length > 0) {
            await fetch(`http://localhost:4000/${dataType}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newRecord),
            })
          }
        }

        setMessage(`Importación completada: ${lines.length - 1} registros procesados`)
        loadData()
      } catch (error) {
        setMessage(`Error en importación: ${error.message}`)
      }
    }
    reader.readAsText(file)
  }

  // Validar integridad de datos
  const handleValidateIntegrity = () => {
    const stats = {
      total: data.length,
      valid: 0,
      errors: [],
      warnings: [],
    }

    data.forEach((record, idx) => {
      const errors = validateRecord(record)
      if (errors.length === 0) {
        stats.valid++
      } else {
        stats.errors.push({ recordId: record.id, issues: errors })
      }
    })

    setValidationStats(stats)
    setMessage(`Validación completada: ${stats.valid}/${stats.total} registros válidos`)
  }

  // Sincronizar datos
  const handleSync = async () => {
    try {
      setSyncStatus('syncing')

      const resources = ['voters', 'zones', 'users', 'tasks']
      const counts = {}
      let total = 0
      let valid = 0

      for (const resource of resources) {
        const response = await fetch(`http://localhost:4000/${resource}`)
        if (!response.ok) throw new Error(`No se pudo sincronizar ${resource}`)

        const rows = await response.json()
        counts[resource] = rows.length
        total += rows.length

        if (resource === dataType) {
          rows.forEach((record) => {
            if (validateRecord(record).length === 0) valid += 1
          })
        }
      }

      const integrity = total > 0 ? Number(((valid / Math.max(data.length, 1)) * 100).toFixed(1)) : 100

      await fetch('http://localhost:4000/metrics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncStatus: 'synchronized',
          dataIntegrity: Number.isFinite(integrity) ? integrity : 100,
          lastSyncAt: new Date().toISOString(),
          totalContacts: counts.voters || 0,
          tasksOpen: counts.tasks || 0,
        })
      })

      setSyncStatus('success')
      setMessage(`Sincronización completada: voters=${counts.voters || 0}, zones=${counts.zones || 0}, users=${counts.users || 0}, tasks=${counts.tasks || 0}`)
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (error) {
      setSyncStatus('error')
      setMessage(`Error de sincronización: ${error.message}`)
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const fields = fieldDefinitions[dataType] || []

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1f2937' }}>
            Gestión de Datos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Centraliza, valida e importa información electoral y territorial
          </Typography>
        </Box>

        {/* Messages */}
        {message && (
          <Alert 
            severity={message.includes('Error') ? 'error' : 'success'}
            onClose={() => setMessage('')}
            sx={{ mb: 3 }}
          >
            {message}
          </Alert>
        )}

        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MdInfo size={14} /> Total de Registros
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mt: 1 }}>
                  {data.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MdCheckCircle size={14} /> Válidos
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mt: 1 }}>
                  {validationStats?.valid || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MdWarning size={14} /> Con Errores
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mt: 1 }}>
                  {validationStats?.errors?.length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MdSync size={14} /> Estado
                </Typography>
                <Chip 
                  icon={syncStatus === 'syncing' ? undefined : syncStatus === 'success' ? <MdCheckCircle /> : <MdSync />}
                  label={syncStatus === 'idle' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Éxito'}
                  color={syncStatus === 'success' ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs para cambiar tipo de dato */}
        <Card sx={{ borderRadius: 2, mb: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
          <Tabs 
            value={dataType === 'voters' ? 0 : dataType === 'zones' ? 1 : dataType === 'users' ? 2 : 3}
            onChange={(e, value) => {
              const types = ['voters', 'zones', 'users', 'tasks']
              setDataType(types[value])
              setSearchTerm('')
            }}
            sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
          >
            <Tab label="Votantes (Contactos)" />
            <Tab label="Zonas (Territorios)" />
            <Tab label="Usuarios" />
            <Tab label="Tareas" />
          </Tabs>
        </Card>

        {/* Herramientas */}
        <Card sx={{ borderRadius: 2, mb: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar registros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MdSearch /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<MdAdd />}
                    onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: '#667eea' }}
                  >
                    Nuevo
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MdFileDownload />}
                    onClick={handleExportCSV}
                  >
                    Exportar CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MdFileUpload />}
                    component="label"
                  >
                    Importar CSV
                    <input
                      type="file"
                      accept=".csv"
                      hidden
                      onChange={handleImportCSV}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MdCheckCircle />}
                    onClick={handleValidateIntegrity}
                  >
                    Validar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MdRefresh />}
                    onClick={loadData}
                  >
                    Actualizar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MdSync />}
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing'}
                  >
                    {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de datos */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                <TableRow>
                  {fields.map(field => (
                    <TableCell key={field.key} sx={{ fontWeight: 600, color: '#374151' }}>
                      {field.label}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                      {fields.map(field => (
                        <TableCell key={field.key} sx={{ fontSize: '0.9rem' }}>
                          {field.type === 'select' ? (
                            <Chip
                              label={row[field.key]}
                              size="small"
                              color={
                                row[field.key] === 'high' || row[field.key] === 'admin' || row[field.key] === 'active'
                                  ? 'error'
                                  : row[field.key] === 'pending' || row[field.key] === 'low'
                                  ? 'warning'
                                  : 'success'
                              }
                              variant="outlined"
                            />
                          ) : (
                            String(row[field.key] || '-')
                          )}
                        </TableCell>
                      ))}
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(row)}
                          sx={{ color: '#667eea' }}
                        >
                          <MdEdit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(row.id)}
                          sx={{ color: '#ef4444' }}
                        >
                          <MdDelete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={fields.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                      No hay registros disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog para crear/editar */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, bgcolor: '#f3f4f6' }}>
            {editingId ? 'Editar Registro' : 'Crear Nuevo Registro'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {fields.map(field => (
                <Box key={field.key}>
                  {field.type === 'select' ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>{field.label}</InputLabel>
                      <Select
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        label={field.label}
                      >
                        {field.options?.map(opt => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : field.type === 'checkbox' ? (
                    <Box>
                      <FormControl fullWidth size="small">
                        <InputLabel>Selecciona</InputLabel>
                        <Select
                          value={formData[field.key] ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value === 'true' })}
                          label={field.label}
                        >
                          <MenuItem value="true">Sí</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      type={field.type}
                      label={field.label}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      multiline={field.type === 'text' && field.key.includes('description')}
                      rows={field.type === 'text' && field.key.includes('description') ? 3 : 1}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#f3f4f6', p: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#666' }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#667eea' }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
