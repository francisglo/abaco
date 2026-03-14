import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Stack, Button, alpha, useTheme, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MdArrowForward, MdAutoGraph, MdAccountBalance, MdCorporateFare, MdPublic, MdShield, MdHub, MdForest, MdGroups } from 'react-icons/md'

const verticalGroups = [
  {
    title: 'Gobierno y Política',
    color: 'primary',
    items: [
      { label: 'Inteligencia Electoral', path: '/abaco-electoral', icon: <MdCorporateFare size={16} /> },
      { label: 'Inteligencia Territorial Pública', path: '/abaco-gubernamental', icon: <MdPublic size={16} /> }
    ]
  },
  {
    title: 'Economía y Finanzas',
    color: 'secondary',
    items: [
      { label: 'Inteligencia Financiera Territorial', path: '/financial-intelligence', icon: <MdAccountBalance size={16} /> },
      { label: 'Inclusión Financiera', path: '/abaco-verticales/inclusion-financiera', icon: <MdAccountBalance size={16} /> },
      { label: 'Desarrollo Económico Territorial', path: '/abaco-verticales/desarrollo-economico-territorial', icon: <MdAutoGraph size={16} /> }
    ]
  },
  {
    title: 'Demografía y Sociedad',
    color: 'info',
    items: [
      { label: 'Inteligencia Demográfica y Social', path: '/abaco-verticales/inteligencia-demografica-social', icon: <MdGroups size={16} /> }
    ]
  },
  {
    title: 'Planeación y Desarrollo',
    color: 'info',
    items: [
      { label: 'Algoritmos Operativos Territoriales', path: '/operational-algorithms', icon: <MdAutoGraph size={16} /> },
      { label: 'Inversión Pública', path: '/abaco-verticales/inversion-publica', icon: <MdHub size={16} /> },
      { label: 'Infraestructura y Conectividad', path: '/abaco-verticales/infraestructura-conectividad', icon: <MdHub size={16} /> },
      { label: 'Ordenamiento Territorial y Planeación Urbana', path: '/abaco-verticales/ordenamiento-territorial-planeacion-urbana', icon: <MdHub size={16} /> }
    ]
  },
  {
    title: 'Desarrollo Internacional',
    color: 'success',
    items: [
      { label: 'Cooperación y Desarrollo', path: '/abaco-verticales/cooperacion-desarrollo', icon: <MdPublic size={16} /> }
    ]
  },
  {
    title: 'Sostenibilidad',
    color: 'success',
    items: [
      { label: 'Inteligencia Ambiental', path: '/abaco-verticales/ambiental-cambio-climatico', icon: <MdForest size={16} /> }
    ]
  },
  {
    title: 'Gobernanza',
    color: 'warning',
    items: [
      { label: 'Seguridad y Riesgo Territorial', path: '/abaco-verticales/seguridad-gobernanza-territorial', icon: <MdShield size={16} /> }
    ]
  }
]

export default function AbacoVerticalsSectionPage() {
    React.useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
          }}
        >
          <CardContent>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
              Verticales Sectoriales Estratégicos
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 860, mb: 2, fontWeight: 500 }}>
              Acceso directo a módulos de desarrollo económico territorial (identificación de clústeres y oportunidades predictivas), inversión pública (priorización territorial de proyectos), inclusión financiera (zonas con baja bancarización) y cooperación y desarrollo (monitoreo territorial de programas).
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Análisis territorial" color="primary" variant="outlined" />
              <Chip label="Política pública" color="secondary" variant="outlined" />
              <Chip label="Desarrollo económico" color="success" variant="outlined" />
            </Stack>
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              startIcon={<MdHub size={17} />}
              endIcon={<MdArrowForward size={17} />}
              onClick={() => navigate('/abaco-bi-integrador')}
            >
              Ver BI Integrador
            </Button>
          </CardContent>
        </Card>

        <Grid container spacing={2.2}>
          {verticalGroups.map((group) => (
            <Grid item xs={12} md={6} key={group.title}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1.2 }}>
                    {group.title}
                  </Typography>
                  <Stack spacing={1}>
                    {group.items.map((item) => (
                      <Button
                        key={item.path}
                        fullWidth
                        variant="outlined"
                        startIcon={item.icon}
                        endIcon={<MdArrowForward size={16} />}
                        onClick={() => navigate(item.path)}
                        sx={{ justifyContent: 'space-between', borderColor: alpha(theme.palette.primary.main, 0.25), color: theme.palette.primary.main }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
