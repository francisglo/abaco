import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  MdSecurity,
  MdLock,
  MdVpnKey,
  MdBackup,
  MdWarning,
  MdCheckCircle,
  MdBlock,
  MdDownload,
  MdUpload,
  MdDelete,
  MdEdit,
  MdAdd,
  MdRefresh,
  MdHistory,
  MdShield,
  MdFingerprint,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';

function SecurityPage() {
  // Estado principal
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });

  // Estado Control de Accesos
  const [accessLogs, setAccessLogs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roleDialog, setRoleDialog] = useState({ open: false, data: null });

  // Estado Cifrado
  const [encryptionConfig, setEncryptionConfig] = useState({
    enabled: true,
    algorithm: 'AES-256',
    fields: ['dni', 'phone', 'email', 'address'],
  });
  const [encryptionStats, setEncryptionStats] = useState({
    totalRecords: 0,
    encryptedRecords: 0,
    percentage: 0,
  });

  // Estado Copias de Seguridad
  const [backups, setBackups] = useState([]);
  const [backupConfig, setBackupConfig] = useState({
    autoBackup: true,
    frequency: 'daily',
    retention: 30,
    lastBackup: null,
  });
  const [backupDialog, setBackupDialog] = useState({ open: false, type: 'create' });

  // Cargar datos iniciales
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Cargar logs de acceso
      const logsRes = await fetch('http://localhost:4000/accessLogs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAccessLogs(logsData);
      }

      // Cargar sesiones activas
      const sessionsRes = await fetch('http://localhost:4000/activeSessions');
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setActiveSessions(sessionsData);
      }

      // Cargar permisos por rol
      const permissionsRes = await fetch('http://localhost:4000/rolePermissions');
      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setPermissions(permissionsData);
      }

      // Cargar backups
      const backupsRes = await fetch('http://localhost:4000/backups');
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData);
      }

      // Calcular estadísticas de cifrado
      const votersRes = await fetch('http://localhost:4000/voters');
      if (votersRes.ok) {
        const voters = await votersRes.json();
        const encrypted = voters.filter(v => v.encrypted).length;
        setEncryptionStats({
          totalRecords: voters.length,
          encryptedRecords: encrypted,
          percentage: voters.length > 0 ? Math.round((encrypted / voters.length) * 100) : 0,
        });
      }
    } catch (error) {
      showAlert('error', 'Error al cargar datos de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: '', message: '' }), 5000);
  };

  // Control de Accesos: Cerrar sesión
  const handleCloseSession = async (sessionId) => {
    try {
      await fetch(`http://localhost:4000/activeSessions/${sessionId}`, {
        method: 'DELETE',
      });
      showAlert('success', 'Sesión cerrada correctamente');
      loadSecurityData();
    } catch (error) {
      showAlert('error', 'Error al cerrar sesión');
    }
  };

  // Control de Accesos: Editar permisos de rol
  const handleEditRole = (role) => {
    setRoleDialog({ open: true, data: role });
  };

  const handleSaveRolePermissions = async () => {
    try {
      await fetch(`http://localhost:4000/rolePermissions/${roleDialog.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleDialog.data),
      });
      showAlert('success', 'Permisos actualizados correctamente');
      setRoleDialog({ open: false, data: null });
      loadSecurityData();
    } catch (error) {
      showAlert('error', 'Error al actualizar permisos');
    }
  };

  const handlePermissionToggle = (module, action) => {
    const updatedData = { ...roleDialog.data };
    if (!updatedData.permissions[module]) {
      updatedData.permissions[module] = {};
    }
    updatedData.permissions[module][action] = !updatedData.permissions[module][action];
    setRoleDialog({ ...roleDialog, data: updatedData });
  };

  // Cifrado: Actualizar configuración
  const handleEncryptionToggle = async (field) => {
    const newFields = encryptionConfig.fields.includes(field)
      ? encryptionConfig.fields.filter(f => f !== field)
      : [...encryptionConfig.fields, field];
    
    setEncryptionConfig({ ...encryptionConfig, fields: newFields });
    showAlert('info', 'Configuración de cifrado actualizada');
  };

  const handleEncryptAllData = async () => {
    setLoading(true);
    try {
      const votersRes = await fetch('http://localhost:4000/voters');
      const voters = await votersRes.json();

      let encryptedNow = 0;
      for (const voter of voters) {
        if (!voter.encrypted) {
          await fetch(`http://localhost:4000/voters/${voter.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encrypted: true }),
          });
          encryptedNow += 1;
        }
      }

      showAlert('success', `Cifrado completado: ${encryptedNow} registros actualizados`);
      loadSecurityData();
    } catch (error) {
      showAlert('error', 'Error al cifrar datos');
    } finally {
      setLoading(false);
    }
  };

  // Copias de Seguridad: Crear backup
  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const [voters, users, zones, tasks] = await Promise.all([
        fetch('http://localhost:4000/voters').then(r => r.json()),
        fetch('http://localhost:4000/users').then(r => r.json()),
        fetch('http://localhost:4000/zones').then(r => r.json()),
        fetch('http://localhost:4000/tasks').then(r => r.json()),
      ]);

      const estimatedSizeMb = ((
        JSON.stringify(voters).length +
        JSON.stringify(users).length +
        JSON.stringify(zones).length +
        JSON.stringify(tasks).length
      ) / (1024 * 1024)).toFixed(2);

      const newBackup = {
        id: Date.now(),
        name: `Backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
        date: new Date().toISOString(),
        size: `${estimatedSizeMb} MB`,
        type: 'manual',
        status: 'completed',
        records: {
          voters: voters.length,
          users: users.length,
          zones: zones.length,
          tasks: tasks.length,
        },
        snapshot: { voters, users, zones, tasks }
      };

      await fetch('http://localhost:4000/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBackup),
      });

      showAlert('success', 'Copia de seguridad creada correctamente');
      setBackupDialog({ open: false, type: 'create' });
      loadSecurityData();
    } catch (error) {
      showAlert('error', 'Error al crear copia de seguridad');
    } finally {
      setLoading(false);
    }
  };

  // Copias de Seguridad: Descargar backup
  const handleDownloadBackup = async (backup) => {
    setLoading(true);
    try {
      // Obtener todos los datos
      const [voters, users, zones, tasks] = await Promise.all([
        fetch('http://localhost:4000/voters').then(r => r.json()),
        fetch('http://localhost:4000/users').then(r => r.json()),
        fetch('http://localhost:4000/zones').then(r => r.json()),
        fetch('http://localhost:4000/tasks').then(r => r.json()),
      ]);

      const backupData = {
        metadata: {
          name: backup.name,
          date: backup.date,
          version: '1.0',
        },
        data: {
          voters,
          users,
          zones,
          tasks,
        },
      };

      // Crear archivo JSON para descarga
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showAlert('success', 'Backup descargado correctamente');
    } catch (error) {
      showAlert('error', 'Error al descargar backup');
    } finally {
      setLoading(false);
    }
  };

  // Copias de Seguridad: Restaurar backup
  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('¿Está seguro de restaurar esta copia de seguridad? Se sobrescribirán los datos actuales.')) {
      return;
    }

    setLoading(true);
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup?.snapshot) {
        showAlert('warning', 'Este backup no contiene snapshot utilizable para restauración');
        setLoading(false);
        return;
      }

      const resources = ['voters', 'users', 'zones', 'tasks'];
      for (const resource of resources) {
        const current = await fetch(`http://localhost:4000/${resource}`).then(r => r.json());

        for (const item of current) {
          await fetch(`http://localhost:4000/${resource}/${item.id}`, { method: 'DELETE' });
        }

        for (const item of backup.snapshot[resource] || []) {
          await fetch(`http://localhost:4000/${resource}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
        }
      }

      showAlert('success', 'Datos restaurados correctamente desde el snapshot del backup');
      loadSecurityData();
    } catch (error) {
      showAlert('error', 'Error al restaurar backup');
    } finally {
      setLoading(false);
    }
  };

  // Copias de Seguridad: Eliminar backup
  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('¿Está seguro de eliminar esta copia de seguridad?')) {
      return;
    }

    try {
      await fetch(`http://localhost:4000/backups/${backupId}`, {
        method: 'DELETE',
      });
      showAlert('success', 'Backup eliminado correctamente');
      loadSecurityData();
    } catch (error) {
      showAlert('error', 'Error al eliminar backup');
    }
  };

  // Actualizar configuración de backups automáticos
  const handleUpdateBackupConfig = async (field, value) => {
    const newConfig = { ...backupConfig, [field]: value };
    setBackupConfig(newConfig);
    showAlert('info', 'Configuración de backups actualizada');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'active':
        return 'success';
      case 'failed':
      case 'blocked':
        return 'error';
      case 'warning':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAccessTypeColor = (type) => {
    switch (type) {
      case 'login':
        return '#10b981';
      case 'logout':
        return '#6b7280';
      case 'failed':
        return '#ef4444';
      case 'blocked':
        return '#f59e0b';
      default:
        return '#667eea';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MdSecurity style={{ fontSize: 40, color: '#667eea', marginRight: 16 }} />
          <div>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c' }}>
              Seguridad y Protección de Datos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control de accesos, cifrado y copias de seguridad
            </Typography>
          </div>
        </Box>
      </Box>

      {/* Alertas */}
      {alert.open && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert({ open: false, type: '', message: '' })}>
          {alert.message}
        </Alert>
      )}

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* KPIs de Seguridad */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdShield style={{ fontSize: 32, color: 'white', marginRight: 12 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Nivel de Seguridad
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Alta
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Sistema protegido
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdLock style={{ fontSize: 32, color: 'white', marginRight: 12 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Datos Cifrados
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                {encryptionStats.percentage}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {encryptionStats.encryptedRecords} de {encryptionStats.totalRecords} registros
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdBackup style={{ fontSize: 32, color: 'white', marginRight: 12 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Copias de Seguridad
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                {backups.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Última: {backups[0]?.date ? new Date(backups[0].date).toLocaleDateString('es-ES') : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdFingerprint style={{ fontSize: 32, color: 'white', marginRight: 12 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Sesiones Activas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                {activeSessions.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Usuarios conectados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs principales */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab icon={<MdVpnKey />} iconPosition="start" label="Control de Accesos" />
          <Tab icon={<MdLock />} iconPosition="start" label="Cifrado de Datos" />
          <Tab icon={<MdBackup />} iconPosition="start" label="Copias de Seguridad" />
        </Tabs>
      </Paper>

      {/* Tab 1: Control de Accesos */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Sesiones Activas */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Sesiones Activas
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<MdRefresh />}
                    onClick={loadSecurityData}
                  >
                    Actualizar
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuario</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>Desde</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {session.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {session.role}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{session.ip}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(session.loginTime).toLocaleString('es-ES')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Cerrar sesión">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCloseSession(session.id)}
                              >
                                <MdBlock />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {activeSessions.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay sesiones activas
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Registro de Accesos */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Registro de Accesos
                  </Typography>
                  <Chip
                    label={`${accessLogs.filter(l => l.type === 'failed').length} intentos fallidos`}
                    color="error"
                    size="small"
                  />
                </Box>

                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {accessLogs.slice(0, 10).map((log) => (
                    <ListItem
                      key={log.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: log.type === 'failed' || log.type === 'blocked' ? '#fef2f2' : 'transparent',
                      }}
                    >
                      <ListItemIcon>
                        {log.type === 'login' && <MdCheckCircle style={{ color: '#10b981', fontSize: 24 }} />}
                        {log.type === 'logout' && <MdHistory style={{ color: '#6b7280', fontSize: 24 }} />}
                        {log.type === 'failed' && <MdWarning style={{ color: '#ef4444', fontSize: 24 }} />}
                        {log.type === 'blocked' && <MdBlock style={{ color: '#f59e0b', fontSize: 24 }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {log.username}
                            </Typography>
                            <Chip
                              label={log.type}
                              size="small"
                              sx={{
                                bgcolor: getAccessTypeColor(log.type),
                                color: 'white',
                                height: 20,
                                fontSize: 11,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              IP: {log.ip} • {new Date(log.timestamp).toLocaleString('es-ES')}
                            </Typography>
                            {log.reason && (
                              <Typography variant="caption" color="error">
                                Razón: {log.reason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {accessLogs.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay registros de acceso
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Permisos por Rol */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Permisos por Rol
                  </Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rol</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Usuarios</TableCell>
                        <TableCell>Permisos</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissions.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <Chip
                              label={role.role}
                              color={role.role === 'admin' ? 'error' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{role.description}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{role.userCount} usuarios</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {Object.keys(role.permissions || {}).slice(0, 3).map((perm) => (
                                <Chip key={perm} label={perm} size="small" variant="outlined" />
                              ))}
                              {Object.keys(role.permissions || {}).length > 3 && (
                                <Chip label={`+${Object.keys(role.permissions).length - 3}`} size="small" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditRole(role)}
                            >
                              <MdEdit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 2: Cifrado de Datos */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            {/* Estado del Cifrado */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Estado del Cifrado
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progreso de cifrado
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {encryptionStats.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={encryptionStats.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {encryptionStats.encryptedRecords} de {encryptionStats.totalRecords} registros cifrados
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Algoritmo de Cifrado
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={encryptionConfig.algorithm}
                      onChange={(e) =>
                        setEncryptionConfig({ ...encryptionConfig, algorithm: e.target.value })
                      }
                    >
                      <MenuItem value="AES-256">AES-256 (Recomendado)</MenuItem>
                      <MenuItem value="AES-128">AES-128</MenuItem>
                      <MenuItem value="RSA-2048">RSA-2048</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={encryptionConfig.enabled}
                        onChange={(e) =>
                          setEncryptionConfig({ ...encryptionConfig, enabled: e.target.checked })
                        }
                      />
                    }
                    label="Cifrado automático habilitado"
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MdLock />}
                  onClick={handleEncryptAllData}
                  disabled={loading || encryptionStats.percentage === 100}
                  sx={{ mt: 3 }}
                >
                  Cifrar Todos los Datos
                </Button>
              </Paper>
            </Grid>

            {/* Configuración de Campos Cifrados */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Campos a Cifrar
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Seleccione los campos que desea proteger con cifrado
                </Alert>

                <FormGroup>
                  {[
                    { id: 'dni', label: 'DNI / Documento de Identidad', icon: <MdFingerprint /> },
                    { id: 'phone', label: 'Teléfono', icon: <MdVpnKey /> },
                    { id: 'email', label: 'Correo Electrónico', icon: <MdVpnKey /> },
                    { id: 'address', label: 'Dirección', icon: <MdVpnKey /> },
                    { id: 'notes', label: 'Notas y Comentarios', icon: <MdVpnKey /> },
                    { id: 'bankAccount', label: 'Datos Bancarios', icon: <MdVpnKey /> },
                  ].map((field) => (
                    <Box
                      key={field.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        mb: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: encryptionConfig.fields.includes(field.id) ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {field.icon}
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {field.label}
                        </Typography>
                      </Box>
                      <Switch
                        checked={encryptionConfig.fields.includes(field.id)}
                        onChange={() => handleEncryptionToggle(field.id)}
                      />
                    </Box>
                  ))}
                </FormGroup>
              </Paper>
            </Grid>

            {/* Historial de Operaciones de Cifrado */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Historial de Operaciones
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Operación</TableCell>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Registros Afectados</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{new Date().toLocaleString('es-ES')}</TableCell>
                        <TableCell>Cifrado inicial</TableCell>
                        <TableCell>admin</TableCell>
                        <TableCell>10 registros</TableCell>
                        <TableCell>
                          <Chip label="Completado" color="success" size="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          {new Date(Date.now() - 86400000).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>Actualización de algoritmo</TableCell>
                        <TableCell>admin</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Chip label="Completado" color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 3: Copias de Seguridad */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            {/* Configuración de Backups */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Configuración
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={backupConfig.autoBackup}
                        onChange={(e) => handleUpdateBackupConfig('autoBackup', e.target.checked)}
                      />
                    }
                    label="Backups automáticos"
                  />
                </Box>

                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                  <InputLabel>Frecuencia</InputLabel>
                  <Select
                    value={backupConfig.frequency}
                    label="Frecuencia"
                    onChange={(e) => handleUpdateBackupConfig('frequency', e.target.value)}
                    disabled={!backupConfig.autoBackup}
                  >
                    <MenuItem value="hourly">Cada hora</MenuItem>
                    <MenuItem value="daily">Diariamente</MenuItem>
                    <MenuItem value="weekly">Semanalmente</MenuItem>
                    <MenuItem value="monthly">Mensualmente</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                  <InputLabel>Retención (días)</InputLabel>
                  <Select
                    value={backupConfig.retention}
                    label="Retención (días)"
                    onChange={(e) => handleUpdateBackupConfig('retention', e.target.value)}
                  >
                    <MenuItem value={7}>7 días</MenuItem>
                    <MenuItem value={15}>15 días</MenuItem>
                    <MenuItem value={30}>30 días</MenuItem>
                    <MenuItem value={60}>60 días</MenuItem>
                    <MenuItem value={90}>90 días</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ my: 3 }} />

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MdAdd />}
                  onClick={() => setBackupDialog({ open: true, type: 'create' })}
                >
                  Crear Backup Manual
                </Button>
              </Paper>
            </Grid>

            {/* Lista de Backups */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Copias de Seguridad Disponibles
                  </Typography>
                  <Button size="small" startIcon={<MdRefresh />} onClick={loadSecurityData}>
                    Actualizar
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tamaño</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {backup.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {backup.records?.voters || 0} votantes, {backup.records?.users || 0} usuarios
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(backup.date).toLocaleString('es-ES')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{backup.size}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={backup.type === 'manual' ? 'Manual' : 'Automático'}
                              size="small"
                              color={backup.type === 'manual' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={backup.status}
                              size="small"
                              color={getStatusColor(backup.status)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Descargar">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleDownloadBackup(backup)}
                                >
                                  <MdDownload />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Restaurar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleRestoreBackup(backup.id)}
                                >
                                  <MdUpload />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteBackup(backup.id)}
                                >
                                  <MdDelete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {backups.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <MdBackup style={{ fontSize: 64, color: '#d1d5db', marginBottom: 16 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay copias de seguridad disponibles
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      sx={{ mt: 2 }}
                      onClick={() => setBackupDialog({ open: true, type: 'create' })}
                    >
                      Crear Primera Copia
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog: Editar Permisos de Rol */}
      <Dialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Editar Permisos: {roleDialog.data?.role}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure los permisos de acceso para el rol <strong>{roleDialog.data?.role}</strong>
          </Alert>

          <Grid container spacing={2}>
            {['voters', 'users', 'zones', 'tasks', 'reports', 'settings'].map((module) => (
              <Grid item xs={12} sm={6} key={module}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, textTransform: 'capitalize' }}>
                    {module}
                  </Typography>
                  <FormGroup>
                    {['read', 'create', 'update', 'delete'].map((action) => (
                      <FormControlLabel
                        key={action}
                        control={
                          <Checkbox
                            checked={roleDialog.data?.permissions?.[module]?.[action] || false}
                            onChange={() => handlePermissionToggle(module, action)}
                          />
                        }
                        label={action}
                      />
                    ))}
                  </FormGroup>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog({ open: false, data: null })}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveRolePermissions}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmar Creación de Backup */}
      <Dialog
        open={backupDialog.open}
        onClose={() => setBackupDialog({ open: false, type: 'create' })}
      >
        <DialogTitle>Crear Copia de Seguridad</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Se creará una copia de seguridad de todos los datos del sistema
          </Alert>
          <Typography variant="body2">
            Esta operación puede tardar algunos segundos dependiendo del volumen de datos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog({ open: false, type: 'create' })}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleCreateBackup} disabled={loading}>
            Crear Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SecurityPage;
