import React from 'react';
import { Box, Typography } from '@mui/material';
import MapView from '../components/MapView';
import StatsCard from '../components/StatsCard';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';

const mockKPIs = [
  { label: 'Proyectos Priorizados', value: '18', color: 'primary' },
  { label: 'Ejecución Física', value: '74%', color: 'success' },
  { label: 'Ejecución Financiera', value: '68%', color: 'info' },
  { label: 'Alertas de Riesgo', value: '2', color: 'error' },
];

const doughnutData = {
  labels: ['Salud', 'Educación', 'Infraestructura', 'Social'],
  datasets: [
    {
      label: 'Inversión (M$)',
      data: [4.2, 3.1, 5.6, 2.7],
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
    },
  ],
};

export default function InversionPublicaDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Inversión Pública</Typography>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Inversión por Sector</Typography>
          <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </CardContent>
      </Card>
      <Box sx={{ mt: 4 }}>
        <AdvancedAnalytics contacts={[]} territories={[]} />
      </Box>
    </Box>
  );
}
