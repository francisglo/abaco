import React from 'react';
import { Box, Typography } from '@mui/material';
import MapView from '../components/MapView';
import StatsCard from '../components/StatsCard';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const mockKPIs = [
  { label: 'Clústeres Identificados', value: '14', color: 'primary' },
  { label: 'Oportunidades Productivas', value: '27', color: 'success' },
  { label: 'Proyectos en Marcha', value: '9', color: 'info' },
  { label: 'Zonas Prioritarias', value: '6', color: 'error' },
];

const barData = {
  labels: ['Agro', 'Industrial', 'Servicios', 'Comercio', 'Tecnología'],
  datasets: [
    {
      label: 'Oportunidades',
      data: [7, 5, 6, 4, 5],
      backgroundColor: '#f59e0b',
    },
  ],
};

export default function DesarrolloEconomicoDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard Desarrollo Económico Territorial</Typography>
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
          <Typography variant="h6" sx={{ mb: 2 }}>Oportunidades por Sector</Typography>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </CardContent>
      </Card>
      <Box sx={{ mt: 4 }}>
        <AdvancedAnalytics contacts={[]} territories={[]} />
      </Box>
    </Box>
  );
}
