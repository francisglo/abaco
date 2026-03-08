/**
 * ÁBACO - Página de Tareas y Calendario
 */

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTasks, createTask, updateTask, deleteTask } from '../store/tasksSlice'
import { fetchUsersFull } from '../store/usersSlice'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  Stack,
  Avatar,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { MdAdd, MdEdit, MdDelete, MdCheck, MdCalendarToday, MdPerson } from 'react-icons/md'
import { HiClock } from 'react-icons/hi'
import { format, addDays, startOfWeek, isSameDay, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

export default function TasksPage() {
  const dispatch = useDispatch()
  const { tasks, loading } = useSelector(s => s.tasks)
  const { users } = useSelector(s => s.users)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('list') // list, calendar, kanban
  const [completedHistory, setCompletedHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('abaco_completed_tasks_history') || '[]')
    } catch {
      return []
    }
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0],
    type: 'field_work'
  })

  useEffect(() => {
    if (!tasks || tasks.length === 0) dispatch(fetchTasks())
    if (!users || users.length === 0) dispatch(fetchUsersFull())
  }, [dispatch])

  useEffect(() => {
    localStorage.setItem('abaco_completed_tasks_history', JSON.stringify(completedHistory))
  }, [completedHistory])

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0],
      type: 'field_work'
    })
  }

  const handleSaveTask = () => {
    const payload = {
      ...taskForm,
      assignedTo: taskForm.assignedTo ? Number(taskForm.assignedTo) : null,
      completed: taskForm.status === 'completed'
    }

    if (editingTask?.id) {
      dispatch(updateTask({
        id: editingTask.id,
        updates: {
          ...editingTask,
          ...payload
        }
      }))
    } else {
      dispatch(createTask({
        ...payload,
        createdAt: new Date().toISOString()
      }))
    }

    setOpenDialog(false)
    setEditingTask(null)
    resetTaskForm()
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      type: task.type || 'field_work'
    })
    setOpenDialog(true)
  }

  const getUserName = (userId) => {
    const user = (users || []).find(u => Number(u.id) === Number(userId))
    return user?.name || `Usuario #${userId}`
  }

  const handleToggleComplete = (task) => {
    const willComplete = !task.completed

    dispatch(updateTask({
      id: task.id,
      updates: {
        ...task,
        completed: willComplete,
        status: willComplete ? 'completed' : 'pending',
        completedAt: willComplete ? new Date().toISOString() : null
      }
    }))

    if (willComplete) {
      setCompletedHistory(prev => [
        {
          id: `${task.id}-${Date.now()}`,
          taskId: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo,
          completedAt: new Date().toISOString()
        },
        ...prev
      ].slice(0, 200))
    }
  }

  const moveTaskStatus = (task, nextStatus) => {
    const willComplete = nextStatus === 'completed'

    dispatch(updateTask({
      id: task.id,
      updates: {
        ...task,
        status: nextStatus,
        completed: willComplete,
        completedAt: willComplete ? new Date().toISOString() : task.completedAt || null
      }
    }))

    if (willComplete) {
      setCompletedHistory(prev => [
        {
          id: `${task.id}-${Date.now()}`,
          taskId: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo,
          completedAt: new Date().toISOString()
        },
        ...prev
      ].slice(0, 200))
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#94a3b8',
      medium: '#f59e0b',
      high: '#dc2626'
    }
    return colors[priority] || '#94a3b8'
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#667eea',
      completed: '#00b37e',
      cancelled: '#94a3b8'
    }
    return colors[status] || '#94a3b8'
  }

  const filterTasksByDate = (date) => {
    return (tasks || []).filter(task => {
      if (!task.dueDate) return false
      return isSameDay(new Date(task.dueDate), date)
    })
  }

  const weekDays = []
  const start = startOfWeek(selectedDate, { locale: es })
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(start, i))
  }

  const pendingCount = (tasks || []).filter(task => !task.completed).length
  const completedCount = (tasks || []).filter(task => task.completed).length
  const highPriorityCount = (tasks || []).filter(task => task.priority === 'high').length

  const statusColumns = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'in_progress', label: 'En progreso' },
    { key: 'completed', label: 'Completadas' },
  ]

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MdCalendarToday style={{ color: '#667eea' }} />
            Tareas y Calendario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pendingCount} tareas pendientes
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('list')}
            sx={{ textTransform: 'none' }}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('calendar')}
            sx={{ textTransform: 'none' }}
          >
            Calendario
          </Button>
          {viewMode === 'calendar' && (
            <>
              <Button variant="outlined" onClick={() => setSelectedDate(subDays(selectedDate, 7))} sx={{ textTransform: 'none' }}>
                Semana -1
              </Button>
              <Button variant="outlined" onClick={() => setSelectedDate(new Date())} sx={{ textTransform: 'none' }}>
                Hoy
              </Button>
              <Button variant="outlined" onClick={() => setSelectedDate(addDays(selectedDate, 7))} sx={{ textTransform: 'none' }}>
                Semana +1
              </Button>
            </>
          )}
          <Button
            variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('kanban')}
            sx={{ textTransform: 'none' }}
          >
            Kanban
          </Button>
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            onClick={() => setOpenDialog(true)}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Nueva Tarea
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Pendientes</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Completadas</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00b37e' }}>{completedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Alta prioridad</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>{highPriorityCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vista de Calendario Semanal */}
      {viewMode === 'calendar' && <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Calendario Semanal
        </Typography>
        <Grid container spacing={2}>
          {weekDays.map((day, index) => {
            const dayTasks = filterTasksByDate(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <Grid item xs={12} md={1.71} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    border: isToday ? '2px solid #667eea' : '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 2,
                    bgcolor: isToday ? 'rgba(102, 126, 234, 0.05)' : 'white'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {format(day, 'EEE', { locale: es }).toUpperCase()}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: isToday ? '#667eea' : '#1f2937', mb: 1 }}>
                      {format(day, 'd')}
                    </Typography>
                    <Stack spacing={0.5}>
                      {dayTasks.slice(0, 3).map(task => (
                        <Chip
                          key={task.id}
                          label={task.title}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            bgcolor: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority),
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{dayTasks.length - 3} más
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Paper>}

      {/* Lista de Tareas */}
      {viewMode === 'list' && <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Todas las Tareas
        </Typography>
        <Grid container spacing={2}>
          {(tasks || []).map(task => (
            <Grid item xs={12} md={6} key={task.id}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: 2,
                  opacity: task.completed ? 0.6 : 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Checkbox
                        checked={task.completed || false}
                        onChange={() => handleToggleComplete(task)}
                        sx={{ p: 0 }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? '#94a3b8' : '#1f2937'
                        }}
                      >
                        {task.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleEditTask(task)}>
                        <MdEdit size={18} />
                      </IconButton>
                      <IconButton size="small" onClick={() => dispatch(deleteTask(task.id))}>
                        <MdDelete size={18} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {task.description}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{
                        bgcolor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{
                        bgcolor: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status),
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                  </Stack>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HiClock size={16} color="#667eea" />
                      <Typography variant="caption" color="text.secondary">
                        {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
                      </Typography>
                    </Box>
                    {task.assignedTo && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MdPerson size={16} color="#667eea" />
                        <Typography variant="caption" color="text.secondary">
                          {getUserName(task.assignedTo)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {(!tasks || tasks.length === 0) && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No hay tareas creadas. ¡Crea tu primera tarea!
          </Typography>
        )}
      </Paper>}

      {viewMode === 'kanban' && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
          {statusColumns.map(column => (
            <Grid item xs={12} md={4} key={column.key}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', minHeight: 380 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>{column.label}</Typography>
                <Stack spacing={1.2}>
                  {(tasks || [])
                    .filter(task => task.status === column.key)
                    .map(task => (
                      <Card key={task.id} elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{task.dueDate || 'Sin fecha'}</Typography>
                          <Stack direction="row" spacing={0.6} sx={{ mt: 1 }}>
                            {task.status === 'pending' && (
                              <Button size="small" onClick={() => moveTaskStatus(task, 'in_progress')}>Mover a progreso</Button>
                            )}
                            {task.status === 'in_progress' && (
                              <Button size="small" onClick={() => moveTaskStatus(task, 'completed')}>Completar</Button>
                            )}
                            {task.status === 'completed' && (
                              <Button size="small" onClick={() => moveTaskStatus(task, 'pending')}>Reabrir</Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                </Stack>
              </Paper>
            </Grid>
          ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', minHeight: 380 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Historial de completadas
              </Typography>

              <Stack spacing={1}>
                {completedHistory.slice(0, 12).map(item => (
                  <Card key={item.id} elevation={0} sx={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                    <CardContent sx={{ py: '10px !important' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.completedAt ? format(new Date(item.completedAt), 'dd MMM yyyy HH:mm', { locale: es }) : 'Sin fecha'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                {completedHistory.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Aún no hay tareas completadas en este navegador.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Dialog para crear tarea */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditingTask(null); resetTaskForm() }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="Título"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Descripción"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={taskForm.priority}
                    label="Prioridad"
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={taskForm.status}
                    label="Estado"
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="in_progress">En Progreso</MenuItem>
                    <MenuItem value="completed">Completada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Asignar a</InputLabel>
              <Select
                value={taskForm.assignedTo}
                label="Asignar a"
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {(users || []).map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenDialog(false); setEditingTask(null); resetTaskForm() }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveTask}
            disabled={!taskForm.title}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
