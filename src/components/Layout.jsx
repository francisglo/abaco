import React, { useMemo, useState, useEffect } from 'react'
import { AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, Box, IconButton, Divider, ListItemIcon, useTheme, alpha, Tooltip, Avatar, Menu, MenuItem, useMediaQuery, Chip, Button, Select } from '@mui/material'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  MdMenu,
  MdDashboard,
  MdLocationOn,
  MdPeople,
  MdSettings,
  MdChevronLeft,
  MdTask,
  MdHistory,
  MdPoll,
  MdFolder,
  MdLogout,
  MdPerson,
  MdTrendingUp,
  MdDataset,
  MdAnalytics,
  MdSpaceDashboard,
  MdMap,
  MdWarning,
  MdSchool,
  MdAutoGraph,
  MdSupportAgent,
  MdConnectWithoutContact,
  MdInsights,
  MdManageSearch,
  MdAccountBalance,
  MdHowToVote,
  MdCorporateFare,
  MdHub
} from 'react-icons/md'
import { HiUsers } from 'react-icons/hi'
import { RiContactsBook2Fill } from 'react-icons/ri'
import NotificationsPanel from './NotificationsPanel'
import { useAuth } from '../context/AuthContext'
import { useViewContext, VIEW_TERRITORIES, VIEW_PROJECTS, VIEW_TERRITORY_FILTER_MODES } from '../context/ViewContext'
import abacoLogo from '../../TFG/TFG.png'
import { canAccessByRole, normalizeRole, getRoleLabel, getViewModeByPath, VIEW_MODES } from '../config/roleAccess'

const drawerWidth = 260

