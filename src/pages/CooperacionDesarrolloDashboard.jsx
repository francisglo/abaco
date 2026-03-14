import React from 'react';
import { Box, Typography } from '@mui/material';
import MapView from '../components/MapView';
import StatsCard from '../components/StatsCard';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import { Pie } from 'react-chartjs-2';

const mockKPIs = [
  { label: 'Proyectos de Cooperación', value: '11', color: 'primary' },
  { label: 'Donantes Activos', value: '7', color: 'success' },
  { label: 'Impacto Social', value: 'Alto', color: 'info' },
  { label: 'Territorios Prioritarios', value: '4', color: 'error' },
];

const pieData = {
  labels: ['Salud', 'Educación', 'Infraestructura', 'Social'],
  datasets: [
    {
      label: 'Proyectos',
      data: [3, 2, 4, 2],
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
    },
  ],
};

export default function CooperacionDesarrolloDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Cooperación y Desarrollo</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {mockKPIs.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card>
              <CardContent>
                <Stack direction="column" alignItems="center" spacing={1}>
                  <Chip label={kpi.label} color={kpi.color} variant="outlined" />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{kpi.value}</Typography>
                </Stack>
              </CardContent>
            </Card>
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
