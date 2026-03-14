import React from 'react';
import { Box, Typography } from '@mui/material';
import MapView from '../components/MapView';
import StatsCard from '../components/StatsCard';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import { Line } from 'react-chartjs-2';

const mockKPIs = [
  { label: 'Zonas Urbanas', value: '22', color: 'primary' },
  { label: 'Expansión Urbana (%)', value: '13%', color: 'success' },
  { label: 'Déficit Vivienda', value: '4,800', color: 'error' },
  { label: 'Proyectos Sostenibles', value: '6', color: 'info' },
];

const lineData = {
  labels: ['2019', '2020', '2021', '2022', '2023'],
  datasets: [
    {
      label: 'Expansión Urbana (%)',
      data: [8, 9, 10, 12, 13],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4,
      fill: true,
    },
  ],
};

export default function OrdenamientoTerritorialDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Ordenamiento Territorial</Typography>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Evolución de Expansión Urbana</Typography>
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </CardContent>
      </Card>
      <Box sx={{ mt: 4 }}>
        <AdvancedAnalytics contacts={[]} territories={[]} />
      </Box>
    </Box>
  );
}
