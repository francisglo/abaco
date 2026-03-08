import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUsersFull, createUser, updateUserById, deleteUserById } from '../store/usersSlice'
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
  useTheme,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material'
import { MdPerson, MdEmail, MdPhone, MdLocationOn, MdVerifiedUser, MdEdit, MdDelete } from 'react-icons/md'
import { HiUsers, HiUserAdd } from 'react-icons/hi'
import { RiAdminFill, RiUserSearchLine, RiUserSettingsLine } from 'react-icons/ri'

export default function UsersPage() {
  const dispatch = useDispatch()
  const { users, loading } = useSelector(s => s.users)
  const [form, setForm] = useState({ name: '', email: '', role: 'operator', phone: '', zoneId: '' })
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'operator', phone: '', zoneId: '', active: true })
  const theme = useTheme()

  useEffect(() => { 
    if (!users || users.length === 0) dispatch(fetchUsersFull()) 
  }, [dispatch])

  function handleChange(e) { 
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value })) 
  }
  
  function submit(e) { 
    e.preventDefault()
    dispatch(createUser({ ...form, active: true, zoneId: form.zoneId ? Number(form.zoneId) : null }))
    setForm({ name: '', email: '', role: 'operator', phone: '', zoneId: '' })
  }

  const openEditDialog = (user) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'operator',
      phone: user.phone || '',
      zoneId: user.zoneId || '',
      active: user.active !== false
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingUser?.id) return
    dispatch(updateUserById({
      id: editingUser.id,
      payload: {
        ...editingUser,
        ...editForm,
        zoneId: editForm.zoneId ? Number(editForm.zoneId) : null
      }
    }))
    setEditDialogOpen(false)
    setEditingUser(null)
  }

  const handleDeleteUser = (user) => {
    if (!window.confirm(`¿Eliminar usuario ${user.name}?`)) return
    dispatch(deleteUserById(user.id))
  }

  const getRoleIcon = (role) => {
    const icons = {
      admin: <RiAdminFill size={28} />,
      operator: <RiUserSettingsLine size={28} />,
      auditor: <RiUserSearchLine size={28} />,
    }
    return icons[role] || <MdPerson size={28} />
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: '#dc2626',
      operator: '#667eea',
      auditor: '#00b37e',
    }
    return colors[role] || '#94a3b8'
  }

  const getRoleDisplayName = (role, index, sameRoleCount) => {
    const roleNames = {
      admin: 'Admin',
      operator: 'Operador',
      auditor: 'Auditor',
    }
    const baseName = roleNames[role] || role
    
    // Solo agregar número si hay más de uno del mismo rol
    if (sameRoleCount > 1) {
      return `${baseName} ${index + 1}`
    }
    return baseName
  }

  const filteredUsers = (users || []).filter((user) => {
    const q = query.trim().toLowerCase()
    const matchQuery = !q || user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q) || String(user.zoneId || '').includes(q)
    const matchRole = roleFilter === 'all' || user.role === roleFilter
    return matchQuery && matchRole
  })

  // Agrupar usuarios por rol y contar
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = []
    }
    acc[user.role].push(user)
    return acc
  }, {})

  const activeUsers = (users || []).filter(user => user.active).length
  const adminUsers = (users || []).filter(user => user.role === 'admin').length
  const operatorUsers = (users || []).filter(user => user.role === 'operator').length

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1
          }}
        >
          <HiUsers style={{ color: '#667eea' }} />
          Gestión de Usuarios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administra usuarios, roles y permisos del sistema
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Usuarios activos</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00b37e' }}>{activeUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Administradores</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>{adminUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Operadores</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>{operatorUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '2px solid #667eea',
              bgcolor: alpha('#667eea', 0.02)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#667eea', width: 40, height: 40 }}>
                <HiUserAdd size={20} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                Crear Usuario
              </Typography>
            </Box>

            <form onSubmit={submit}>
              <Stack spacing={2.5}>
                <TextField
                  name="name"
                  label="Nombre completo"
                  placeholder="Ej: Juan Pérez"
                  value={form.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <MdPerson size={20} color="#667eea" style={{ marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'white',
                    },
                  }}
                />

                <TextField
                  name="email"
                  label="Correo electrónico"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <MdEmail size={20} color="#667eea" style={{ marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'white',
                    },
                  }}
                />

                <TextField
                  name="phone"
                  label="Teléfono"
                  placeholder="+1 234 567 890"
                  value={form.phone}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    startAdornment: <MdPhone size={20} color="#667eea" style={{ marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'white',
                    },
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel>Rol del usuario</InputLabel>
                  <Select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    label="Rol del usuario"
                    sx={{
                      borderRadius: 2,
                      bgcolor: 'white',
                    }}
                  >
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RiAdminFill color="#dc2626" />
                        <Typography>Administrador</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="operator">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RiUserSettingsLine color="#667eea" />
                        <Typography>Operador</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="auditor">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RiUserSearchLine color="#00b37e" />
                        <Typography>Auditor</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  name="zoneId"
                  label="ID de Territorio"
                  type="number"
                  placeholder="1, 2, 3..."
                  value={form.zoneId}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    startAdornment: <MdLocationOn size={20} color="#667eea" style={{ marginRight: 8 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'white',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    textTransform: 'none',
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f92 100%)',
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                    },
                  }}
                >
                  Crear Usuario
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar por nombre, correo o territorio..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RiUserSearchLine color="#667eea" />
                    </InputAdornment>
                  )
                }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filtrar rol</InputLabel>
                <Select value={roleFilter} label="Filtrar rol" onChange={(e) => setRoleFilter(e.target.value)}>
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="operator">Operador</MenuItem>
                  <MenuItem value="auditor">Auditor</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
              Usuarios Registrados ({filteredUsers.length})
            </Typography>

            {loading && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Cargando usuarios...
              </Typography>
            )}

            <Grid container spacing={2}>
              {Object.entries(groupedUsers).map(([role, roleUsers]) => (
                roleUsers.map((user, index) => {
                  const sameRoleCount = roleUsers.length
                  const displayName = getRoleDisplayName(role, index, sameRoleCount)
                  
                  return (
                    <Grid item xs={12} md={6} key={user.id}>
                      <Card
                        elevation={0}
                        sx={{
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(getRoleColor(user.role), 0.15),
                                  color: getRoleColor(user.role),
                                  width: 56,
                                  height: 56,
                                }}
                              >
                                {getRoleIcon(user.role)}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 0.5 }}>
                                  {user.name}
                                </Typography>
                                <Chip
                                  label={displayName}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(getRoleColor(user.role), 0.15),
                                    color: getRoleColor(user.role),
                                    fontWeight: 600,
                                    height: 24,
                                  }}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" sx={{ color: '#667eea' }} onClick={() => openEditDialog(user)}>
                                <MdEdit />
                              </IconButton>
                              <IconButton size="small" sx={{ color: '#dc2626' }} onClick={() => handleDeleteUser(user)}>
                                <MdDelete />
                              </IconButton>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1.5 }} />

                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MdEmail size={16} color="#667eea" />
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                            {user.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdPhone size={16} color="#667eea" />
                                <Typography variant="body2" color="text.secondary">
                                  {user.phone}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MdLocationOn size={16} color="#667eea" />
                              <Typography variant="body2" color="text.secondary">
                                Territorio: {user.zoneId ?? 'No asignado'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MdVerifiedUser size={16} color={user.active ? '#00b37e' : '#94a3b8'} />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: user.active ? '#00b37e' : '#94a3b8',
                                  fontWeight: 600 
                                }}
                              >
                                {user.active ? 'Activo' : 'Inactivo'}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })
              ))}
            </Grid>

            {!loading && (!users || users.length === 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No hay usuarios registrados
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Editar usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} fullWidth />
            <TextField label="Email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} fullWidth />
            <TextField label="Teléfono" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select value={editForm.role} label="Rol" onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="operator">Operador</MenuItem>
                <MenuItem value="auditor">Auditor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Territorio (zoneId)" type="number" value={editForm.zoneId} onChange={(e) => setEditForm(prev => ({ ...prev, zoneId: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={String(editForm.active)} label="Estado" onChange={(e) => setEditForm(prev => ({ ...prev, active: e.target.value === 'true' }))}>
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
