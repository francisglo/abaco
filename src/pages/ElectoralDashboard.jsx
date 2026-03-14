import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Button, CircularProgress, Alert, Tooltip, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
  // Exportación de datos
  const handleExportExcel = () => {
    exportToExcel({ contacts: data }, 'electoral_dashboard');
  };
  const handleExportCSV = () => {
    exportToCSV(data, 'electoral_dashboard');
  };
  // Exportación PDF personalizada (puedes mejorarla según tus columnas)
  const handleExportPDF = () => {
    window.print(); // Placeholder: aquí puedes llamar a una función PDF real
  };
import MapView from '../components/MapView';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { useViewContext } from '../context/ViewContext';
import { fetchOperationalZonePrioritization, fetchZonesSecure } from '../api';

const DEFAULT_FILTERS = {
  zone_id: 'all',
  padron: '',
  participacion: '',
  solicitudes: '',
  riesgo: '',
  cobertura: ''
};

export default function ElectoralDashboard() {
  const { token } = useAuth();
  const { territory, territoryFilterMode } = useViewContext();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);

  // Cargar zonas para el filtro
  useEffect(() => {
    if (!token) return;
    fetchZonesSecure(token, { limit: 200, sortBy: 'name', order: 'ASC' })
      .then(res => setZones(res.data || res.zones || []))
      .catch(() => setZones([]));
  }, [token]);

  // Cargar datos reales
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    fetchOperationalZonePrioritization(token, {
      limit: 10,
      ...filters,
      zone_id: filters.zone_id !== 'all' ? filters.zone_id : undefined
    })
      .then(res => setData(res.data || res.zones || []))
      .catch(err => setError(err.message || 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [token, filters]);

  // KPIs dinámicos
  const kpis = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [
      { label: 'Participación Electoral', value: '-', color: 'primary' },
      { label: 'Votantes Registrados', value: '-', color: 'success' },
      { label: 'Mesas Habilitadas', value: '-', color: 'info' },
      { label: 'Zonas con Riesgo', value: '-', color: 'error' },
    ];
    // Ejemplo: sumar totales o tomar el primer elemento
    const totalVotantes = data.reduce((acc, z) => acc + (Number(z.votantes_registrados) || 0), 0);
    const totalMesas = data.reduce((acc, z) => acc + (Number(z.mesas_habilitadas) || 0), 0);
    const zonasRiesgo = data.filter(z => Number(z.riesgo) > 70).length;
    const participacionProm = data.length ? (data.reduce((acc, z) => acc + (Number(z.participacion) || 0), 0) / data.length).toFixed(1) + '%' : '-';
    return [
      { label: 'Participación Electoral', value: participacionProm, color: 'primary' },
      { label: 'Votantes Registrados', value: totalVotantes.toLocaleString(), color: 'success' },
      { label: 'Mesas Habilitadas', value: totalMesas.toLocaleString(), color: 'info' },
      { label: 'Zonas con Riesgo', value: zonasRiesgo, color: 'error' },
    ];
  }, [data]);

  // Datos para el gráfico
  const barData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return {
      labels: [],
      datasets: []
    };
    return {
      labels: data.map(z => z.nombre || z.zone_name || z.name || `Zona ${z.id}`),
      datasets: [
        {
          label: 'Participación (%)',
          data: data.map(z => Number(z.participacion) || 0),
          backgroundColor: '#6366f1',
        },
      ],
    };
  }, [data]);

  // Filtros UI
  const handleFilterChange = (field, value) => {
    setFilters(f => ({ ...f, [field]: value }));
  };
  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Electoral</Typography>
      {/* Botones de exportación */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Tooltip title="Exportar a PDF">
          <span>
            <IconButton color="primary" onClick={handleExportPDF} aria-label="Exportar PDF">
              <PictureAsPdfIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Exportar a Excel (.xlsx)">
          <span>
            <IconButton color="success" onClick={handleExportExcel} aria-label="Exportar Excel">
              <TableChartIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Exportar a CSV">
          <span>
            <IconButton color="info" onClick={handleExportCSV} aria-label="Exportar CSV">
              <FileCopyIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip title="Filtra los datos por zona geográfica.">
            <FormControl fullWidth size="small">
              <InputLabel>Zona</InputLabel>
              <Select
                value={filters.zone_id}
                label="Zona"
                onChange={e => handleFilterChange('zone_id', e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                {zones.map(z => (
                  <MenuItem key={z.id} value={z.id}>{z.name || z.nombre || z.zone_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip title="Filtra por porcentaje de participación electoral.">
            <TextField label="Participación (%)" size="small" type="number" value={filters.participacion} onChange={e => handleFilterChange('participacion', e.target.value)} fullWidth />
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip title="Filtra por cantidad de solicitudes registradas.">
            <TextField label="Solicitudes" size="small" type="number" value={filters.solicitudes} onChange={e => handleFilterChange('solicitudes', e.target.value)} fullWidth />
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip title="Filtra por nivel de riesgo detectado en la zona.">
            <TextField label="Riesgo" size="small" type="number" value={filters.riesgo} onChange={e => handleFilterChange('riesgo', e.target.value)} fullWidth />
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip title="Filtra por cobertura de mesas o servicios.">
            <TextField label="Cobertura" size="small" type="number" value={filters.cobertura} onChange={e => handleFilterChange('cobertura', e.target.value)} fullWidth />
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Button variant="outlined" onClick={handleResetFilters} fullWidth>Limpiar</Button>
        </Grid>
      </Grid>
      {loading && <CircularProgress size={24} sx={{ my: 2 }} />}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Tooltip
              title={
                kpi.label === 'Participación Electoral' ? 'Porcentaje promedio de participación en la zona seleccionada.' :
                kpi.label === 'Votantes Registrados' ? 'Cantidad total de votantes registrados en las zonas filtradas.' :
                kpi.label === 'Mesas Habilitadas' ? 'Total de mesas habilitadas para la votación.' :
                kpi.label === 'Zonas con Riesgo' ? 'Número de zonas con nivel de riesgo alto (>70).' :
                ''
              }
            >
              <Card>
                <CardContent>
                  <Stack direction="column" alignItems="center" spacing={1}>
                    <Chip label={kpi.label} color={kpi.color} variant="outlined" />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{kpi.value}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ my: 3 }}>
        <MapView geojson={{ type: 'FeatureCollection', features: [] }} />
      </Box>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Participación por Zona</Typography>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </CardContent>
      </Card>
      <Box sx={{ mt: 4 }}>
        <AdvancedAnalytics contacts={[]} territories={[]} />
      </Box>
    </Box>
  );
}
