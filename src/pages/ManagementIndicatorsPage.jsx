import React from 'react'
import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { MdTaskAlt, MdTrendingUp, MdPublic, MdWarning } from 'react-icons/md'

const CAPABILITIES = [
  { label: 'Cumplimiento de metas', icon: <MdTaskAlt size={18} /> },
  { label: 'Avance de proyectos', icon: <MdTrendingUp size={18} /> },
  { label: 'Impacto territorial', icon: <MdPublic size={18} /> },
  { label: 'Alertas tempranas', icon: <MdWarning size={18} /> }
]

export default function ManagementIndicatorsPage() {
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
          <Typography variant="h5" fontWeight={800}>Módulo de Indicadores de Gestión</Typography>
          <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
            MVP inicial para medir desempeño, resultados y señales de riesgo en operación territorial.
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
        <Chip size="small" label="Enfoque: Resultados" variant="outlined" />
      </Stack>
    </Box>
  )
}
