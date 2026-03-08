/**
 * ÁBACO - Filtros Avanzados y Búsqueda Inteligente
 */

import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Button,
  Collapse,
  Grid,
  Slider
} from '@mui/material'
import { MdFilterList, MdSave, MdClear } from 'react-icons/md'

export default function AdvancedFilters({ onApplyFilters, savedFilters = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    territoryId: [],
    verticalId: [],
    dateRange: [null, null],
    tags: [],
    segment: '',
    minScore: 0,
    maxScore: 100
  })

  const applyFilters = () => {
    onApplyFilters(filters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      status: [],
      priority: [],
      territoryId: [],
      verticalId: [],
      dateRange: [null, null],
      tags: [],
      segment: '',
      minScore: 0,
      maxScore: 100
    }
    setFilters(emptyFilters)
    onApplyFilters(emptyFilters)
  }

  const saveCurrentFilter = () => {
    const filterName = prompt('Nombre para este filtro:')
    if (filterName) {
      const saved = JSON.parse(localStorage.getItem('savedFilters') || '[]')
      saved.push({ name: filterName, filters, id: Date.now() })
      localStorage.setItem('savedFilters', JSON.stringify(saved))
      alert('Filtro guardado exitosamente')
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<MdFilterList />}
          onClick={() => setExpanded(!expanded)}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Filtros Avanzados
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<MdSave />} onClick={saveCurrentFilter}>
            Guardar
          </Button>
          <Button size="small" startIcon={<MdClear />} onClick={clearFilters}>
            Limpiar
          </Button>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                multiple
                value={filters.status}
                label="Estado"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="confirmed">Confirmado</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Prioridad</InputLabel>
              <Select
                multiple
                value={filters.priority}
                label="Prioridad"
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="low">Baja</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Desde"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.dateRange[0] || ''}
              onChange={(e) => setFilters({ ...filters, dateRange: [e.target.value, filters.dateRange[1]] })}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Hasta"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.dateRange[1] || ''}
              onChange={(e) => setFilters({ ...filters, dateRange: [filters.dateRange[0], e.target.value] })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              Rango de Score: {filters.minScore} - {filters.maxScore}
            </Typography>
            <Slider
              value={[filters.minScore, filters.maxScore]}
              onChange={(e, newValue) => setFilters({ ...filters, minScore: newValue[0], maxScore: newValue[1] })}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              sx={{ color: '#667eea' }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Segmento</InputLabel>
              <Select
                value={filters.segment}
                label="Segmento"
                onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="high_engagement">Alto Engagement</MenuItem>
                <MenuItem value="moderate_engagement">Engagement Moderado</MenuItem>
                <MenuItem value="low_engagement">Bajo Engagement</MenuItem>
                <MenuItem value="stakeholder">Stakeholder</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              onClick={applyFilters}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Aplicar Filtros
            </Button>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  )
}
