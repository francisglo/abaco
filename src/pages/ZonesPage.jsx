import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchZones, createZone, updateZone, deleteZone } from '../store/zonesSlice'
import ProtectedRoute from '../components/ProtectedRoute'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material'
import { MdAdd, MdDelete, MdEdit, MdFileUpload, MdFileDownload, MdSearch, MdMap } from 'react-icons/md'

export default function ZonesPage() {
  const dispatch = useDispatch()
  const { zones, loading, error } = useSelector(state => state.zones)

  const [query, setQuery] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState(null)
  const [zoneForm, setZoneForm] = useState({ name: '', priority: 1, manager: '', description: '' })
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!zones || zones.length === 0) dispatch(fetchZones())
  }, [dispatch])

  const filteredZones = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return zones || []
    return (zones || []).filter(z => z.name?.toLowerCase().includes(q) || String(z.priority ?? '').includes(q))
  }, [zones, query])

  const avgPriority = useMemo(() => {
    if (!zones || zones.length === 0) return 0
    const total = zones.reduce((sum, zone) => sum + Number(zone.priority || 0), 0)
    return (total / zones.length).toFixed(1)
  }, [zones])

  const handleOpenCreate = () => {
    setEditing(null)
    setZoneForm({ name: '', priority: 1, manager: '', description: '' })
    setOpenDialog(true)
  }

  const handleOpenEdit = (zone) => {
    setEditing(zone)
    setZoneForm({
      name: zone.name || '',
      priority: Number(zone.priority || 1),
      manager: zone.manager || '',
      description: zone.description || ''
    })
    setOpenDialog(true)
  }

  const handleSave = () => {
    if (!zoneForm.name?.trim()) return

    const payload = {
      name: zoneForm.name.trim(),
      priority: Number(zoneForm.priority || 1),
      manager: zoneForm.manager?.trim() || '',
      description: zoneForm.description?.trim() || ''
    }

    if (editing) {
      dispatch(updateZone({ id: editing.id, payload: { ...editing, ...payload } }))
    } else {
      dispatch(createZone(payload))
    }

    setOpenDialog(false)
  }

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar zona?')) return
    dispatch(deleteZone(id))
  }

  const handlePriorityStep = (zone, delta) => {
    const nextPriority = Math.min(10, Math.max(1, Number(zone.priority || 1) + delta))
    dispatch(updateZone({ id: zone.id, payload: { ...zone, priority: nextPriority } }))
  }

  const handleDuplicateZone = (zone) => {
    dispatch(createZone({
      name: `${zone.name} (Copia)`,
      priority: Number(zone.priority || 1),
      manager: zone.manager || '',
      description: zone.description || ''
    }))
  }

  const escapeCSV = (value = '') => {
    const cleaned = String(value).replace(/"/g, '""')
    return `"${cleaned}"`
  }

  const handleExportCSV = () => {
    const header = ['name', 'priority']
    const rows = (zones || []).map(zone => `${escapeCSV(zone.name)},${zone.priority || ''}`)
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'zonas.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportCSV = (event) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const text = String(reader.result || '')
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
      const dataLines = lines.slice(1)

      for (const line of dataLines) {
        const cols = line.split(',').map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'))
        const [name, priority] = cols
        if (!name) continue
        await dispatch(createZone({ name: name.trim(), priority: priority ? Number(priority) : 1 }))
      }

      event.target.value = ''
    }

    reader.readAsText(file)
  }

  return (
    <ProtectedRoute>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MdMap style={{ color: '#667eea' }} />
            Gestión Territorial de Zonas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra la estructura territorial con diseño avanzado y controles de importación/exportación.
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Total de zonas</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>{(zones || []).length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Prioridad promedio</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#764ba2' }}>{avgPriority}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Resultados filtrados</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#00b37e' }}>{filteredZones.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <TextField
              placeholder="Buscar zona por nombre o prioridad..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch color="#667eea" />
                  </InputAdornment>
                )
              }}
            />
            <Stack direction="row" spacing={1.2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                onClick={handleOpenCreate}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Nueva zona
              </Button>
              <Button variant="outlined" startIcon={<MdFileDownload />} onClick={handleExportCSV} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                Exportar
              </Button>
              <Button variant="outlined" startIcon={<MdFileUpload />} onClick={() => fileInputRef.current?.click()} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                Importar
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleImportCSV} style={{ display: 'none' }} />
            </Stack>
          </Stack>
        </Paper>

        {loading && <Typography variant="body2" color="text.secondary">Cargando zonas...</Typography>}
        {error && <Typography variant="body2" color="error">{error}</Typography>}

        <Grid container spacing={2}>
          {(filteredZones || []).map(zone => (
            <Grid item xs={12} md={6} lg={4} key={zone.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{zone.name}</Typography>
                      <Chip label={`Prioridad ${zone.priority ?? '—'}`} size="small" sx={{ mt: 1, fontWeight: 600 }} />
                      {zone.manager && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Responsable: {zone.manager}
                        </Typography>
                      )}
                      {zone.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {zone.description}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handlePriorityStep(zone, -1)} title="Bajar prioridad numérica">
                        -
                      </IconButton>
                      <IconButton size="small" onClick={() => handlePriorityStep(zone, +1)} title="Subir prioridad numérica">
                        +
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDuplicateZone(zone)} title="Duplicar zona">⧉</IconButton>
                      <IconButton size="small" onClick={() => handleOpenEdit(zone)}><MdEdit /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(zone.id)}><MdDelete /></IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {!loading && filteredZones.length === 0 && (
          <Paper elevation={0} sx={{ mt: 2, p: 3, borderRadius: 2, border: '1px dashed rgba(0,0,0,0.2)' }}>
            <Typography variant="body2" color="text.secondary">No hay zonas para mostrar.</Typography>
          </Paper>
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Editar zona' : 'Crear nueva zona'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre de la zona"
                value={zoneForm.name}
                onChange={(event) => setZoneForm(prev => ({ ...prev, name: event.target.value }))}
                fullWidth
              />
              <TextField
                type="number"
                label="Prioridad"
                value={zoneForm.priority}
                onChange={(event) => setZoneForm(prev => ({ ...prev, priority: Number(event.target.value || 1) }))}
                inputProps={{ min: 1, max: 10 }}
                fullWidth
              />
              <TextField
                label="Responsable"
                value={zoneForm.manager}
                onChange={(event) => setZoneForm(prev => ({ ...prev, manager: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Descripción"
                value={zoneForm.description}
                onChange={(event) => setZoneForm(prev => ({ ...prev, description: event.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedRoute>
  )
}
