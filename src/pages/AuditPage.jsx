/**
 * ÁBACO - Registro de Auditoría
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Alert,
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material'
import { MdSearch, MdHistory, MdChecklist, MdShield, MdWarningAmber, MdFilterAlt } from 'react-icons/md'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Cargar logs de auditoría (simulado)
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 3600000),
        userId: 1,
        userName: 'Juan Pérez',
        action: 'CREATE',
        entity: 'Contact',
        entityId: 123,
        changes: { name: 'María García', status: 'pending' },
        ipAddress: '192.168.1.100'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 7200000),
        userId: 2,
        userName: 'Ana López',
        action: 'UPDATE',
        entity: 'Territory',
        entityId: 45,
        changes: { name: 'Zona Norte', oldName: 'Zona 1' },
        ipAddress: '192.168.1.101'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 10800000),
        userId: 1,
        userName: 'Juan Pérez',
        action: 'DELETE',
        entity: 'User',
        entityId: 67,
        changes: { email: 'usuario@example.com' },
        ipAddress: '192.168.1.100'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 14400000),
        userId: 3,
        userName: 'Carlos Ruiz',
        action: 'LOGIN',
        entity: 'Session',
        entityId: null,
        changes: {},
        ipAddress: '192.168.1.102'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 18000000),
        userId: 2,
        userName: 'Ana López',
        action: 'EXPORT',
        entity: 'Report',
        entityId: null,
        changes: { format: 'PDF', records: 150 },
        ipAddress: '192.168.1.101'
      }
    ]
    setAuditLogs(mockLogs)
    setFilteredLogs(mockLogs)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLogs(auditLogs)
    } else {
      const filtered = auditLogs.filter(log =>
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLogs(filtered)
    }
  }, [searchQuery, auditLogs])

  const metrics = useMemo(() => {
    const users = new Set(auditLogs.map((item) => item.userId)).size
    const critical = auditLogs.filter((item) => item.action === 'DELETE').length
    const sessions = auditLogs.filter((item) => item.action === 'LOGIN').length
    return {
      total: auditLogs.length,
      users,
      critical,
      sessions
    }
  }, [auditLogs])

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'success'
      case 'UPDATE':
        return 'info'
      case 'DELETE':
        return 'error'
      case 'LOGIN':
        return 'default'
      case 'EXPORT':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Registro de Auditoría
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
            Monitorea quién hizo qué, cuándo lo hizo y sobre qué entidad para mantener trazabilidad completa.
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <MdChecklist />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Qué puedes hacer en este módulo
            </Typography>
          </Stack>
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={6}>
              <Alert icon={<MdFilterAlt />} severity="info">Filtrar eventos por usuario, acción o entidad con el buscador.</Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert icon={<MdShield />} severity="success">Verificar trazabilidad de cambios y responsables por cada registro.</Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert icon={<MdWarningAmber />} severity="warning">Detectar acciones críticas como eliminaciones o exportaciones masivas.</Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert icon={<MdHistory />} severity="info">Revisar la línea de tiempo operativa con fecha exacta y tiempo relativo.</Alert>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="caption" color="text.secondary">Registros</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{metrics.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="caption" color="text.secondary">Usuarios activos</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{metrics.users}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="caption" color="text.secondary">Acciones críticas</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{metrics.critical}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="caption" color="text.secondary">Inicios de sesión</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{metrics.sessions}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Eventos auditados
        </Typography>
        <Chip label={`${filteredLogs.length} resultados`} size="small" variant="outlined" />
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por usuario, acción o entidad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Entidad</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cambios</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {log.timestamp.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: es })}
                  </Typography>
                </TableCell>
                <TableCell>{log.userName}</TableCell>
                <TableCell>
                  <Chip label={log.action} color={getActionColor(log.action)} size="small" />
                </TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell>{log.entityId || '-'}</TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {Object.keys(log.changes).length > 0
                      ? JSON.stringify(log.changes, null, 2).substring(0, 50) + '...'
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {log.ipAddress}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredLogs.length === 0 && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', mt: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <MdHistory size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Typography color="text.secondary">
            No se encontraron registros de auditoría
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
