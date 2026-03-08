import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Button, Stack, alpha, useTheme, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  MdArrowForward,
  MdMap,
  MdAnalytics,
  MdSupportAgent,
  MdSettings,
  MdSpaceDashboard,
  MdLocationOn,
  MdTask,
  MdPeople,
  MdHistory
} from 'react-icons/md'

export default function AccessPortalsPage() {
  const theme = useTheme()
  const navigate = useNavigate()

  const portals = [
    {
      title: 'Portal Operativo',
      description: 'Ejecución territorial diaria con panel, zonas, contactos y tareas.',
      icon: <MdMap size={30} />,
      quickLinks: [
        { label: 'Dashboard', path: '/dashboard', icon: <MdSpaceDashboard size={16} /> },
        { label: 'Territorios', path: '/zones', icon: <MdLocationOn size={16} /> },
        { label: 'Contactos', path: '/voters', icon: <MdPeople size={16} /> },
        { label: 'Tareas', path: '/tasks', icon: <MdTask size={16} /> },
      ]
    },
    {
      title: 'Portal Inteligencia',
      description: 'Análisis, indicadores y decisiones basadas en datos en tiempo real.',
      icon: <MdAnalytics size={30} />,
      quickLinks: [
        { label: 'BI y Consultas', path: '/query-analytics', icon: <MdAnalytics size={16} /> },
        { label: 'Indicadores', path: '/management-indicators', icon: <MdAnalytics size={16} /> },
        { label: 'Inteligencia Estratégica', path: '/strategic-intelligence', icon: <MdAnalytics size={16} /> },
        { label: 'Georreferencia', path: '/georeference', icon: <MdMap size={16} /> },
      ]
    },
    {
      title: 'Portal Ciudadanía',
      description: 'Interacción con comunidad, solicitudes y comunicación territorial.',
      icon: <MdSupportAgent size={30} />,
      quickLinks: [
        { label: 'Solicitudes', path: '/citizen-requests', icon: <MdSupportAgent size={16} /> },
        { label: 'Comunicación', path: '/territorial-communication', icon: <MdSupportAgent size={16} /> },
        { label: 'Encuestas', path: '/surveys', icon: <MdSupportAgent size={16} /> },
        { label: 'Archivos', path: '/files', icon: <MdSupportAgent size={16} /> },
      ]
    },
    {
      title: 'Portal Administración',
      description: 'Gestión de usuarios, datos, seguridad, auditoría y configuración.',
      icon: <MdSettings size={30} />,
      quickLinks: [
        { label: 'Usuarios', path: '/users', icon: <MdPeople size={16} /> },
        { label: 'Gestión de Datos', path: '/data-management', icon: <MdSettings size={16} /> },
        { label: 'Auditoría', path: '/audit', icon: <MdHistory size={16} /> },
        { label: 'Configuración', path: '/settings', icon: <MdSettings size={16} /> },
      ]
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 4 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
            Portales de Acceso
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 760 }}>
            Navega por secciones especializadas para mantener la plataforma ágil, intuitiva y con mejor rendimiento por rutas.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Carga por ruta" color="primary" variant="outlined" />
            <Chip label="Acceso rápido" color="secondary" variant="outlined" />
            <Chip label="Diseño responsive" color="success" variant="outlined" />
          </Stack>
        </Box>

        <Grid container spacing={2.5}>
          {portals.map((portal) => (
            <Grid item xs={12} sm={6} key={portal.title}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  transition: 'all 0.22s ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.12)}`
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, color: theme.palette.primary.main }}>
                    {portal.icon}
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {portal.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                    {portal.description}
                  </Typography>

                  <Grid container spacing={1.2} sx={{ mb: 2 }}>
                    {portal.quickLinks.map((item) => (
                      <Grid item xs={12} md={6} key={item.path}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={item.icon}
                          onClick={() => navigate(item.path)}
                          sx={{
                            justifyContent: 'flex-start',
                            borderColor: alpha(theme.palette.primary.main, 0.25),
                            color: theme.palette.primary.main,
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          {item.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  <Button
                    variant="contained"
                    endIcon={<MdArrowForward size={18} />}
                    onClick={() => navigate(portal.quickLinks[0].path)}
                  >
                    Ir al portal
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
