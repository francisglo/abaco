import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchVoters, createVoter, updateVoter } from '../store/votersSlice'
import { fetchLogs, createLog } from '../api'
import VoterRow from '../components/VoterRow'
import ContactForm from '../components/ContactForm'
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  InputAdornment, 
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  Avatar,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { MdSearch, MdFilterList, MdPerson, MdPhone, MdLocationOn, MdClose } from 'react-icons/md'
import { HiUserAdd } from 'react-icons/hi'
import { RiContactsBook2Fill } from 'react-icons/ri'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as MapTooltip } from 'react-leaflet'

export default function VotersPage() {
  const dispatch = useDispatch()
  const { voters, loading } = useSelector(s => s.voters)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [recent, setRecent] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '',
    dni: '',
    phone: '',
    address: '',
    lat: '',
    lng: '',
    status: 'pending',
    priority: 'medium'
  })
  const theme = useTheme()

  useEffect(() => {
    if (!voters || voters.length === 0) dispatch(fetchVoters())
    fetchLogs().then(setRecent).catch(() => {})
  }, [dispatch])

  const filtered = (voters || []).filter(v => {
    const q = query.toLowerCase()
    return v.name.toLowerCase().includes(q) || (v.phone||'').includes(q) || (v.dni||'').includes(q)
  })

  function handleContactSubmit(payload) {
    createLog({ ...payload, userId: 1 }).then(log => {
      if (payload.result === 'confirmed') {
        dispatch(updateVoter({ id: payload.voterId, payload: { ...voters.find(v=>v.id===payload.voterId), status: 'confirmed' } }))
      }
      setSelected(null)
      fetchLogs().then(setRecent)
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': '#00b37e',
      'pending': '#f59e0b',
      'active': '#667eea',
    }
    return colors[status] || '#94a3b8'
  }

  const getVoterCoordinates = (voter) => {
    if (voter?.coords) {
      const lat = Number(voter.coords.lat)
      const lng = Number(voter.coords.lng)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng]
      }
    }

    const lat = Number(voter?.lat)
    const lng = Number(voter?.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng]
    }

    return null
  }

  const votersWithCoords = filtered
    .map(voter => ({ voter, position: getVoterCoordinates(voter) }))
    .filter(item => Array.isArray(item.position))

  const mapCenter = votersWithCoords[0]?.position || [-34.6037, -58.3816]

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 1 }}>
            <RiContactsBook2Fill style={{ color: '#667eea' }} />
            Gestión de Contactos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {filtered.length} contactos encontrados
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<HiUserAdd size={20} />}
          onClick={() => setOpenDialog(true)}
          sx={{ 
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f92 100%)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
            }
          }}
        >
          Nuevo Contacto
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, teléfono o documento..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch size={24} color="#667eea" />
                    </InputAdornment>
                  ),
                  endAdornment: query && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuery('')}>
                        <MdClose />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            </Box>

            <Stack spacing={2}>
              {loading && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Cargando contactos...
                </Typography>
              )}
              {!loading && filtered.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No se encontraron contactos
                </Typography>
              )}
              {filtered.map((v) => (
                <Card 
                  key={v.id}
                  elevation={0}
                  sx={{ 
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(getStatusColor(v.status), 0.15),
                            color: getStatusColor(v.status),
                            width: 48,
                            height: 48,
                          }}
                        >
                          <MdPerson size={24} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 0.5 }}>
                            {v.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {v.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MdPhone size={16} color="#667eea" />
                                <Typography variant="body2" color="text.secondary">
                                  {v.phone}
                                </Typography>
                              </Box>
                            )}
                            {v.dni && (
                              <Typography variant="body2" color="text.secondary">
                                DNI: {v.dni}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={v.status || 'pending'} 
                          size="small"
                          sx={{ 
                            bgcolor: alpha(getStatusColor(v.status), 0.15),
                            color: getStatusColor(v.status),
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setSelected(v)}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: 1.5,
                            fontWeight: 600,
                          }}
                        >
                          {v.status === 'pending' ? 'Registrar' : 'Gestionar'}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1f2937' }}>
                Interacciones Recientes
              </Typography>
              <Stack spacing={2}>
                {recent.slice(0, 8).map((log) => (
                  <Card 
                    key={log.id}
                    elevation={0}
                    sx={{ 
                      p: 1.5,
                      bgcolor: '#f8f9fa',
                      borderRadius: 1.5,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {new Date(log.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      </Typography>
                      <Chip 
                        label={log.result || log.contactType} 
                        size="small"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.65rem',
                          bgcolor: log.result === 'confirmed' ? 'rgba(0, 179, 126, 0.15)' : 'rgba(102, 126, 234, 0.15)',
                          color: log.result === 'confirmed' ? '#00b37e' : '#667eea',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#4b5563' }}>
                      {log.note || 'Sin notas'}
                    </Typography>
                  </Card>
                ))}
                {recent.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No hay interacciones registradas
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdLocationOn style={{ color: '#667eea' }} />
                Mapa de votantes
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Haz click o pasa el mouse para ver cédula, teléfono, nombre y datos completos.
              </Typography>
              <Box sx={{ height: 360, borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {votersWithCoords.map(({ voter, position }) => (
                    <CircleMarker
                      key={voter.id}
                      center={position}
                      radius={8}
                      pathOptions={{ color: getStatusColor(voter.status), fillColor: getStatusColor(voter.status), fillOpacity: 0.7 }}
                    >
                      <MapTooltip direction="top" offset={[0, -8]} opacity={1}>
                        {voter.name}
                      </MapTooltip>
                      <Popup>
                        <Box sx={{ minWidth: 220 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{voter.name}</Typography>
                          <Typography variant="body2"><strong>Cédula:</strong> {voter.dni || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Teléfono:</strong> {voter.phone || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Dirección:</strong> {voter.address || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Estado:</strong> {voter.status || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Prioridad:</strong> {voter.priority || 'N/A'}</Typography>
                        </Box>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </Box>
            </Paper>

            {selected && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '2px solid #667eea', bgcolor: alpha('#667eea', 0.02) }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                    Registrar Interacción
                  </Typography>
                  <IconButton size="small" onClick={() => setSelected(null)}>
                    <MdClose />
                  </IconButton>
                </Box>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {selected.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.phone} • {selected.dni}
                  </Typography>
                </Box>
                <ContactForm voter={selected} onSubmit={handleContactSubmit} onCancel={() => setSelected(null)} />
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HiUserAdd size={24} color="#667eea" />
            Crear Nuevo Contacto
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="Nombre completo"
              placeholder="Ej: Juan Pérez"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              required
              fullWidth
              InputProps={{
                startAdornment: <MdPerson size={20} color="#667eea" style={{ marginRight: 8 }} />,
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="DNI / Documento"
                  placeholder="12345678"
                  value={newContact.dni}
                  onChange={(e) => setNewContact({ ...newContact, dni: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Teléfono"
                  placeholder="555-0001"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: <MdPhone size={20} color="#667eea" style={{ marginRight: 8 }} />,
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Dirección"
              placeholder="Calle Principal 123"
              value={newContact.address}
              onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <MdLocationOn size={20} color="#667eea" style={{ marginRight: 8 }} />,
              }}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                Coordenadas (Opcional - para aparecer en el mapa)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Latitud"
                    placeholder="-34.6037"
                    value={newContact.lat}
                    onChange={(e) => setNewContact({ ...newContact, lat: e.target.value })}
                    fullWidth
                    type="number"
                    inputProps={{ step: 0.0001 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Longitud"
                    placeholder="-58.3816"
                    value={newContact.lng}
                    onChange={(e) => setNewContact({ ...newContact, lng: e.target.value })}
                    fullWidth
                    type="number"
                    inputProps={{ step: 0.0001 }}
                  />
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                💡 Tip: Puedes obtener coordenadas en Google Maps haciendo clic derecho
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={newContact.status}
                    label="Estado"
                    onChange={(e) => setNewContact({ ...newContact, status: e.target.value })}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="confirmed">Confirmado</MenuItem>
                    <MenuItem value="active">Activo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={newContact.priority}
                    label="Prioridad"
                    onChange={(e) => setNewContact({ ...newContact, priority: e.target.value })}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setOpenDialog(false)
            setNewContact({
              name: '',
              dni: '',
              phone: '',
              address: '',
              lat: '',
              lng: '',
              status: 'pending',
              priority: 'medium'
            })
          }}>
            Cancelar
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              const contactData = {
                name: newContact.name || 'Nuevo Contacto',
                dni: newContact.dni || '00000000',
                phone: newContact.phone,
                address: newContact.address,
                status: newContact.status,
                priority: newContact.priority,
                registeredBy: 1
              }

              // Solo agregar coordenadas si están completas
              if (newContact.lat && newContact.lng) {
                contactData.coords = {
                  lat: parseFloat(newContact.lat),
                  lng: parseFloat(newContact.lng)
                }
              }

              dispatch(createVoter(contactData))
              setOpenDialog(false)
              setNewContact({
                name: '',
                dni: '',
                phone: '',
                address: '',
                lat: '',
                lng: '',
                status: 'pending',
                priority: 'medium'
              })
            }}
            disabled={!newContact.name || !newContact.dni}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Crear Contacto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
