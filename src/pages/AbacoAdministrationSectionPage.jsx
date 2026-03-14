import React, { useMemo } from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Stack, Button, alpha, useTheme, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MdAdminPanelSettings, MdArrowForward, MdPeople, MdDataset, MdAnalytics, MdFolder, MdHistory, MdTrendingUp, MdWarning, MdSettings } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { canAccessByRole, normalizeRole } from '../config/roleAccess'

const administrationModules = [
  { label: 'Usuarios', path: '/users', icon: <MdPeople size={16} />, allowedRoles: ['admin'] },
  { label: 'Gestión de Datos', path: '/data-management', icon: <MdDataset size={16} />, allowedRoles: ['admin', 'manager'] },
  { label: 'Análisis (BI)', path: '/query-analytics', icon: <MdAnalytics size={16} />, allowedRoles: ['admin', 'manager', 'auditor', 'viewer'] },
  { label: 'Archivos', path: '/files', icon: <MdFolder size={16} />, allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
  { label: 'Auditoría', path: '/audit', icon: <MdHistory size={16} />, allowedRoles: ['admin', 'auditor'] },
  { label: 'Leaderboard', path: '/leaderboard', icon: <MdTrendingUp size={16} />, allowedRoles: ['admin', 'manager', 'operator', 'viewer'] },
  { label: 'Alertas Inteligentes', path: '/smart-alerts', icon: <MdWarning size={16} />, allowedRoles: ['admin', 'manager', 'auditor'] },
  { label: 'Configuración', path: '/settings', icon: <MdSettings size={16} />, allowedRoles: ['admin', 'manager'] },
]

export default function AbacoAdministrationSectionPage() {
    React.useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()

  const visibleModules = useMemo(() => {
    const role = normalizeRole(user?.role)
    return administrationModules.filter((item) => canAccessByRole(role, item.allowedRoles))
  }, [user?.role])

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
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <MdAdminPanelSettings size={30} color={theme.palette.primary.main} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                ÁBACO Administración
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 820 }}>
              Hub operativo para gestión interna, datos, auditoría y configuración de la plataforma.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Gobernanza" color="primary" variant="outlined" />
              <Chip label="Seguridad y control" color="secondary" variant="outlined" />
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {visibleModules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.path}>
              <Card sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: theme.palette.primary.main, mb: 1.5 }}>
                    {module.icon}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{module.label}</Typography>
                  </Stack>
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<MdArrowForward size={16} />}
                    onClick={() => navigate(module.path)}
                  >
                    Ir al módulo
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
