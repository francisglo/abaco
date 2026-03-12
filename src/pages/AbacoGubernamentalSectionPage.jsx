import React, { useMemo } from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Stack, Button, alpha, useTheme, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MdCorporateFare, MdArrowForward, MdInsights, MdManageSearch, MdSupportAgent, MdConnectWithoutContact, MdSettings } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { canAccessByRole, normalizeRole } from '../config/roleAccess'

const governmentalModules = [
  { label: 'Indicadores de Gestión', path: '/management-indicators', icon: <MdInsights size={16} />, allowedRoles: ['admin', 'manager', 'auditor', 'viewer'] },
  { label: 'Inteligencia Estratégica', path: '/strategic-intelligence', icon: <MdManageSearch size={16} />, allowedRoles: ['admin', 'manager', 'auditor'] },
  { label: 'Solicitudes Ciudadanas', path: '/citizen-requests', icon: <MdSupportAgent size={16} />, allowedRoles: ['admin', 'manager', 'operator', 'visitor'] },
  { label: 'Comunicación Territorial', path: '/territorial-communication', icon: <MdConnectWithoutContact size={16} />, allowedRoles: ['admin', 'manager', 'operator'] },
  { label: 'Configuración', path: '/settings', icon: <MdSettings size={16} />, allowedRoles: ['admin', 'manager'] },
]

export default function AbacoGubernamentalSectionPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()

  const visibleModules = useMemo(() => {
    const role = normalizeRole(user?.role)
    return governmentalModules.filter((item) => canAccessByRole(role, item.allowedRoles))
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
              <MdCorporateFare size={30} color={theme.palette.primary.main} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                ÁBACO Gubernamental
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 820 }}>
              División gubernamental con foco en gestión pública, indicadores, inteligencia estratégica y atención ciudadana.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Gestión pública" color="primary" variant="outlined" />
              <Chip label="Toma de decisiones" color="secondary" variant="outlined" />
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
