import React, { useMemo, useState } from 'react'
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Link,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { MdLocationOn, MdLanguage, MdWork, MdEmojiEvents, MdArticle, MdEdit, MdClose } from 'react-icons/md'
import { RiProfileLine } from 'react-icons/ri'
import { HiSparkles } from 'react-icons/hi2'
import { IoRocketOutline } from 'react-icons/io5'
import { TbShieldLock } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultPathByRole } from '../config/roleAccess'

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, loading, updateProfile, deleteAccount } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    role: user?.role || 'operator',
    phone: user?.profile?.phone || user?.phone || '',
    bio: user?.profile?.bio || '',
    avatar: user?.profile?.avatar || '',
    headline: user?.profile?.headline || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || '',
    skillsText: Array.isArray(user?.profile?.skills) ? user.profile.skills.join(', ') : '',
    experience: user?.profile?.experience || '',
    timelineText: Array.isArray(user?.profile?.timeline) ? user.profile.timeline.join('\n') : '',
    achievementsText: Array.isArray(user?.profile?.achievements) ? user.profile.achievements.join('\n') : ''
  }))

  const initials = useMemo(() => {
    const source = form.name || user?.name || 'U'
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0])
      .join('')
      .toUpperCase()
  }, [form.name, user?.name])

  const skillsList = useMemo(
    () => form.skillsText.split(',').map((item) => item.trim()).filter(Boolean),
    [form.skillsText]
  )

  const timelineList = useMemo(
    () => form.timelineText.split('\n').map((item) => item.trim()).filter(Boolean),
    [form.timelineText]
  )

  const achievementsList = useMemo(
    () => form.achievementsText.split('\n').map((item) => item.trim()).filter(Boolean),
    [form.achievementsText]
  )

  const sections = useMemo(() => {
    return [
      {
        id: 'identity',
        title: 'Identidad',
        description: 'Nombre, titular y contacto profesional.',
        complete: Boolean(form.name && form.headline && form.phone)
      },
      {
        id: 'social',
        title: 'Red profesional',
        description: 'Ubicación, sitio web y biografía.',
        complete: Boolean(form.location && form.website && form.bio)
      },
      {
        id: 'career',
        title: 'Trayectoria',
        description: 'Habilidades, experiencia, timeline y logros.',
        complete: Boolean(skillsList.length && form.experience && timelineList.length && achievementsList.length)
      }
    ]
  }, [
    achievementsList.length,
    form.bio,
    form.experience,
    form.headline,
    form.location,
    form.name,
    form.phone,
    form.website,
    skillsList.length,
    timelineList.length
  ])

  const completionPercent = Math.round(
    (sections.filter((section) => section.complete).length / sections.length) * 100
  )

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const onAvatarChange = async (event) => {
    setError('')
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    if (file.size > 1024 * 1024) {
      setError('La imagen no puede superar 1MB')
      return
    }

    try {
      const dataUrl = await toDataUrl(file)
      setForm((prev) => ({ ...prev, avatar: dataUrl }))
    } catch (uploadError) {
      setError(uploadError.message)
    }
  }

  const onSave = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      await updateProfile({
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar,
        headline: form.headline.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        skills: form.skillsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        experience: form.experience.trim(),
        timeline: form.timelineText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        achievements: form.achievementsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      })
      setSuccess('Perfil actualizado correctamente')
      navigate(getDefaultPathByRole(form.role), { replace: true })
    } catch (saveError) {
      setError(saveError.message || 'No se pudo actualizar el perfil')
    }
  }

  const onDeleteAccount = async () => {
    setError('')
    setSuccess('')

    const password = window.prompt('Para eliminar tu cuenta, escribe tu contraseña:')
    if (!password) return

    try {
      await deleteAccount(password)
      navigate('/', { replace: true })
    } catch (deleteError) {
      setError(deleteError.message || 'No se pudo eliminar la cuenta')
    }
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Card>
        <Box
          sx={{
            height: 170,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
            position: 'relative'
          }}
        />

        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mt: -6 }}>
              <Avatar
                src={form.avatar || undefined}
                sx={{
                  width: 110,
                  height: 110,
                  fontSize: 34,
                  fontWeight: 700,
                  border: '4px solid',
                  borderColor: 'background.paper',
                  boxShadow: (theme) => `0 10px 24px ${alpha(theme.palette.common.black, 0.2)}`
                }}
              >
                {initials}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={800}>
                  {form.name || 'Tu nombre'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.75 }}>
                  {form.headline || 'Añade un titular profesional para destacar tu perfil'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  {form.location && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MdLocationOn size={16} />
                      <Typography variant="body2" color="text.secondary">{form.location}</Typography>
                    </Stack>
                  )}
                  {form.website && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MdLanguage size={16} />
                      <Link href={form.website} target="_blank" rel="noreferrer" underline="hover" variant="body2">
                        Sitio web
                      </Link>
                    </Stack>
                  )}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant={isEditing ? 'outlined' : 'contained'}
                  startIcon={isEditing ? <MdClose /> : <MdEdit />}
                  onClick={() => {
                    setIsEditing((prev) => !prev)
                    setError('')
                    setSuccess('')
                  }}
                  sx={!isEditing ? {
                    background: (theme) => `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                  } : undefined}
                >
                  {isEditing ? 'Ocultar editor' : 'Actualizar perfil'}
                </Button>
              </Stack>
            </Stack>

            <Divider />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Card
              variant="outlined"
              sx={{
                borderColor: (theme) => alpha(theme.palette.secondary.main, 0.45),
                background: (theme) => `linear-gradient(145deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
              }}
            >
              <CardContent>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <RiProfileLine size={18} />
                      <Typography variant="subtitle1" fontWeight={700}>Estado del perfil</Typography>
                    </Stack>
                    <Chip
                      label={`${completionPercent}% completado`}
                      color={completionPercent === 100 ? 'success' : 'primary'}
                      size="small"
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={completionPercent}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {sections.map((section) => (
                      <Chip
                        key={section.id}
                        label={`${section.title} · ${section.complete ? 'Completo' : 'Pendiente'}`}
                        color={section.complete ? 'success' : 'default'}
                        variant={section.complete ? 'filled' : 'outlined'}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Collapse in={isEditing} timeout={260} unmountOnExit>
              <Box component="form" onSubmit={onSave}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <HiSparkles size={16} />
                          <Typography variant="subtitle1" fontWeight={700}>Tarjeta 1 · Identidad</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Información principal del perfil.</Typography>
                        <TextField label="Nombre" value={form.name} onChange={onChange('name')} required fullWidth />
                        <TextField label="Correo" value={user?.email || ''} disabled fullWidth />
                        <FormControl fullWidth>
                          <InputLabel id="profile-role-label">Rol activo</InputLabel>
                          <Select
                            labelId="profile-role-label"
                            label="Rol activo"
                            value={form.role}
                            onChange={onChange('role')}
                          >
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="operator">Operador</MenuItem>
                            <MenuItem value="auditor">Auditor</MenuItem>
                            <MenuItem value="viewer">Visualizador</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField label="Teléfono" value={form.phone} onChange={onChange('phone')} fullWidth />
                        <TextField
                          label="Titular profesional"
                          value={form.headline}
                          onChange={onChange('headline')}
                          placeholder="Ej: Coordinador territorial | Analista de datos"
                          fullWidth
                        />
                        <Button component="label" variant="outlined" size="small">
                          Cambiar foto
                          <input hidden type="file" accept="image/*" onChange={onAvatarChange} />
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <IoRocketOutline size={16} />
                          <Typography variant="subtitle1" fontWeight={700}>Tarjeta 2 · Red social</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Cómo te encuentran y cómo te presentas.</Typography>
                        <TextField label="Ubicación" value={form.location} onChange={onChange('location')} placeholder="Ciudad, Región" fullWidth />
                        <TextField label="Sitio web" value={form.website} onChange={onChange('website')} placeholder="https://..." fullWidth />
                        <TextField label="Bio" value={form.bio} onChange={onChange('bio')} multiline minRows={5} fullWidth />
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <MdWork size={16} />
                          <Typography variant="subtitle1" fontWeight={700}>Tarjeta 3 · Experiencia y habilidades</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Tu valor profesional en formato resumido.</Typography>
                        <TextField
                          label="Habilidades (separadas por coma)"
                          value={form.skillsText}
                          onChange={onChange('skillsText')}
                          placeholder="Liderazgo, Estrategia, CRM"
                          fullWidth
                        />
                        <TextField
                          label="Experiencia"
                          value={form.experience}
                          onChange={onChange('experience')}
                          multiline
                          minRows={4}
                          placeholder="Describe tu experiencia principal"
                          fullWidth
                        />
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <MdArticle size={16} />
                          <Typography variant="subtitle1" fontWeight={700}>Tarjeta 4 · Actividad y logros</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Como timeline y biografía organizada.</Typography>
                        <TextField
                          label="Timeline profesional (una publicación por línea)"
                          value={form.timelineText}
                          onChange={onChange('timelineText')}
                          multiline
                          minRows={4}
                          placeholder="Lanzamiento de estrategia de campo Q1"
                          fullWidth
                        />
                        <TextField
                          label="Logros / Certificaciones (uno por línea)"
                          value={form.achievementsText}
                          onChange={onChange('achievementsText')}
                          multiline
                          minRows={3}
                          placeholder="Certificación en análisis electoral"
                          fullWidth
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={22} /> : 'Guardar perfil por tarjetas'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, timelineText: '', achievementsText: '' }))
                    }}
                  >
                    Limpiar actividad
                  </Button>
                </Stack>
              </Box>
            </Collapse>

            <Card
              variant="outlined"
              sx={{
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                background: (theme) => `linear-gradient(140deg, ${alpha(theme.palette.primary.dark, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.09)} 100%)`
              }}
            >
              <CardContent>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <TbShieldLock size={16} />
                    <Typography variant="subtitle1" fontWeight={700}>Biografía organizada (vista pública)</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {form.bio || 'Completa tus tarjetas para mostrar una biografía más completa.'}
                  </Typography>

                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <MdWork size={16} />
                    <Typography variant="body2" color="text.secondary">
                      {form.experience || 'Sin experiencia cargada aún'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {skillsList.slice(0, 12).map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{
                          color: 'primary.dark',
                          borderColor: (theme) => alpha(theme.palette.primary.main, 0.45),
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08)
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>

                  <Divider sx={{ my: 0.5 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <MdArticle size={16} />
                      <Typography variant="subtitle2" fontWeight={700}>Timeline</Typography>
                    </Stack>
                    {timelineList.slice(0, 5).map((post) => (
                      <Box
                        key={post}
                        sx={{
                          px: 1.25,
                          py: 1,
                          borderRadius: 1.5,
                          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92),
                          border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">{post}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <MdEmojiEvents size={16} />
                      <Typography variant="subtitle2" fontWeight={700}>Logros y certificaciones</Typography>
                    </Stack>
                    {achievementsList.slice(0, 6).map((achievement) => (
                      <Chip
                        key={achievement}
                        label={achievement}
                        variant="outlined"
                        size="small"
                        sx={{
                          color: 'secondary.dark',
                          borderColor: (theme) => alpha(theme.palette.secondary.main, 0.5),
                          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08)
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Collapse in={isEditing} timeout={220} unmountOnExit>
              <Box sx={{ pt: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={700} color="error.main" gutterBottom>
                  Zona de peligro
                </Typography>
                <Button color="error" variant="outlined" onClick={onDeleteAccount} disabled={loading}>
                  Borrar mi cuenta
                </Button>
              </Box>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
