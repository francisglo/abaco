import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Stack, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Alert, Tooltip, IconButton } from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
  // Exportación de datos
  const handleExportExcel = () => {
    exportToExcel({ contacts: data }, 'territorial_dashboard');
  };
  const handleExportCSV = () => {
    exportToCSV(data, 'territorial_dashboard');
  };
  // Exportación PDF personalizada (puedes mejorarla según tus columnas)
  const handleExportPDF = () => {
    window.print(); // Placeholder: aquí puedes llamar a una función PDF real
  };
import MapView from '../components/MapView';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Pie } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { fetchDemographicSocialSummary, fetchZonesSecure } from '../api';

const DEFAULT_FILTERS = {
  zone_id: 'all',
};

export default function TerritorialDashboard() {
  const { token } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetchZonesSecure(token, { limit: 200, sortBy: 'name', order: 'ASC' })
      .then(res => setZones(res.data || res.zones || []))
      .catch(() => setZones([]));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    fetchDemographicSocialSummary(token, {
      limit: 8,
      zone_id: filters.zone_id !== 'all' ? filters.zone_id : undefined
    })
      .then(res => setData(res.data || res.summary || []))
      .catch(err => setError(err.message || 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [token, filters]);

  // KPIs dinámicos
  const kpis = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [
      { label: 'Proyectos Activos', value: '-', color: 'primary' },
      { label: 'Solicitudes Ciudadanas', value: '-', color: 'success' },
      { label: 'Cobertura Servicios', value: '-', color: 'info' },
      { label: 'Alertas Activas', value: '-', color: 'error' },
    ];
    // Ejemplo: sumar totales o tomar el primer elemento
    const totalProyectos = data.reduce((acc, d) => acc + (Number(d.proyectos_activos) || 0), 0);
    const totalSolicitudes = data.reduce((acc, d) => acc + (Number(d.solicitudes) || 0), 0);
    const coberturaProm = data.length ? (data.reduce((acc, d) => acc + (Number(d.cobertura_servicios) || 0), 0) / data.length).toFixed(1) + '%' : '-';
    const alertas = data.reduce((acc, d) => acc + (Number(d.alertas_activas) || 0), 0);
    return [
      { label: 'Proyectos Activos', value: totalProyectos, color: 'primary' },
      { label: 'Solicitudes Ciudadanas', value: totalSolicitudes, color: 'success' },
      { label: 'Cobertura Servicios', value: coberturaProm, color: 'info' },
      { label: 'Alertas Activas', value: alertas, color: 'error' },
    ];
  }, [data]);

  // Pie chart dinámico
  const pieData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return {
      labels: [],
      datasets: []
    };
    // Agrupar por sector
    const sectorMap = {};
    data.forEach(d => {
      const sector = d.sector || 'Otro';
      sectorMap[sector] = (sectorMap[sector] || 0) + 1;
    });
    const labels = Object.keys(sectorMap);
    const values = Object.values(sectorMap);
    return {
      labels,
      datasets: [
        {
          label: 'Proyectos',
          data: values,
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a21caf'],
        },
      ],
    };
  }, [data]);

  const handleFilterChange = (field, value) => {
    setFilters(f => ({ ...f, [field]: value }));
  };
  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Territorial Público</Typography>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
                kpi.label === 'Proyectos Activos' ? 'Cantidad total de proyectos activos en las zonas seleccionadas.' :
                kpi.label === 'Solicitudes Ciudadanas' ? 'Total de solicitudes ciudadanas registradas.' :
                kpi.label === 'Cobertura Servicios' ? 'Porcentaje promedio de cobertura de servicios.' :
                kpi.label === 'Alertas Activas' ? 'Número de alertas activas detectadas.' :
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
          <Typography variant="h6" sx={{ mb: 2 }}>Proyectos por Sector</Typography>
          <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </CardContent>
      </Card>
      <Box sx={{ mt: 4 }}>
        <AdvancedAnalytics contacts={[]} territories={[]} />
      </Box>
    </Box>
  );
}
