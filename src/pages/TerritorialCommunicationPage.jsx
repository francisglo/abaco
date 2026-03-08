import React from 'react'
import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { MdEventNote, MdChecklist, MdGroups, MdDescription } from 'react-icons/md'

const CAPABILITIES = [
  { label: 'Registro de eventos', icon: <MdEventNote size={18} /> },
  { label: 'Seguimiento de actividades', icon: <MdChecklist size={18} /> },
  { label: 'Gestión de voluntarios', icon: <MdGroups size={18} /> },
  { label: 'Reportes de campo', icon: <MdDescription size={18} /> }
]

export default function TerritorialCommunicationPage() {
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
          <Typography variant="h5" fontWeight={800}>Módulo de Comunicación Territorial</Typography>
          <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
            MVP inicial para coordinar acciones de campo, equipos territoriales y evidencias operativas.
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
        <Chip size="small" label="Cobertura: Territorial" variant="outlined" />
      </Stack>
    </Box>
  )
}
