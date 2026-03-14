import React from 'react';
import { Box, Typography } from '@mui/material';
import MapView from '../components/MapView';
import StatsCard from '../components/StatsCard';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const mockKPIs = [
  { label: 'Zonas Bancarizadas', value: '95%', color: 'primary' },
  { label: 'Población Excluida', value: '8,200', color: 'error' },
  { label: 'Instituciones Financieras', value: '32', color: 'info' },
  { label: 'Programas Activos', value: '5', color: 'success' },
];

const barData = {
  labels: ['Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste'],
  datasets: [
    {
      label: 'Población Excluida',
      data: [1200, 2500, 1800, 2700],
      backgroundColor: '#ef4444',
    },
  ],
};

export default function InclusionFinancieraDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Inclusión Financiera</Typography>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Población Excluida por Zona</Typography>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </CardContent>
      </Card>
      <Box sx={{ mt: 4 }}>
        <AdvancedAnalytics contacts={[]} territories={[]} />
      </Box>
    </Box>
  );
}
