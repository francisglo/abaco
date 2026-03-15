import React from 'react'
import { motion } from 'framer-motion'
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
import { Tooltip } from '@mui/material'

export default function HomePage() {
    React.useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
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
          position: 'relative',
          minHeight: { xs: 380, sm: 520, md: 600 },
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          mb: { xs: 3, sm: 6 },
        }}
      >
        {/* Imagen de fondo tipo SpaceX */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(https://sxcontent9668.azureedge.us/cms-assets/assets/SLC_4_E_600x600_24dd9e969c.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.45) grayscale(0.2)',
            zIndex: 1,
            transition: 'filter 0.4s',
          }}
        />
        {/* Overlay oscuro */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(10,10,10,0.72)',
            zIndex: 2,
          }}
        />
        {/* Contenido hero */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
          <Grid container spacing={0} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ textAlign: 'center', py: { xs: 7, sm: 10 } }}>
                <Typography
                  variant={useMediaQuery(theme.breakpoints.down('sm')) ? 'h3' : 'h1'}
                  sx={{
                    fontWeight: 900,
                    color: '#fff',
                    mb: 3,
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '2.2rem', sm: '3.2rem', md: '4.2rem' },
                    textShadow: '0 4px 32px rgba(0,0,0,0.38)',
                    lineHeight: 1.13,
                    textTransform: 'uppercase',
                  }}
                  tabIndex={0}
                  aria-label="ÁBACO plataforma territorial"
                >
                  ÁBACO
                </Typography>
                <Typography
                  variant={useMediaQuery(theme.breakpoints.down('sm')) ? 'body1' : 'h5'}
                  sx={{
                    color: 'rgba(255,255,255,0.92)',
                    mb: 4,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    fontSize: { xs: '1.1rem', sm: '1.35rem', md: '1.6rem' },
                    textShadow: '0 2px 16px rgba(0,0,0,0.32)'
                  }}
                >
                  Plataforma integral de gestión territorial y análisis de contactos con capacidades avanzadas de mapeo y coordinación operativa.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Tooltip title="Explora los portales institucionales y verticales de la plataforma" arrow>
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<MdArrowForward />}
                      onClick={() => navigate('/portales')}
                      sx={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontWeight: 700,
                        px: 4,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
                        backdropFilter: 'blur(2px)',
                        letterSpacing: '0.04em',
                        '&:hover': {
                          background: 'rgba(255,255,255,0.18)',
                          color: '#fff',
                          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.28)'
                        },
                        transition: 'all 0.2s',
                      }}
                      aria-label="Explorar portales"
                    >
                      Explorar portales
                    </Button>
                  </Tooltip>
                  <Tooltip title="Ir al dashboard ejecutivo de la plataforma" arrow>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.7)',
                        color: '#fff',
                        fontWeight: 700,
                        px: 4,
                        fontSize: '1.1rem',
                        borderRadius: 3,
                        letterSpacing: '0.04em',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.12)',
                          borderColor: '#fff',
                          color: '#fff',
                        },
                        transition: 'all 0.2s',
                      }}
                      aria-label="Ir al dashboard"
                    >
                      Ir al dashboard
                    </Button>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 7 }}>
        <Box sx={{ mb: 3.5, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#fff',
              mb: 1,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              fontSize: { xs: '1.5rem', sm: '2.1rem' }
            }}
          >
            Acceso por portales
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.82)',
              opacity: 0.92,
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.18rem' }
            }}
          >
            Accede más rápido a cada sección sin acumular toda la navegación en un único bloque.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {[
            { title: 'Portal Operativo', path: '/portales', label: 'Territorio y ejecución' },
            { title: 'Portal Inteligencia', path: '/portales', label: 'Análisis y estrategia' },
            { title: 'Portal Ciudadanía', path: '/portales', label: 'Comunidad y solicitudes' },
            { title: 'Portal Administración', path: '/portales', label: 'Usuarios y control' }
          ].map((portal) => (
            <Grid item xs={12} sm={6} md={3} key={portal.title}>
              <motion.div
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 0 24px 4px #00fff7, 0 8px 40px 0 rgba(0,0,0,0.28)',
                  filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 12px #00fff7cc)'
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}
                style={{ width: '100%' }}
                tabIndex={0}
                onClick={() => navigate(portal.path)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(portal.path) }}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: 'none',
                    background: 'rgba(24,28,36,0.92)',
                    color: '#fff',
                    minHeight: 140,
                    boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', fontSize: '1.18rem', letterSpacing: '0.01em' }}>
                    {portal.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', mt: 0.5, fontWeight: 400 }}>
                    {portal.label}
                  </Typography>
                </CardContent>
                </Card>
              </motion.div>
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

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {modules.map((module, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <motion.div
                whileHover={{
                  scale: 1.04,
                  boxShadow: `0 0 24px 4px ${module.color}, 0 8px 40px 0 rgba(0,0,0,0.28)`,
                  filter: `brightness(1.08) saturate(1.2) drop-shadow(0 0 12px ${module.color}cc)`
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.12 + index * 0.04 }}
                style={{ height: '100%' }}
                role="region"
                aria-label={`Módulo ${module.title}`}
                tabIndex={0}
                onClick={() => navigate(module.path)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(module.path) }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(24,28,36,0.92)',
                    color: '#fff',
                    borderRadius: 3,
                    border: 'none',
                    boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                <CardContent sx={{ flex: 1, pb: 2, textAlign: 'center' }}>
                  <Tooltip title={module.title + ': ' + module.description} arrow>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        color: module.color,
                        fontSize: 36,
                        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.18)'
                      }}
                      aria-label={`Icono de ${module.title}`}
                    >
                      {module.icon}
                    </Box>
                  </Tooltip>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#fff',
                      mb: 1,
                      fontSize: '1.18rem',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {module.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.82)',
                      lineHeight: 1.6,
                      mb: 2,
                      fontWeight: 400
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
                      bgcolor: 'rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      mt: 2,
                      justifyContent: 'center'
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
                          color: 'rgba(255,255,255,0.7)',
                          display: 'block',
                          fontWeight: 400
                        }}
                      >
                        {module.stats.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Tooltip title={`Acceder a ${module.title}`} arrow>
                    <Button
                      fullWidth
                      variant="text"
                      endIcon={<MdArrowForward size={18} />}
                      sx={{
                        color: module.color,
                        fontWeight: 600,
                        borderRadius: 2,
                        outline: 'none',
                        fontSize: '1.05rem',
                        '&:hover, &:focus': {
                          bgcolor: 'rgba(255,255,255,0.08)',
                          outline: `2px solid ${alpha(module.color, 0.3)}`
                        }
                      }}
                      aria-label={`Acceder a ${module.title}`}
                      onClick={e => { e.stopPropagation(); navigate(module.path) }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); navigate(module.path) } }}
                    >
                      Acceder
                    </Button>
                  </Tooltip>
                </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box
        sx={{
          background: 'rgba(24,28,36,0.92)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          py: 8,
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#fff',
                mb: 1,
                letterSpacing: '0.01em',
                textTransform: 'uppercase',
                fontSize: { xs: '1.4rem', sm: '2rem' }
              }}
            >
              Capacidades Principales
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.82)',
                opacity: 0.92,
                fontWeight: 400,
                fontSize: { xs: '1rem', sm: '1.18rem' }
              }}
            >
              Herramientas avanzadas para gestión territorial eficiente
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  role="region"
                  aria-label={`Capacidad: ${feature.title}`}
                  tabIndex={0}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 3,
                    bgcolor: 'rgba(32,36,44,0.98)',
                    borderRadius: '14px',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
                    outline: 'none',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover, &:focus': {
                      background: 'rgba(40,44,56,1)',
                      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.28)',
                      transform: 'translateY(-2px) scale(1.02)'
                    }
                  }}
                >
                  <Tooltip title={feature.title + ': ' + feature.description} arrow>
                    <Box
                      sx={{
                        color: theme.palette.secondary.main,
                        fontSize: '2.1rem',
                        flexShrink: 0,
                        mt: 0.5,
                        outline: 'none',
                        transition: 'all 0.2s',
                        bgcolor: 'rgba(255,255,255,0.06)',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5
                      }}
                      aria-label={`Icono de ${feature.title}`}
                      tabIndex={-1}
                    >
                      <MdCheckCircle size={28} />
                    </Box>
                  </Tooltip>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        mb: 0.5,
                        fontSize: '1.08rem',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.82)',
                        lineHeight: 1.6,
                        fontWeight: 400
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
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#fff',
              mb: 1,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              fontSize: { xs: '1.4rem', sm: '2rem' }
            }}
          >
            ÁBACO puede servir para
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.82)',
              opacity: 0.92,
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.18rem' }
            }}
          >
            Casos de uso reales para gestión pública, operación territorial e inteligencia política.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {useCases.map((block, idx) => (
            <Grid item xs={12} md={6} key={block.title}>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.18 + idx * 0.06 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 0 24px 4px #00fff7, 0 8px 40px 0 rgba(0,0,0,0.28)',
                  filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 12px #00fff7cc)'
                }}
                whileTap={{ scale: 0.98 }}
                style={{ height: '100%' }}
                tabIndex={0}
              >
                <Card
                  role="region"
                  aria-label={`Casos de uso: ${block.title}`}
                  tabIndex={-1}
                  sx={{
                    height: '100%',
                    background: 'rgba(24,28,36,0.92)',
                    color: '#fff',
                    borderRadius: 3,
                    border: 'none',
                    boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
                    outline: 'none',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)'
                  }}
                >
                  <CardContent>
                    <Tooltip title={block.title + ': Casos de uso'} arrow>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#fff',
                          mb: 1.5,
                          fontSize: '1.08rem',
                          letterSpacing: '0.01em'
                        }}
                        aria-label={`Título de casos de uso: ${block.title}`}
                      >
                        {block.title}
                      </Typography>
                    </Tooltip>
                    <Stack spacing={0.9}>
                      {block.items.map((item) => (
                        <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, fontWeight: 400 }}>
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Future Modules Section */}
      <Box
        sx={{
          background: 'rgba(24,28,36,0.92)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          py: 7,
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#fff',
                mb: 1,
                letterSpacing: '0.01em',
                textTransform: 'uppercase',
                fontSize: { xs: '1.4rem', sm: '2rem' }
              }}
            >
              Nuevos módulos opcionales (fase futura)
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.82)',
                opacity: 0.92,
                fontWeight: 400,
                fontSize: { xs: '1rem', sm: '1.18rem' }
              }}
            >
              Roadmap funcional para ampliar capacidades operativas, sociales y estratégicas.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            {futureModules.map((module) => (
              <Grid item xs={12} md={6} key={module.title}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(32,36,44,0.98)',
                    color: '#fff',
                    borderRadius: 3,
                    border: 'none',
                    boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
                    outline: 'none',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover, &:focus': {
                      background: 'rgba(40,44,56,1)',
                      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.28)',
                      transform: 'translateY(-2px) scale(1.02)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#fff',
                        mb: 1.25,
                        fontSize: '1.08rem',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {module.title}
                    </Typography>
                    <Stack spacing={0.8}>
                      {module.items.map((item) => (
                        <Typography
                          key={item}
                          variant="body2"
                          sx={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, fontWeight: 400 }}
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
            p: { xs: 4, sm: 6 },
            borderRadius: '18px',
            background: 'rgba(24,28,36,0.92)',
            border: 'none',
            boxShadow: '0 2px 24px 0 rgba(0,0,0,0.18)',
            color: '#fff',
            maxWidth: 700,
            mx: 'auto',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: '#fff',
              mb: 2,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              fontSize: { xs: '1.5rem', sm: '2.2rem' }
            }}
          >
            Lista para Producción
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.82)',
              mb: 4,
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.8,
              fontWeight: 400
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
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #fff 0%, #3b82f6 100%)'
              },
              mb: 3
            }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            100% Sistema Operativo
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