export default function Layout({ children }) {
  const [open, setOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user, logout } = useAuth()
  const { territory, project, territoryFilterMode, setTerritory, setProject, setTerritoryFilterMode } = useViewContext()
  const activeViewMode = getViewModeByPath(location.pathname)
  const viewModeLabel = VIEW_MODES[activeViewMode] || VIEW_MODES.visualization
  const roleLabel = getRoleLabel(user?.role)

  useEffect(() => {
    if (isMobile && open) {
      setOpen(false)
    }
  }, [isMobile])

  const toggleDrawer = () => {
    setOpen(!open)
  }

  const currentMode = useMemo(() => {
    if (location.pathname.startsWith('/abaco-training')) {
      return { key: 'training', suffix: 'Training', caption: 'mundo Training', animated: true }
    }
    if (location.pathname.startsWith('/abaco-ascend')) {
      return { key: 'asend', suffix: 'ASEND', caption: 'mundo ASEND', animated: true }
    }
    return { key: 'abaco', suffix: '', caption: '', animated: false }
  }, [location.pathname])

  const focusedSectionTitle = useMemo(() => {
    if (location.pathname.startsWith('/abaco-electoral')) return 'Electoral'
    if (location.pathname.startsWith('/abaco-gubernamental')) return 'Gubernamental'
    if (location.pathname.startsWith('/financial-intelligence')) return 'Gubernamental'
    if (location.pathname.startsWith('/abaco-verticales') || location.pathname.startsWith('/abaco-bi-integrador') || location.pathname.startsWith('/operational-algorithms')) return 'Verticales'
    if (location.pathname.startsWith('/abaco-administracion') || location.pathname.startsWith('/settings')) return 'Administración'
    return null
  }, [location.pathname])

  const menuSections = [
    {
      title: 'Plataforma',
      items: [
        { text: 'Inicio', icon: <MdDashboard size={20} />, path: '/', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
        { text: 'Portales', icon: <MdDashboard size={20} />, path: '/portales', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
      ]
    },
    {
      title: 'Electoral',
      items: [
        { text: 'Panel Electoral', icon: <MdHowToVote size={20} />, path: '/abaco-electoral', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
      ]
    },
    {
      title: 'Gubernamental',
      items: [
        { text: 'Panel Gubernamental', icon: <MdCorporateFare size={20} />, path: '/abaco-gubernamental', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
        { text: 'Panel de Decisión', icon: <MdAccountBalance size={20} />, path: '/financial-intelligence', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer'] },
      ]
    },
    {
      title: 'Verticales',
      items: [
        { text: 'Panel de Verticales', icon: <MdHub size={20} />, path: '/abaco-verticales', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
        { text: 'Algoritmos Operativos', icon: <MdAutoGraph size={20} />, path: '/operational-algorithms', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer'] },
      ]
    },
    {
      title: 'Administración',
      items: [
        { text: 'Panel de Administración', icon: <MdSettings size={20} />, path: '/abaco-administracion', allowedRoles: ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor'] },
      ]
    }
  ]

  const visibleMenuSections = useMemo(() => {
    const normalizedRole = normalizeRole(user?.role)
    const roleFilteredSections = menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => canAccessByRole(normalizedRole, item.allowedRoles))
      }))
      .filter((section) => section.items.length > 0)

    if (!focusedSectionTitle) {
      return roleFilteredSections
    }

    return roleFilteredSections.filter((section) => (
      section.title === 'Plataforma' || section.title === focusedSectionTitle
    ))
  }, [user?.role, focusedSectionTitle])

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const profileInitials = (user?.name || 'Usuario')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <AppBar 
        position="fixed" 
        elevation={1}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#ffffff',
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={open ? 'Contraer menú' : 'Expandir menú'}>
              <IconButton
                onClick={toggleDrawer}
                edge="start"
                sx={{ 
                  color: theme.palette.primary.main,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                }}
              >
                {open ? <MdChevronLeft size={24} /> : <MdMenu size={24} />}
              </IconButton>
            </Tooltip>
            <Box
              key={currentMode.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.4,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                ...(currentMode.animated
                  ? {
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.14)} 50%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
                        transform: 'translateX(-100%)',
                        animation: 'modeWaterFlow 850ms ease-out'
                      },
                      '@keyframes modeWaterFlow': {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' }
                      }
                    }
                  : {})
              }}
            >
              <Box
                component="img"
                src={abacoLogo}
                alt="Ábaco"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  objectFit: 'cover',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
                }}
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  position: 'relative',
                  zIndex: 1,
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontSize: '1.1rem'
                }}
              >
                ÁBACO{currentMode.suffix ? ` ${currentMode.suffix}` : ''}
              </Typography>
              {currentMode.caption && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    ml: 0.2,
                    mt: 0.2,
                    color: alpha(theme.palette.text.primary, 0.72),
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    alignSelf: 'flex-end'
                  }}
                >
                  {currentMode.caption}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {!isMobile && (
              <>
                <Select
                  size="small"
                  value={territory}
                  onChange={(event) => setTerritory(event.target.value)}
                  sx={{
                    minWidth: 118,
                    height: 30,
                    fontSize: '0.78rem',
                    borderRadius: 2,
                    color: theme.palette.primary.main,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.primary.main, 0.25) }
                  }}
                >
                  {VIEW_TERRITORIES.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
                <Select
                  size="small"
                  value={project}
                  onChange={(event) => setProject(event.target.value)}
                  sx={{
                    minWidth: 138,
                    height: 30,
                    fontSize: '0.78rem',
                    borderRadius: 2,
                    color: theme.palette.secondary.main,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.secondary.main, 0.3) }
                  }}
                >
                  {VIEW_PROJECTS.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
                <Select
                  size="small"
                  value={territoryFilterMode}
                  onChange={(event) => setTerritoryFilterMode(event.target.value)}
                  sx={{
                    minWidth: 112,
                    height: 30,
                    fontSize: '0.78rem',
                    borderRadius: 2,
                    color: theme.palette.text.secondary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.text.secondary, 0.28) }
                  }}
                >
                  {VIEW_TERRITORY_FILTER_MODES.map((item) => (
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                  ))}
                </Select>
                <Chip
                  size="small"
                  label={roleLabel}
                  variant="outlined"
                  sx={{ borderColor: alpha(theme.palette.primary.main, 0.25), color: theme.palette.primary.main, fontWeight: 600 }}
                />
                <Chip
                  size="small"
                  label={viewModeLabel}
                  variant="outlined"
                  sx={{ borderColor: alpha(theme.palette.secondary.main, 0.3), color: theme.palette.secondary.main, fontWeight: 600 }}
                />
              </>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/portales')}
              sx={{
                textTransform: 'none',
                borderColor: alpha(theme.palette.primary.main, 0.28),
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.06)
                }
              }}
            >
              Menú principal
            </Button>
            <NotificationsPanel />
            <Tooltip title="Perfil">
              <IconButton 
                onClick={handleMenu}
                sx={{ p: 0 }}
              >
                <Avatar 
                  src={user?.profile?.avatar || undefined}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                    fontWeight: 600
                  }}
                >
                  {profileInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleClose} component={Link} to="/profile">
                <MdPerson size={20} style={{ marginRight: 8 }} /> Mi perfil
              </MenuItem>
              <MenuItem onClick={handleClose} component={Link} to="/settings">
                <MdSettings size={20} style={{ marginRight: 8 }} /> Configuración
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleClose(); logout() }}>
                <MdLogout size={20} style={{ marginRight: 8, color: theme.palette.error.main }} /> Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        anchor="left"
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: isMobile ? drawerWidth : (open ? drawerWidth : 80),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? drawerWidth : (open ? drawerWidth : 80),
            boxSizing: 'border-box',
            mt: '64px',
            bgcolor: '#ffffff',
            borderRight: '1px solid rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
          <List sx={{ px: 1, py: 2, flex: 1 }}>
            {visibleMenuSections.map((section, sectionIndex) => (
              <React.Fragment key={section.title}>
                {open && (
                  <Box
                    sx={{
                      px: 1.4,
                      pt: sectionIndex === 0 ? 0 : 1.25,
                      pb: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: ((focusedSectionTitle && section.title === focusedSectionTitle)
                          || (!focusedSectionTitle && section.title === 'Plataforma'))
                          ? theme.palette.primary.main
                          : alpha(theme.palette.text.secondary, 0.9),
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        transition: theme.transitions.create(['color', 'opacity'], {
                          duration: 220,
                          easing: theme.transitions.easing.easeOut
                        })
                      }}
                    >
                      {section.title}
                    </Typography>
                    {((focusedSectionTitle && section.title === focusedSectionTitle)
                      || (!focusedSectionTitle && section.title === 'Plataforma')) && (
                      <Chip
                        size="small"
                        color={focusedSectionTitle ? 'primary' : 'default'}
                        variant={focusedSectionTitle ? 'filled' : 'outlined'}
                        label={focusedSectionTitle ? 'Activa' : 'General'}
                        sx={{
                          height: 18,
                          transition: theme.transitions.create(['transform', 'opacity', 'background-color', 'border-color'], {
                            duration: 220,
                            easing: theme.transitions.easing.easeOut
                          }),
                          transform: 'translateY(0)',
                          '& .MuiChip-label': { px: 0.8, fontSize: '0.62rem', fontWeight: 700 }
                        }}
                      />
                    )}
                  </Box>
                )}

                {section.items.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path))

                  return (
                    <Tooltip key={item.text} title={!open ? item.text : ''} placement="right">
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        onClick={() => {
                          if (isMobile) setOpen(false)
                        }}
                        sx={{
                          mb: 1,
                          borderRadius: '8px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                          justifyContent: open ? 'flex-start' : 'center',
                          px: open ? 2 : 1.5,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, isActive ? 0.15 : 0.08),
                            color: theme.palette.primary.main
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'inherit',
                            minWidth: open ? 40 : 'auto',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: open ? 40 : 'auto', ml: open ? 0 : -1 }}>
                          {item.icon}
                        </ListItemIcon>
                        {open && (
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 600 : 500,
                              fontSize: '0.875rem',
                              letterSpacing: '0.3px'
                            }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  )
                })}

                {sectionIndex < visibleMenuSections.length - 1 && (
                  <Divider sx={{ my: 0.2, mx: open ? 0.4 : 0.9, opacity: 0.5 }} />
                )}
              </React.Fragment>
            ))}
          </List>
          
          {open && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    fontWeight: 700,
                    color: theme.palette.text.secondary,
                    letterSpacing: '0.05em',
                    mb: 0.5
                  }}
                >
                  PLATAFORMA
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    color: theme.palette.text.secondary,
                    opacity: 0.7
                  }}
                >
                  Territorial v1.0
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      <Box 
        component="main" 
        key={currentMode.key}
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          mt: 8,
          ...(currentMode.animated
            ? {
                animation: 'modePageFlow 420ms ease-out',
                '@keyframes modePageFlow': {
                  '0%': { opacity: 0.72, transform: 'translateY(8px)' },
                  '100%': { opacity: 1, transform: 'translateY(0px)' }
                }
              }
            : {}),
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
