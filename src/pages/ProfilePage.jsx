import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
} from '@mui/material';
import { MdLocationOn, MdLanguage, MdWork, MdEmojiEvents, MdArticle, MdEdit, MdClose } from 'react-icons/md';
import { RiProfileLine } from 'react-icons/ri';
import { HiSparkles } from 'react-icons/hi2';
import { IoRocketOutline } from 'react-icons/io5';
import { TbShieldLock } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultPathByRole } from '../config/roleAccess';
import CoworkingPortfolio from '../components/CoworkingPortfolio';

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, updateProfile, deleteAccount } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    role: user?.role || 'operator',
    phone: user?.profile?.phone || user?.phone || '',
    headline: user?.profile?.headline || '',
    avatar: user?.profile?.avatar || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || '',
    bio: user?.profile?.bio || '',
    skillsText: user?.profile?.skills?.join(', ') || '',
    experience: user?.profile?.experience || '',
    timelineText: user?.profile?.timeline?.join('\n') || '',
    achievementsText: user?.profile?.achievements?.join('\n') || ''
  }));

  const initials = useMemo(() => {
    if (!form.name) return '';
    return form.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }, [form.name]);

  const skillsList = useMemo(() => form.skillsText.split(',').map(s => s.trim()).filter(Boolean), [form.skillsText]);
  const timelineList = useMemo(() => form.timelineText.split('\n').map(s => s.trim()).filter(Boolean), [form.timelineText]);
  const achievementsList = useMemo(() => form.achievementsText.split('\n').map(s => s.trim()).filter(Boolean), [form.achievementsText]);

  const onChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await toDataUrl(file);
      setForm((prev) => ({ ...prev, avatar: url }));
    } catch {
      setError('No se pudo cargar la imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await updateProfile({
        name: form.name,
        role: form.role,
        profile: {
          phone: form.phone,
          headline: form.headline,
          avatar: form.avatar,
          location: form.location,
          website: form.website,
          bio: form.bio,
          skills: skillsList,
          experience: form.experience,
          timeline: timelineList,
          achievements: achievementsList
        }
      });
      setSuccess('Perfil actualizado');
    } catch (err) {
      setError('Error al actualizar el perfil');
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <form onSubmit={handleSubmit}>
        <Card>
          <Box sx={{ height: 170, background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`, position: 'relative' }} />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mt: -6 }}>
                <Avatar
                  src={form.avatar || undefined}
                  sx={{ width: 110, height: 110, fontSize: 34, fontWeight: 700, border: '4px solid', borderColor: 'background.paper' }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, width: '100%' }}>
                  {/* Card 1: Identidad */}
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.22 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 12px 2px #00fff7, 0 4px 24px 0 rgba(0,0,0,0.18)',
                      filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 8px #00fff7cc)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <TextField label="Nombre" value={form.name} onChange={onChange('name')} required fullWidth />
                          <TextField label="Correo" value={user?.email || ''} disabled fullWidth />
                          <FormControl fullWidth>
                            <InputLabel id="profile-role-label">Rol activo</InputLabel>
                            <Select labelId="profile-role-label" label="Rol activo" value={form.role} onChange={onChange('role')}>
                              <MenuItem value="manager">Manager</MenuItem>
                              <MenuItem value="operator">Operador</MenuItem>
                              <MenuItem value="auditor">Auditor</MenuItem>
                              <MenuItem value="viewer">Visualizador</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField label="Teléfono" value={form.phone} onChange={onChange('phone')} fullWidth />
                          <TextField label="Titular profesional" value={form.headline} onChange={onChange('headline')} placeholder="Ej: Coordinador territorial | Analista de datos" fullWidth />
                          <Button component="label" variant="outlined" size="small">
                            Cambiar foto
                            <input hidden type="file" accept="image/*" onChange={onAvatarChange} />
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* Card 2: Red social */}
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.26 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 12px 2px #00fff7, 0 4px 24px 0 rgba(0,0,0,0.18)',
                      filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 8px #00fff7cc)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <TextField label="Ubicación" value={form.location} onChange={onChange('location')} placeholder="Ciudad, Región" fullWidth />
                          <TextField label="Sitio web" value={form.website} onChange={onChange('website')} placeholder="https://..." fullWidth />
                          <TextField label="Bio" value={form.bio} onChange={onChange('bio')} multiline minRows={5} fullWidth />
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* Card 3: Experiencia y habilidades */}
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.3 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 12px 2px #00fff7, 0 4px 24px 0 rgba(0,0,0,0.18)',
                      filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 8px #00fff7cc)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <TextField label="Habilidades (separadas por coma)" value={form.skillsText} onChange={onChange('skillsText')} placeholder="Liderazgo, Estrategia, CRM" fullWidth />
                          <TextField label="Experiencia" value={form.experience} onChange={onChange('experience')} multiline minRows={4} placeholder="Describe tu experiencia principal" fullWidth />
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                  {/* Card 4: Actividad y logros */}
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.34 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 12px 2px #00fff7, 0 4px 24px 0 rgba(0,0,0,0.18)',
                      filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 8px #00fff7cc)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <TextField label="Timeline profesional (una publicación por línea)" value={form.timelineText} onChange={onChange('timelineText')} multiline minRows={4} placeholder="Lanzamiento de estrategia de campo Q1" fullWidth />
                          <TextField label="Logros / Certificaciones (uno por línea)" value={form.achievementsText} onChange={onChange('achievementsText')} multiline minRows={3} placeholder="Certificación en análisis electoral" fullWidth />
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={22} /> : 'Guardar perfil por tarjetas'}
                </Button>
                <Button type="button" variant="outlined" onClick={() => setForm((prev) => ({ ...prev, timelineText: '', achievementsText: '' }))}>
                  Limpiar actividad
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
}

                        const skillsList = useMemo(
                          () => form.skillsText.split(',').map((item) => item.trim()).filter(Boolean),
                          [form.skillsText]
                        );

                        const timelineList = useMemo(
                          () => form.timelineText.split('\n').map((item) => item.trim()).filter(Boolean),
                          [form.timelineText]
                        );

                        const achievementsList = useMemo(
                          () => form.achievementsText.split('\n').map((item) => item.trim()).filter(Boolean),
                          [form.achievementsText]
                        );

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
                          ];
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
                        ]);

                        const completionPercent = Math.round(
                          (sections.filter((section) => section.complete).length / sections.length) * 100
                        );

                        const onChange = (field) => (event) => {
                          setForm((prev) => ({ ...prev, [field]: event.target.value }));
                        };

                        const onAvatarChange = async (event) => {
                          setError('');
                          const file = event.target.files?.[0];
                          if (!file) return;

                          if (!file.type.startsWith('image/')) {
                            setError('Solo se permiten archivos de imagen');
                            return;
                          }

                          if (file.size > 1024 * 1024) {
                            setError('La imagen no puede superar 1MB');
                            return;
                          }

                          try {
                            const dataUrl = await toDataUrl(file);
                            setForm((prev) => ({ ...prev, avatar: dataUrl }));
                          } catch (uploadError) {
                            setError(uploadError.message);
                          }
                        };

                        const onSave = async (event) => {
                          event.preventDefault();
                          setError('');
                          setSuccess('');
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
                            });
                            setSuccess('Perfil actualizado correctamente');
                            navigate(getDefaultPathByRole(form.role), { replace: true });
                          } catch (saveError) {
                            setError(saveError.message || 'No se pudo actualizar el perfil');
                          }
                        };

                        const onDeleteAccount = async () => {
                          setError('');
                          setSuccess('');

                          const password = window.prompt('Para eliminar tu cuenta, escribe tu contraseña:');
                          if (!password) return;

                          try {
                            await deleteAccount(password);
                            navigate('/', { replace: true });
                          } catch (deleteError) {
                            setError(deleteError.message || 'No se pudo eliminar la cuenta');
                          }
                        };

// Código duplicado eliminado: return fuera de la función principal
