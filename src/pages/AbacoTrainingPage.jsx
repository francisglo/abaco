import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  MdCampaign,
  MdHowToVote,
  MdEventNote,
  MdAccountBalanceWallet,
  MdOutlineQuiz,
  MdMap,
  MdAnnouncement,
  MdFactCheck,
  MdGroups
} from 'react-icons/md'
import { RiGovernmentLine } from 'react-icons/ri'

const STORAGE_KEY = 'abaco_training_data_v1'

const ROLES = [
  'personero',
  'representante',
  'contralor',
  'tesorero',
  'director',
  'coordinador',
  'maestro',
  'alumno',
  'votante'
]

const ROLE_VIEWS = {
  personero: {
    title: 'Personero Estudiantil',
    focus: ['Propuestas y votaciones', 'Seguimiento a compromisos', 'Comunicación institucional']
  },
  representante: {
    title: 'Representante de Curso',
    focus: ['Encuestas estudiantiles', 'Gestión de actividades', 'Mapas del colegio']
  },
  contralor: {
    title: 'Contralor Estudiantil',
    focus: ['Rendición de cuentas', 'Presupuesto simbólico', 'Transparencia de decisiones']
  },
  tesorero: {
    title: 'Tesorero',
    focus: ['Distribución por proyectos', 'Control financiero', 'Reportes periódicos']
  },
  director: {
    title: 'Director',
    focus: ['Visión estratégica', 'Convivencia', 'Supervisión de resultados']
  },
  coordinador: {
    title: 'Coordinador',
    focus: ['Planeación de jornadas', 'Cronogramas', 'Control de ejecución']
  },
  maestro: {
    title: 'Maestro',
    focus: ['Ciudadanía digital', 'Formación de liderazgo', 'Acompañamiento pedagógico']
  },
  alumno: {
    title: 'Alumno',
    focus: ['Participación', 'Propuestas', 'Trabajo en equipo']
  },
  votante: {
    title: 'Votante',
    focus: ['Debates', 'Votación segura', 'Decisiones responsables']
  }
}

const MODULE_TABS = [
  'Propuestas',
  'Actividades',
  'Presupuesto',
  'Encuestas',
  'Mapa',
  'Comunicados',
  'Compromisos'
]

const TRAINING_ROLE_RULES = {
  personero: { view: [0, 1, 2, 3, 4, 5, 6], edit: [0, 1, 3, 5, 6], interact: [0, 3] },
  representante: { view: [0, 1, 3, 4, 5, 6], edit: [0, 1, 3, 4, 6], interact: [0, 3] },
  contralor: { view: [1, 2, 3, 5, 6], edit: [2, 6], interact: [] },
  tesorero: { view: [2, 5, 6], edit: [2], interact: [] },
  director: { view: [0, 1, 2, 3, 4, 5, 6], edit: [0, 1, 2, 3, 4, 5, 6], interact: [0, 3] },
  coordinador: { view: [0, 1, 2, 3, 4, 5, 6], edit: [0, 1, 3, 4, 5, 6], interact: [0, 3] },
  maestro: { view: [0, 1, 3, 4, 5, 6], edit: [1, 3, 5, 6], interact: [0, 3] },
  alumno: { view: [0, 1, 3, 4, 5], edit: [4], interact: [0, 3] },
  votante: { view: [0, 3, 5], edit: [], interact: [0, 3] }
}

const EMPTY_DATA = {
  proposals: [],
  events: [],
  budgets: [],
  surveys: [],
  mapIssues: [],
  announcements: [],
  commitments: []
}

function withId(payload) {
  return { id: Date.now() + Math.floor(Math.random() * 1000), ...payload }
}

