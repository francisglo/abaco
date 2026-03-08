import React from 'react'
import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { MdAssignment, MdReportProblem, MdTrackChanges, MdPriorityHigh } from 'react-icons/md'

const CAPABILITIES = [
  { label: 'Peticiones', icon: <MdAssignment size={18} /> },
  { label: 'Quejas', icon: <MdReportProblem size={18} /> },
  { label: 'Seguimiento de casos', icon: <MdTrackChanges size={18} /> },
  { label: 'Priorización por urgencia', icon: <MdPriorityHigh size={18} /> }
]

export default function CitizenRequestsPage() {
  const theme = useTheme()

  return (
    <Box>
      <Card
        sx={{
          mb: 2,
          background: `linear-gradient(130deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.secondary.main} 100%)`,
          color: 'white'
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={800}>Módulo de Gestión de Solicitudes Ciudadanas</Typography>
          <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
            MVP inicial para canalizar, priorizar y dar trazabilidad a solicitudes ciudadanas.
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 2 }}>
        Fase futura: este módulo ya está habilitado como pantalla base para evolución funcional.
      </Alert>

      <Grid container spacing={2}>
        {CAPABILITIES.map((item) => (
          <Grid item xs={12} md={6} key={item.label}>
            <Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: theme.palette.primary.main }}>{item.icon}</Box>
                  <Typography fontWeight={700}>{item.label}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
        <Chip size="small" label="Estado: MVP" color="primary" />
        <Chip size="small" label="Prioridad: Alta" variant="outlined" />
      </Stack>
    </Box>
  )
}
