import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Button, CardActions, useTheme, alpha, Stack, LinearProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  MdLocationOn,
  MdPeople,
  MdTask,
  MdSettings,
  MdArrowForward,
  MdCheckCircle,
  MdTrendingUp,
  MdDataset,
  MdAnalytics,
  MdSpaceDashboard,
  MdMap,
  MdSecurity,
  MdSpeed
} from 'react-icons/md'
import { RiContactsBook2Fill } from 'react-icons/ri'

export default function HomePage() {
  const navigate = useNavigate()
  const theme = useTheme()

  const modules = [
    {      title: 'Dashboard Ejecutivo',
      description: 'Vista integral del territorio con indicadores ejecutivos, graficos dinamicos y analisis en tiempo real',
      icon: <MdSpaceDashboard size={40} />,
      path: '/dashboard',
      color: '#6366f1',
      stats: { value: 8, label: 'KPIs en tiempo real' },
      status: 'Operativo'
    },
    {      title: 'Territorios',
      description: 'Gestión avanzada de zonas territoriales con asignación de prioridades y análisis de cobertura',
      icon: <MdLocationOn size={40} />,
      path: '/zones',
      color: '#0ea5e9',
      stats: { value: 12, label: 'Zonas activas' },
      status: 'Operativo'
    },
    {
      title: 'Contactos',
      description: 'Base de datos de contactos con geolocalización en tiempo real y análisis de alcance territorial',
      icon: <RiContactsBook2Fill size={40} />,
      path: '/voters',
      color: '#10b981',
      stats: { value: 1247, label: 'Contactos registrados' },
      status: 'Operativo'
    },
    {
      title: 'Usuarios',
      description: 'Gestión de accesos, roles y permisos con control granular de la plataforma',
      icon: <MdPeople size={40} />,
      path: '/users',
      color: '#f59e0b',
      stats: { value: 18, label: 'Usuarios activos' },
      status: 'Operativo'
    },
    {
      title: 'Tareas',
      description: 'Planificación, asignación y seguimiento de actividades territoriales con múltiples vistas',
      icon: <MdTask size={40} />,
      path: '/tasks',
      color: '#8b5cf6',
      stats: { value: 34, label: 'Tareas en progreso' },
      status: 'Operativo'
    },
    {
      title: 'Gestión de Datos',
      description: 'Centraliza, valida, importa y sincroniza información electoral y territorial con integridad garantizada',
      icon: <MdDataset size={40} />,
      path: '/data-management',
      color: '#ec4899',
      stats: { value: 1287, label: 'Registros totales' },
      status: 'Operativo'
    },
    {
      title: 'Análisis y Consultas',
      description: 'Business Intelligence operativo con consultas dinámicas, cruces de variables y visualizaciones avanzadas',
      icon: <MdAnalytics size={40} />,
      path: '/query-analytics',
      color: '#6366f1',
      stats: { value: 47, label: 'Consultas disponibles' },
      status: 'Operativo'
    },
    {
      title: 'Georreferenciación',
      description: 'Análisis espacial territorial con mapas interactivos, segmentación de zonas y áreas prioritarias',
      icon: <MdMap size={40} />,
      path: '/georeference',
      color: '#06b6d4',
      stats: { value: 10, label: 'Zonas georreferenciadas' },
      status: 'Operativo'
    },
    {
      title: 'Seguridad y Protección',
      description: 'Control de accesos, cifrado de datos sensibles y copias de seguridad periódicas con gestión de permisos',
      icon: <MdSecurity size={40} />,
      path: '/security',
      color: '#ef4444',
      stats: { value: 'Alta', label: 'Nivel de seguridad' },
      status: 'Operativo'
    },
    {
      title: 'Rendimiento y Disponibilidad',
      description: 'Monitoreo de sistema, optimización de recursos, gestión de caché y métricas de latencia en tiempo real',
      icon: <MdSpeed size={40} />,
      path: '/performance',
      color: '#8b5cf6',
      stats: { value: 'Óptimo', label: 'Estado del sistema' },
      status: 'Operativo'
    },
  ]

  const features = [
    { title: 'Análisis en Tiempo Real', description: 'Dashboard actualizado constantemente con métricas clave' },
    { title: 'Geolocalización Avanzada', description: 'Mapas interactivos con datos de contactos y territorios' },
    { title: 'Reportes Personalizados', description: 'Exporta datos en múltiples formatos para análisis' },
    { title: 'Control de Accesos', description: 'Administración granular de roles y permisos de usuario' },
  ]

  const useCases = [
    {
      title: 'Gestión pública y territorio',
      items: [
        '1. Gestión pública y administrativa',
        '2. Seguimiento de proyectos',
        '3. Prioridades territoriales',
        '4. Análisis de necesidades por zona',
        '5. Planeación municipal o departamental',
        '6. Relación con comunidades'
      ]
    },
    {
      title: 'Liderazgo social y gobernanza',
      items: [
        '7. Registro de líderes sociales',
        '8. Seguimiento a compromisos',
        '9. Gestión de solicitudes ciudadanas',
        '10. Mapas de problemáticas',
        '21. ONG, movimientos y organizaciones',
        '22. Proyectos sociales'
      ]
    },
    {
      title: 'Ejecución e impacto social',
      items: [
        '23. Intervenciones territoriales',
        '24. Análisis de impacto',
        '25. Gestión de beneficiarios'
      ]
    },
    {
      title: 'Inteligencia política continua',
      items: [
        '11. Inteligencia política continua',
        '12. Monitoreo de percepción',
        '13. Identificación de focos críticos',
        '14. Análisis de influencia territorial',
        '15. Estrategia de posicionamiento'
      ]
    },
    {
      title: 'Estrategia preelectoral',
      items: [
        '16. Preparación preelectoral permanente',
        '17. Construcción de base territorial',
        '18. Organización de equipos',
        '19. Identificación de apoyos',
        '20. Segmentación de votantes'
      ]
    }
  ]

  const futureModules = [
    {
      title: 'Módulo de Gestión de Solicitudes Ciudadanas',
      items: ['Peticiones', 'Quejas', 'Seguimiento de casos', 'Priorización por urgencia']
    },
    {
      title: 'Módulo de Comunicación Territorial',
      items: ['Registro de eventos', 'Seguimiento de actividades', 'Gestión de voluntarios', 'Reportes de campo']
    },
    {
      title: 'Módulo de Indicadores de Gestión',
      items: ['Cumplimiento de metas', 'Avance de proyectos', 'Impacto territorial', 'Alertas tempranas']
    },
    {
      title: 'Módulo de Inteligencia Estratégica',
      items: ['Análisis comparativo entre zonas', 'Tendencias territoriales', 'Identificación de riesgos político']
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  mb: 2,
                  letterSpacing: '-0.02em'
                }}
              >
                ÁBACO
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 3,
                  fontWeight: 500,
                  lineHeight: 1.6
                }}
              >
                Plataforma integral de gestión territorial y análisis de contactos con capacidades avanzadas de mapeo y coordinación operativa.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<MdArrowForward />}
                  onClick={() => navigate('/portales')}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #0f1f3a 100%)`,
                    '&:hover': {
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                    }
                  }}
                >
                  Explorar portales
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  Ir al dashboard
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  borderRadius: '16px',
                  p: 4,
                  textAlign: 'center',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Box sx={{ fontSize: '4rem', mb: 2, color: theme.palette.secondary.main }}>
                  <MdTrendingUp style={{ width: '100%', height: 'auto' }} />
                </Box>
                <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                  Sistema Operativo
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, opacity: 0.7, mt: 1 }}>
                  Todos los módulos listos para producción
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 7 }}>
        <Box sx={{ mb: 3.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1
            }}
          >
            Acceso por portales
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              opacity: 0.85
            }}
          >
            Accede más rápido a cada sección sin acumular toda la navegación en un único bloque.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {[
            { title: 'Portal Operativo', path: '/portales', label: 'Territorio y ejecución' },
            { title: 'Portal Inteligencia', path: '/portales', label: 'Análisis y estrategia' },
            { title: 'Portal Ciudadanía', path: '/portales', label: 'Comunidad y solicitudes' },
            { title: 'Portal Administración', path: '/portales', label: 'Usuarios y control' }
          ].map((portal) => (
            <Grid item xs={12} sm={6} md={3} key={portal.title}>
              <Card
                onClick={() => navigate(portal.path)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {portal.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                    {portal.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Modules Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1
            }}
          >
            Módulos Principales
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              opacity: 0.8
            }}
          >
            Accede a todas las funcionalidades de gestión territorial
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {modules.map((module, index) => (
            <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `1px solid ${alpha(module.color, 0.2)}`,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${alpha(module.color, 0.15)}`,
                    borderColor: module.color
                  }
                }}
                onClick={() => navigate(module.path)}
              >
                <CardContent sx={{ flex: 1, pb: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '12px',
                      background: alpha(module.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: module.color,
                      transition: 'all 0.3s'
                    }}
                  >
                    {module.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      mb: 1
                    }}
                  >
                    {module.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.6,
                      mb: 2
                    }}
                  >
                    {module.description}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: alpha(module.color, 0.08),
                      borderRadius: '8px',
                      mt: 2
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: module.color
                      }}
                    >
                      {module.stats.value}
                    </Typography>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block'
                        }}
                      >
                        {module.stats.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Button
                    fullWidth
                    variant="text"
                    endIcon={<MdArrowForward size={18} />}
                    sx={{
                      color: module.color,
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: alpha(module.color, 0.08)
                      }
                    }}
                  >
                    Acceder
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          py: 8,
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1
              }}
            >
              Capacidades Principales
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                opacity: 0.8
              }}
            >
              Herramientas avanzadas para gestión territorial eficiente
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={6} key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 3,
                    bgcolor: '#ffffff',
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`
                    }
                  }}
                >
                  <Box
                    sx={{
                      color: theme.palette.secondary.main,
                      fontSize: '1.5rem',
                      flexShrink: 0,
                      mt: 0.5
                    }}
                  >
                    <MdCheckCircle size={28} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 0.5
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Use Cases Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1
            }}
          >
            ÁBACO puede servir para
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              opacity: 0.85
            }}
          >
            Casos de uso reales para gestión pública, operación territorial e inteligencia política.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {useCases.map((block) => (
            <Grid item xs={12} md={6} key={block.title}>
              <Card
                sx={{
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  borderRadius: 2.5,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.26),
                    boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      mb: 1.5
                    }}
                  >
                    {block.title}
                  </Typography>
                  <Stack spacing={0.9}>
                    {block.items.map((item) => (
                      <Typography key={item} variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Future Modules Section */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.secondary.main, 0.05),
          borderTop: `1px solid ${alpha(theme.palette.secondary.main, 0.14)}`,
          borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.14)}`,
          py: 7,
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1
              }}
            >
              Nuevos módulos opcionales (fase futura)
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                opacity: 0.85
              }}
            >
              Roadmap funcional para ampliar capacidades operativas, sociales y estratégicas.
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {futureModules.map((module) => (
              <Grid item xs={12} md={6} key={module.title}>
                <Card
                  sx={{
                    height: '100%',
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.22)}`,
                    borderRadius: 2.5,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette.secondary.main, 0.38),
                      boxShadow: `0 12px 30px ${alpha(theme.palette.secondary.main, 0.14)}`
                    }
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 1.25
                      }}
                    >
                      {module.title}
                    </Typography>
                    <Stack spacing={0.8}>
                      {module.items.map((item) => (
                        <Typography
                          key={item}
                          variant="body2"
                          sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}
                        >
                          • {item}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box
          sx={{
            textAlign: 'center',
            p: 6,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 2
            }}
          >
            Lista para Producción
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              mb: 4,
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.8
            }}
          >
            Sistema completamente operativo con todas las funcionalidades necesarias para gestión territorial integral. Desplegable en producción con total confiabilidad.
          </Typography>
          <LinearProgress
            variant="determinate"
            value={100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`
              },
              mb: 3
            }}
          />
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            100% Sistema Operativo
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