export default function AbacoTrainingPage() {
  const theme = useTheme()
  const [role, setRole] = useState('personero')
  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState('')
  const [data, setData] = useState(EMPTY_DATA)

  const [proposal, setProposal] = useState({ title: '', description: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', responsible: '' })
  const [budgetForm, setBudgetForm] = useState({ project: '', amount: '', notes: '' })
  const [surveyForm, setSurveyForm] = useState({ question: '' })
  const [mapForm, setMapForm] = useState({ zone: '', type: '', level: 'media', detail: '' })
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', date: '' })
  const [commitmentForm, setCommitmentForm] = useState({ title: '', evidence: '', status: 'pendiente' })

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      setData({ ...EMPTY_DATA, ...parsed })
    } catch {
      setData(EMPTY_DATA)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const completion = useMemo(() => {
    const checks = [
      data.proposals.length > 0,
      data.events.length > 0,
      data.budgets.length > 0,
      data.surveys.length > 0,
      data.mapIssues.length > 0,
      data.announcements.length > 0,
      data.commitments.length > 0
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [data])

  const budgetTotal = useMemo(
    () => data.budgets.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [data.budgets]
  )

  const activeRole = ROLE_VIEWS[role]
  const roleRules = TRAINING_ROLE_RULES[role] || TRAINING_ROLE_RULES.personero
  const canViewTab = roleRules.view.includes(tab)
  const canEditTab = roleRules.edit.includes(tab)
  const canInteractTab = roleRules.interact.includes(tab)

  useEffect(() => {
    if (!roleRules.view.includes(tab)) {
      setTab(roleRules.view[0] ?? 0)
    }
  }, [roleRules, tab])

  const savePulse = (text) => {
    setSaved(text)
    setTimeout(() => setSaved(''), 1800)
  }

  const createProposal = () => {
    if (!proposal.title.trim()) return
    setData((prev) => ({
      ...prev,
      proposals: [
        withId({
          title: proposal.title.trim(),
          description: proposal.description.trim(),
          votesYes: 0,
          votesNo: 0,
          status: 'debate',
          createdAt: new Date().toISOString()
        }),
        ...prev.proposals
      ]
    }))
    setProposal({ title: '', description: '' })
    savePulse('Iniciativa registrada')
  }

  const voteProposal = (id, vote) => {
    setData((prev) => ({
      ...prev,
      proposals: prev.proposals.map((item) =>
        item.id === id
          ? {
              ...item,
              votesYes: vote === 'yes' ? item.votesYes + 1 : item.votesYes,
              votesNo: vote === 'no' ? item.votesNo + 1 : item.votesNo,
              status: 'votación'
            }
          : item
      )
    }))
  }

  const createEvent = () => {
    if (!eventForm.title.trim()) return
    setData((prev) => ({
      ...prev,
      events: [withId({ ...eventForm, status: 'planificado' }), ...prev.events]
    }))
    setEventForm({ title: '', date: '', responsible: '' })
    savePulse('Actividad planificada')
  }

  const createBudget = () => {
    if (!budgetForm.project.trim()) return
    setData((prev) => ({
      ...prev,
      budgets: [withId({ ...budgetForm }), ...prev.budgets]
    }))
    setBudgetForm({ project: '', amount: '', notes: '' })
    savePulse('Proyecto presupuestado')
  }

  const createSurvey = () => {
    if (!surveyForm.question.trim()) return
    setData((prev) => ({
      ...prev,
      surveys: [withId({ question: surveyForm.question.trim(), positive: 0, neutral: 0, negative: 0 }), ...prev.surveys]
    }))
    setSurveyForm({ question: '' })
    savePulse('Encuesta creada')
  }

  const answerSurvey = (id, type) => {
    setData((prev) => ({
      ...prev,
      surveys: prev.surveys.map((item) =>
        item.id === id ? { ...item, [type]: Number(item[type] || 0) + 1 } : item
      )
    }))
  }

  const createMapIssue = () => {
    if (!mapForm.zone.trim() || !mapForm.type.trim()) return
    setData((prev) => ({ ...prev, mapIssues: [withId(mapForm), ...prev.mapIssues] }))
    setMapForm({ zone: '', type: '', level: 'media', detail: '' })
    savePulse('Incidencia geolocalizada')
  }

  const createAnnouncement = () => {
    if (!announcementForm.title.trim()) return
    setData((prev) => ({ ...prev, announcements: [withId(announcementForm), ...prev.announcements] }))
    setAnnouncementForm({ title: '', message: '', date: '' })
    savePulse('Comunicación publicada')
  }

  const createCommitment = () => {
    if (!commitmentForm.title.trim()) return
    setData((prev) => ({ ...prev, commitments: [withId(commitmentForm), ...prev.commitments] }))
    setCommitmentForm({ title: '', evidence: '', status: 'pendiente' })
    savePulse('Compromiso registrado')
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: 'calc(100vh - 96px)',
        borderRadius: 3,
        px: { xs: 0.5, md: 1 },
        py: { xs: 0.5, md: 1 },
        overflow: 'hidden',
        isolation: 'isolate',
        animation: 'trainingPageEnter 520ms ease-out',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          background: `radial-gradient(circle at 14% 24%, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 46%), radial-gradient(circle at 88% 72%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 44%), linear-gradient(140deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
          animation: 'trainingWaterShift 8.5s ease-in-out infinite alternate'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-18% -26%',
          zIndex: -1,
          background: `linear-gradient(115deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.07)} 32%, ${alpha(theme.palette.secondary.main, 0.09)} 50%, transparent 72%)`,
          transform: 'translateX(-9%)',
          animation: 'trainingWaterFlow 5.2s ease-in-out infinite'
        },
        '@keyframes trainingWaterShift': {
          '0%': { transform: 'scale(1) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.05) translate3d(-1.2%, 1.1%, 0)' }
        },
        '@keyframes trainingWaterFlow': {
          '0%': { transform: 'translateX(-9%) rotate(0deg)' },
          '50%': { transform: 'translateX(3%) rotate(0.4deg)' },
          '100%': { transform: 'translateX(-9%) rotate(0deg)' }
        },
        '@keyframes trainingPageEnter': {
          '0%': { opacity: 0.7, transform: 'translateY(9px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        '& > *': {
          position: 'relative',
          zIndex: 1
        }
      }}
    >
      <Card
        sx={{
          mb: 2,
          background: `linear-gradient(130deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main} 100%)`,
          color: 'white'
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RiGovernmentLine size={20} />
              <Typography variant="h5" fontWeight={800}>ÁBACO Training</Typography>
            </Stack>
            <Typography variant="body1">
              Sistema operativo de liderazgo cívico para estudiantes · Gobierno estudiantil
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92 }}>
              Liderazgo · Participación · Convivencia · Ciudadanía digital · Habilidades organizacionales
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>Semillero de dirigentes</Typography>
                  <Chip label={`${completion}% implementado`} color={completion === 100 ? 'success' : 'primary'} size="small" />
                </Stack>
                <LinearProgress value={completion} variant="determinate" sx={{ height: 8, borderRadius: 999 }} />
                <Alert severity="info" sx={{ mt: 0.5 }}>
                  Simulador + gestor real de gobernanza juvenil con trazabilidad de decisiones.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <MdGroups size={18} />
                  <Typography variant="subtitle1" fontWeight={700}>Vista por rol</Typography>
                </Stack>
                <TextField select size="small" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </TextField>
                <Typography variant="body2" fontWeight={600}>{activeRole.title}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {activeRole.focus.map((item) => (
                    <Chip key={item} label={item} size="small" variant="outlined" />
                  ))}
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={0.8}>
                  {roleRules.view.map((index) => (
                    <Chip key={`v-${index}`} size="small" label={`Ver: ${MODULE_TABS[index]}`} variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              mb: 1.5,
              '& .MuiTabs-indicator': {
                background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
              }
            }}
          >
            {MODULE_TABS.map((item, index) => (
              <Tab key={item} label={item} disabled={!roleRules.view.includes(index)} />
            ))}
          </Tabs>
          <Divider sx={{ mb: 2 }} />

          {saved && (
            <Alert severity="success" sx={{ mb: 2 }}>{saved}</Alert>
          )}

          {!canViewTab && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Este rol no tiene acceso a este módulo.
            </Alert>
          )}

          {canViewTab && !canEditTab && !canInteractTab && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Módulo en modo solo lectura para este rol.
            </Alert>
          )}

          {canViewTab && !canEditTab && canInteractTab && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Modo participación: este rol puede interactuar (votar/responder), pero no crear nuevos registros.
            </Alert>
          )}

          {tab === 0 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdCampaign /><Typography fontWeight={700}>Propuestas y votaciones estudiantiles</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Iniciativa" value={proposal.title} onChange={(e) => setProposal((p) => ({ ...p, title: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Resumen" value={proposal.description} onChange={(e) => setProposal((p) => ({ ...p, description: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createProposal}>Registrar</Button></Grid>
                </Grid>
              </Box>
              <Stack spacing={1}>
                {data.proposals.map((item) => (
                  <Card key={item.id} variant="outlined" sx={{ borderColor: alpha(theme.palette.primary.main, 0.25) }}>
                    <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                      <Stack spacing={0.9}>
                        <Typography fontWeight={700}>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{item.description || 'Sin descripción'}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={`Sí: ${item.votesYes}`} color="success" variant="outlined" />
                          <Chip size="small" label={`No: ${item.votesNo}`} color="error" variant="outlined" />
                          <Chip size="small" label={item.status} />
                          <Button disabled={!canInteractTab} size="small" variant="outlined" startIcon={<MdHowToVote />} onClick={() => voteProposal(item.id, 'yes')}>Votar Sí</Button>
                          <Button disabled={!canInteractTab} size="small" variant="outlined" onClick={() => voteProposal(item.id, 'no')}>Votar No</Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Stack>
          )}

          {tab === 1 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdEventNote /><Typography fontWeight={700}>Gestión de actividades y eventos</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Actividad" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" type="date" label="Fecha" InputLabelProps={{ shrink: true }} value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Responsable" value={eventForm.responsible} onChange={(e) => setEventForm((p) => ({ ...p, responsible: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createEvent}>Crear</Button></Grid>
                </Grid>
              </Box>
              {data.events.map((item) => (
                <Chip key={item.id} label={`${item.title} · ${item.date || 'sin fecha'} · ${item.responsible || 'sin responsable'}`} variant="outlined" />
              ))}
            </Stack>
          )}

          {tab === 2 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdAccountBalanceWallet /><Typography fontWeight={700}>Presupuesto simbólico</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Proyecto" value={budgetForm.project} onChange={(e) => setBudgetForm((p) => ({ ...p, project: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth size="small" type="number" label="Monto" value={budgetForm.amount} onChange={(e) => setBudgetForm((p) => ({ ...p, amount: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Notas" value={budgetForm.notes} onChange={(e) => setBudgetForm((p) => ({ ...p, notes: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createBudget}>Agregar</Button></Grid>
                </Grid>
              </Box>
              <Alert severity="info">Total asignado: {budgetTotal.toLocaleString()} créditos</Alert>
              {data.budgets.map((item) => (
                <Chip key={item.id} label={`${item.project} · ${Number(item.amount || 0).toLocaleString()} créditos`} variant="outlined" />
              ))}
            </Stack>
          )}

          {tab === 3 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdOutlineQuiz /><Typography fontWeight={700}>Encuestas estudiantiles</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={10}><TextField fullWidth size="small" label="Pregunta" value={surveyForm.question} onChange={(e) => setSurveyForm({ question: e.target.value })} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createSurvey}>Crear</Button></Grid>
                </Grid>
              </Box>
              {data.surveys.map((item) => (
                <Card key={item.id} variant="outlined">
                  <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                    <Stack spacing={1}>
                      <Typography fontWeight={700}>{item.question}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button disabled={!canInteractTab} size="small" onClick={() => answerSurvey(item.id, 'positive')}>Positiva ({item.positive})</Button>
                        <Button disabled={!canInteractTab} size="small" onClick={() => answerSurvey(item.id, 'neutral')}>Neutral ({item.neutral})</Button>
                        <Button disabled={!canInteractTab} size="small" onClick={() => answerSurvey(item.id, 'negative')}>Crítica ({item.negative})</Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {tab === 4 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdMap /><Typography fontWeight={700}>Mapas del colegio (microterritorio)</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={2}><TextField fullWidth size="small" label="Zona" value={mapForm.zone} onChange={(e) => setMapForm((p) => ({ ...p, zone: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Tipo" value={mapForm.type} onChange={(e) => setMapForm((p) => ({ ...p, type: e.target.value }))} placeholder="ruido / inseguridad" /></Grid>
                  <Grid item xs={12} md={2}>
                    <TextField select fullWidth size="small" label="Nivel" value={mapForm.level} onChange={(e) => setMapForm((p) => ({ ...p, level: e.target.value }))}>
                      <MenuItem value="alta">Alta</MenuItem>
                      <MenuItem value="media">Media</MenuItem>
                      <MenuItem value="baja">Baja</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Detalle" value={mapForm.detail} onChange={(e) => setMapForm((p) => ({ ...p, detail: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createMapIssue}>Reportar</Button></Grid>
                </Grid>
              </Box>
              {data.mapIssues.map((item) => (
                <Chip key={item.id} label={`${item.zone} · ${item.type} · ${item.level}`} variant="outlined" />
              ))}
            </Stack>
          )}

          {tab === 5 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdAnnouncement /><Typography fontWeight={700}>Comunicación institucional</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Título" value={announcementForm.title} onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={5}><TextField fullWidth size="small" label="Mensaje" value={announcementForm.message} onChange={(e) => setAnnouncementForm((p) => ({ ...p, message: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth size="small" type="date" label="Fecha" InputLabelProps={{ shrink: true }} value={announcementForm.date} onChange={(e) => setAnnouncementForm((p) => ({ ...p, date: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createAnnouncement}>Publicar</Button></Grid>
                </Grid>
              </Box>
              {data.announcements.map((item) => (
                <Alert key={item.id} severity="info">{item.title}: {item.message} {item.date ? `(${item.date})` : ''}</Alert>
              ))}
            </Stack>
          )}

          {tab === 6 && canViewTab && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdFactCheck /><Typography fontWeight={700}>Seguimiento a compromisos</Typography></Stack>
              <Box component="fieldset" disabled={!canEditTab} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Compromiso" value={commitmentForm.title} onChange={(e) => setCommitmentForm((p) => ({ ...p, title: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}>
                    <TextField select fullWidth size="small" label="Estado" value={commitmentForm.status} onChange={(e) => setCommitmentForm((p) => ({ ...p, status: e.target.value }))}>
                      <MenuItem value="pendiente">Pendiente</MenuItem>
                      <MenuItem value="en progreso">En progreso</MenuItem>
                      <MenuItem value="cumplido">Cumplido</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Evidencia" value={commitmentForm.evidence} onChange={(e) => setCommitmentForm((p) => ({ ...p, evidence: e.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createCommitment}>Añadir</Button></Grid>
                </Grid>
              </Box>
              {data.commitments.map((item) => (
                <Chip key={item.id} label={`${item.title} · ${item.status} · ${item.evidence || 'sin evidencia'}`} color={item.status === 'cumplido' ? 'success' : 'default'} />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
