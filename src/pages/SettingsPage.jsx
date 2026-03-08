/**
 * ÁBACO - Panel de Configuración Unificado
 * Incluye módulos integrados: Seguridad y Rendimiento
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Tabs,
  Tab,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Stack
} from '@mui/material'
import { MdSettings, MdSave, MdNotifications, MdMap, MdSecurity, MdSpeed } from 'react-icons/md'
import SecurityPage from './SecurityPage'
import PerformancePage from './PerformancePage'

const TAB_BY_SECTION = {
  general: 0,
  notifications: 1,
  map: 2,
  security: 3,
  performance: 4
}

export default function SettingsPage() {
  const location = useLocation()

  const defaultSettings = {
    appName: 'ÁBACO',
    language: 'es',
    timezone: 'America/Bogota',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationSound: true,
    defaultMapType: 'street',
    showHeatmap: true,
    autoRefreshMap: true,
    mapRefreshInterval: 30,
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    dataRetention: 365,
    autoBackup: true,
    backupFrequency: 'daily',
    autoRefreshAlerts: true,
    alertsRefreshIntervalSec: 30,
    alertsPendingZThreshold: 1.2,
    alertsConversionMinThreshold: 35,
    alertsSurveyCoverageMinThreshold: 20
  }

  const initialTab = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get('section')
    return TAB_BY_SECTION[section] ?? 0
  }, [location.search])

  const [tabValue, setTabValue] = useState(initialTab)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('appSettings') || 'null')
      if (saved && typeof saved === 'object') return { ...defaultSettings, ...saved }
    } catch {
      // fallback to defaults
    }

    return defaultSettings
  })

  useEffect(() => {
    setTabValue(initialTab)
  }, [initialTab])

  const securityScore = [settings.twoFactorAuth, settings.sessionTimeout <= 60, settings.passwordExpiry <= 90]
    .filter(Boolean).length * 33

  const mapHealth = [settings.showHeatmap, settings.autoRefreshMap].filter(Boolean).length

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
    alert('Configuración guardada exitosamente')
  }

  const renderGeneralTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nombre de la Aplicación"
          value={settings.appName}
          onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Idioma</InputLabel>
          <Select
            value={settings.language}
            label="Idioma"
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          >
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="pt">Português</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Zona Horaria</InputLabel>
          <Select
            value={settings.timezone}
            label="Zona Horaria"
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          >
            <MenuItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</MenuItem>
            <MenuItem value="America/Mexico_City">Ciudad de México (GMT-6)</MenuItem>
            <MenuItem value="America/Bogota">Bogotá (GMT-5)</MenuItem>
            <MenuItem value="America/Sao_Paulo">São Paulo (GMT-3)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Motor de Alertas Inteligentes
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoRefreshAlerts}
              onChange={(e) => setSettings({ ...settings, autoRefreshAlerts: e.target.checked })}
            />
          }
          label="Auto-refresh de alertas"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Intervalo refresh alertas (segundos)"
          value={settings.alertsRefreshIntervalSec}
          onChange={(e) => setSettings({ ...settings, alertsRefreshIntervalSec: parseInt(e.target.value || '30', 10) })}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Umbral z-score pendientes"
          value={settings.alertsPendingZThreshold}
          onChange={(e) => setSettings({ ...settings, alertsPendingZThreshold: Number(e.target.value || 1.2) })}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Conversión mínima (%)"
          value={settings.alertsConversionMinThreshold}
          onChange={(e) => setSettings({ ...settings, alertsConversionMinThreshold: Number(e.target.value || 35) })}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Cobertura mínima encuestas (%)"
          value={settings.alertsSurveyCoverageMinThreshold}
          onChange={(e) => setSettings({ ...settings, alertsSurveyCoverageMinThreshold: Number(e.target.value || 20) })}
        />
      </Grid>
    </Grid>
  )

  const renderNotificationsTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} />} label="Notificaciones por Email" /></Grid>
      <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.pushNotifications} onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })} />} label="Notificaciones Push" /></Grid>
      <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.smsNotifications} onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })} />} label="Notificaciones por SMS" /></Grid>
      <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.notificationSound} onChange={(e) => setSettings({ ...settings, notificationSound: e.target.checked })} />} label="Sonidos de Notificación" /></Grid>
    </Grid>
  )

  const renderMapTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Mapa Predeterminado</InputLabel>
          <Select
            value={settings.defaultMapType}
            label="Tipo de Mapa Predeterminado"
            onChange={(e) => setSettings({ ...settings, defaultMapType: e.target.value })}
          >
            <MenuItem value="street">Calles</MenuItem>
            <MenuItem value="satellite">Satélite</MenuItem>
            <MenuItem value="terrain">Terreno</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Intervalo de Actualización (segundos)"
          value={settings.mapRefreshInterval}
          onChange={(e) => setSettings({ ...settings, mapRefreshInterval: parseInt(e.target.value || '30', 10) })}
        />
      </Grid>
      <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.showHeatmap} onChange={(e) => setSettings({ ...settings, showHeatmap: e.target.checked })} />} label="Mostrar Mapa de Calor" /></Grid>
      <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.autoRefreshMap} onChange={(e) => setSettings({ ...settings, autoRefreshMap: e.target.checked })} />} label="Auto-Actualizar Mapa" /></Grid>
    </Grid>
  )

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          color: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Configuración Central
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          Centro unificado de ajustes y operación del sistema.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="Seguridad integrada" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
          <Chip label="Rendimiento integrado" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="caption" color="text.secondary">Nivel de seguridad</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>{securityScore}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="caption" color="text.secondary">Estado de mapa</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#00b37e' }}>{mapHealth}/2</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="caption" color="text.secondary">Retención de datos</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#764ba2' }}>{settings.dataRetention} días</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="General" icon={<MdSettings />} iconPosition="start" />
          <Tab label="Notificaciones" icon={<MdNotifications />} iconPosition="start" />
          <Tab label="Mapa" icon={<MdMap />} iconPosition="start" />
          <Tab label="Seguridad" icon={<MdSecurity />} iconPosition="start" />
          <Tab label="Rendimiento" icon={<MdSpeed />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderGeneralTab()}
          {tabValue === 1 && renderNotificationsTab()}
          {tabValue === 2 && renderMapTab()}
          {tabValue === 3 && <SecurityPage />}
          {tabValue === 4 && <PerformancePage />}

          {tabValue <= 2 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Button
                variant="contained"
                startIcon={<MdSave />}
                onClick={handleSave}
                sx={{ textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Guardar Configuración
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
