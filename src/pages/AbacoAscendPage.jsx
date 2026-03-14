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
  MdAccountTree,
  MdCampaign,
  MdInsights,
  MdGroups,
  MdAccountBalanceWallet,
  MdBadge,
  MdTrackChanges,
  MdEmojiEvents,
  MdAssignmentTurnedIn
} from 'react-icons/md'
import { RiBuilding4Line } from 'react-icons/ri'

const STORAGE_KEY = 'abaco_ascend_data_v1'

const FACULTIES = ['Ingeniería', 'Derecho', 'Salud', 'Economía', 'Educación', 'Humanidades']

const MODULES = [
  'Movimientos',
  'Campañas',
  'Opinión',
  'Facultades',
  'Presupuesto',
  'Representantes',
  'Estrategia',
  'Logros'
]

const ASCEND_ROLE_RULES = {
  director: {
    label: 'Director universitario',
    view: [0, 1, 2, 3, 4, 5, 6, 7],
    edit: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  coordinador: {
    label: 'Coordinador general',
    view: [0, 1, 2, 3, 5, 6, 7],
    edit: [0, 1, 2, 3, 5, 6]
  },
  representante: {
    label: 'Representante estudiantil',
    view: [0, 1, 2, 3, 5, 7],
    edit: [0, 1, 2, 3, 5]
  },
  personero: {
    label: 'Personero universitario',
    view: [0, 1, 2, 3, 5, 6, 7],
    edit: [0, 1, 2, 3, 5, 6]
  },
  contralor: {
    label: 'Contralor',
    view: [2, 3, 4, 5, 6, 7],
    edit: [2, 3, 4, 7]
  },
  tesorero: {
    label: 'Tesorero',
    view: [3, 4, 6, 7],
    edit: [4]
  },
  maestro: {
    label: 'Docente asesor',
    view: [2, 3, 5, 6, 7],
    edit: [2, 6]
  },
  alumno: {
    label: 'Alumno líder',
    view: [0, 1, 2, 7],
    edit: [2]
  },
  votante: {
    label: 'Votante universitario',
    view: [1, 2],
    edit: []
  }
}

const EMPTY = {
  movements: [],
  campaigns: [],
  opinions: [],
  facultyAgreements: [],
  budgets: [],
  representatives: [],
  strategicPlans: [],
  achievements: []
}

function withId(payload) {
  return { id: Date.now() + Math.floor(Math.random() * 1000), ...payload }
}

export default function AbacoAscendPage() {
    React.useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
  const theme = useTheme()
  const [data, setData] = useState(EMPTY)
  const [tab, setTab] = useState(0)
  const [activeRole, setActiveRole] = useState('director')
  const [saved, setSaved] = useState('')

  const [movementForm, setMovementForm] = useState({ name: '', faculty: 'Ingeniería', members: '', action: '' })
  const [campaignForm, setCampaignForm] = useState({ name: '', segment: '', volunteers: '', voteTrend: '' })
  const [opinionForm, setOpinionForm] = useState({ faculty: 'Ingeniería', issue: '', priority: 'media', reputation: '' })
  const [agreementForm, setAgreementForm] = useState({ faculties: '', topic: '', status: 'en curso' })
  const [budgetForm, setBudgetForm] = useState({ project: '', assigned: '', spent: '' })
  const [repForm, setRepForm] = useState({ name: '', role: '', faculty: 'Ingeniería', period: '', responsibilities: '' })
  const [strategyForm, setStrategyForm] = useState({ objective: '', indicator: '', target: '', progress: '' })
  const [achievementForm, setAchievementForm] = useState({ title: '', impact: '', score: '' })

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      setData({ ...EMPTY, ...JSON.parse(raw) })
    } catch {
      setData(EMPTY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const savePulse = (text) => {
    setSaved(text)
    setTimeout(() => setSaved(''), 1500)
  }

  const moduleCompletion = useMemo(() => {
    const checks = Object.values(data).map((arr) => Array.isArray(arr) && arr.length > 0)
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [data])

  const totalAssigned = useMemo(
    () => data.budgets.reduce((acc, item) => acc + Number(item.assigned || 0), 0),
    [data.budgets]
  )

  const totalSpent = useMemo(
    () => data.budgets.reduce((acc, item) => acc + Number(item.spent || 0), 0),
    [data.budgets]
  )

  const reputation = useMemo(() => {
    const projects = data.strategicPlans.length * 8
    const execution = data.achievements.reduce((acc, item) => acc + Number(item.score || 0), 0)
    const commitments = data.facultyAgreements.filter((x) => x.status === 'cumplido').length * 10
    return Math.min(100, projects + execution + commitments)
  }, [data])

  const leadershipPortfolio = useMemo(() => {
    return {
      positions: data.representatives.length,
      projects: data.strategicPlans.length,
      measurableResults: data.achievements.length,
      developedSkills: data.movements.length + data.campaigns.length
    }
  }, [data])

  const rolePolicy = useMemo(
    () => ASCEND_ROLE_RULES[activeRole] || ASCEND_ROLE_RULES.director,
    [activeRole]
  )

  const canViewTab = rolePolicy.view.includes(tab)
  const canEditTab = rolePolicy.edit.includes(tab)

  useEffect(() => {
    if (!rolePolicy.view.includes(tab)) {
      setTab(rolePolicy.view[0] ?? 0)
    }
  }, [rolePolicy, tab])

  const addMovement = () => {
    if (!movementForm.name.trim()) return
    setData((prev) => ({ ...prev, movements: [withId(movementForm), ...prev.movements] }))
    setMovementForm({ name: '', faculty: 'Ingeniería', members: '', action: '' })
    savePulse('Movimiento registrado')
  }

  const addCampaign = () => {
    if (!campaignForm.name.trim()) return
    setData((prev) => ({ ...prev, campaigns: [withId(campaignForm), ...prev.campaigns] }))
    setCampaignForm({ name: '', segment: '', volunteers: '', voteTrend: '' })
    savePulse('Campaña universitaria registrada')
  }

  const addOpinion = () => {
    if (!opinionForm.issue.trim()) return
    setData((prev) => ({ ...prev, opinions: [withId(opinionForm), ...prev.opinions] }))
    setOpinionForm({ faculty: 'Ingeniería', issue: '', priority: 'media', reputation: '' })
    savePulse('Opinión estudiantil incorporada')
  }

  const addAgreement = () => {
    if (!agreementForm.faculties.trim() || !agreementForm.topic.trim()) return
    setData((prev) => ({ ...prev, facultyAgreements: [withId(agreementForm), ...prev.facultyAgreements] }))
    setAgreementForm({ faculties: '', topic: '', status: 'en curso' })
    savePulse('Acuerdo interfacultades creado')
  }

  const addBudget = () => {
    if (!budgetForm.project.trim()) return
    setData((prev) => ({ ...prev, budgets: [withId(budgetForm), ...prev.budgets] }))
    setBudgetForm({ project: '', assigned: '', spent: '' })
    savePulse('Presupuesto actualizado')
  }

  const addRepresentative = () => {
    if (!repForm.name.trim()) return
    setData((prev) => ({ ...prev, representatives: [withId(repForm), ...prev.representatives] }))
    setRepForm({ name: '', role: '', faculty: 'Ingeniería', period: '', responsibilities: '' })
    savePulse('Representante registrado')
  }

  const addStrategy = () => {
    if (!strategyForm.objective.trim()) return
    setData((prev) => ({ ...prev, strategicPlans: [withId(strategyForm), ...prev.strategicPlans] }))
    setStrategyForm({ objective: '', indicator: '', target: '', progress: '' })
    savePulse('Objetivo estratégico agregado')
  }

  const addAchievement = () => {
    if (!achievementForm.title.trim()) return
    setData((prev) => ({ ...prev, achievements: [withId(achievementForm), ...prev.achievements] }))
    setAchievementForm({ title: '', impact: '', score: '' })
    savePulse('Logro añadido al portafolio')
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
        animation: 'asendPageEnter 520ms ease-out',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          background: `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.secondary.main, 0.17)} 0%, transparent 42%), radial-gradient(circle at 84% 76%, ${alpha(theme.palette.primary.main, 0.14)} 0%, transparent 40%), linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
          animation: 'asendWaterShift 8.2s ease-in-out infinite alternate'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-20% -24%',
          zIndex: -1,
          background: `linear-gradient(120deg, transparent 0%, ${alpha(theme.palette.secondary.main, 0.08)} 35%, ${alpha(theme.palette.primary.main, 0.08)} 52%, transparent 75%)`,
          transform: 'translateX(-10%)',
          animation: 'asendWaterFlow 5s ease-in-out infinite'
        },
        '@keyframes asendWaterShift': {
          '0%': { transform: 'scale(1) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.06) translate3d(1.1%, -0.9%, 0)' }
        },
        '@keyframes asendWaterFlow': {
          '0%': { transform: 'translateX(-10%) rotate(0deg)' },
          '50%': { transform: 'translateX(4%) rotate(-0.45deg)' },
          '100%': { transform: 'translateX(-10%) rotate(0deg)' }
        },
        '@keyframes asendPageEnter': {
          '0%': { opacity: 0.72, transform: 'translateY(9px)' },
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
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.secondary.main} 100%)`,
          color: 'white'
        }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RiBuilding4Line size={20} />
              <Typography variant="h5" fontWeight={800}>ÁBACO Ascend</Typography>
            </Stack>
            <Typography variant="body1">Nivel universitario · Organización política y administrativa real</Typography>
            <Typography variant="body2" sx={{ opacity: 0.92 }}>
              Gestión de movimientos · campañas · análisis de opinión · presupuesto real · planeación estratégica
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={700}>Madurez operativa universitaria</Typography>
                <LinearProgress value={moduleCompletion} variant="determinate" sx={{ height: 8, borderRadius: 999 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Implementación: ${moduleCompletion}%`} color={moduleCompletion === 100 ? 'success' : 'primary'} size="small" />
                  <Chip label={`Reputación: ${reputation}/100`} color="secondary" size="small" />
                  <Chip label={`Portafolio cívico activo`} variant="outlined" size="small" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={700}>Control por rol</Typography>
                <TextField
                  select
                  size="small"
                  label="Rol activo"
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                >
                  {Object.entries(ASCEND_ROLE_RULES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{key} · {value.label}</MenuItem>
                  ))}
                </TextField>
                <Typography variant="body2" color="text.secondary">{rolePolicy.label}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {rolePolicy.view.map((index) => (
                    <Chip key={`view-${index}`} size="small" label={`Ver: ${MODULES[index]}`} variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 1.5 }}>
            {MODULES.map((moduleName, index) => (
              <Tab
                key={moduleName}
                label={moduleName}
                disabled={!rolePolicy.view.includes(index)}
              />
            ))}
          </Tabs>
          <Divider sx={{ mb: 2 }} />

          {saved && <Alert severity="success" sx={{ mb: 2 }}>{saved}</Alert>}

          {!canViewTab && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Este rol no tiene acceso a este módulo.
            </Alert>
          )}

          {canViewTab && !canEditTab && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Modo solo lectura para este rol en este módulo.
            </Alert>
          )}

          {tab === 0 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdAccountTree /><Typography fontWeight={700}>Gestión de movimientos estudiantiles</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Movimiento" value={movementForm.name} onChange={(e) => setMovementForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} select size="small" fullWidth label="Facultad" value={movementForm.faculty} onChange={(e) => setMovementForm((p) => ({ ...p, faculty: e.target.value }))}>{FACULTIES.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth type="number" label="Miembros" value={movementForm.members} onChange={(e) => setMovementForm((p) => ({ ...p, members: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Acción coordinada" value={movementForm.action} onChange={(e) => setMovementForm((p) => ({ ...p, action: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addMovement}>Registrar</Button></Grid>
              </Grid>
              {data.movements.map((item) => <Chip key={item.id} label={`${item.name} · ${item.faculty} · ${item.members || 0} miembros`} variant="outlined" />)}
            </Stack>
          )}

          {tab === 1 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdCampaign /><Typography fontWeight={700}>Campañas universitarias</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Campaña" value={campaignForm.name} onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Segmento" value={campaignForm.segment} onChange={(e) => setCampaignForm((p) => ({ ...p, segment: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth type="number" label="Voluntarios" value={campaignForm.volunteers} onChange={(e) => setCampaignForm((p) => ({ ...p, volunteers: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Tendencia" value={campaignForm.voteTrend} onChange={(e) => setCampaignForm((p) => ({ ...p, voteTrend: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addCampaign}>Guardar</Button></Grid>
              </Grid>
              {data.campaigns.map((item) => <Chip key={item.id} label={`${item.name} · ${item.segment} · ${item.volunteers || 0} voluntarios`} variant="outlined" />)}
            </Stack>
          )}

          {tab === 2 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdInsights /><Typography fontWeight={700}>Análisis de opinión estudiantil</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} select size="small" fullWidth label="Facultad" value={opinionForm.faculty} onChange={(e) => setOpinionForm((p) => ({ ...p, faculty: e.target.value }))}>{FACULTIES.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={4}><TextField disabled={!canEditTab} size="small" fullWidth label="Problema prioritario" value={opinionForm.issue} onChange={(e) => setOpinionForm((p) => ({ ...p, issue: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} select size="small" fullWidth label="Prioridad" value={opinionForm.priority} onChange={(e) => setOpinionForm((p) => ({ ...p, priority: e.target.value }))}><MenuItem value="alta">Alta</MenuItem><MenuItem value="media">Media</MenuItem><MenuItem value="baja">Baja</MenuItem></TextField></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Reputación" value={opinionForm.reputation} onChange={(e) => setOpinionForm((p) => ({ ...p, reputation: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addOpinion}>Agregar</Button></Grid>
              </Grid>
              {data.opinions.map((item) => <Chip key={item.id} label={`${item.faculty}: ${item.issue} (${item.priority})`} variant="outlined" />)}
            </Stack>
          )}

          {tab === 3 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdGroups /><Typography fontWeight={700}>Coordinación de facultades</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Facultades involucradas" value={agreementForm.faculties} onChange={(e) => setAgreementForm((p) => ({ ...p, faculties: e.target.value }))} /></Grid>
                <Grid item xs={12} md={5}><TextField disabled={!canEditTab} size="small" fullWidth label="Tema / acuerdo" value={agreementForm.topic} onChange={(e) => setAgreementForm((p) => ({ ...p, topic: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} select size="small" fullWidth label="Estado" value={agreementForm.status} onChange={(e) => setAgreementForm((p) => ({ ...p, status: e.target.value }))}><MenuItem value="en curso">En curso</MenuItem><MenuItem value="aprobado">Aprobado</MenuItem><MenuItem value="cumplido">Cumplido</MenuItem></TextField></Grid>
                <Grid item xs={12} md={2}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addAgreement}>Registrar</Button></Grid>
              </Grid>
              {data.facultyAgreements.map((item) => <Chip key={item.id} label={`${item.faculties} · ${item.topic} · ${item.status}`} color={item.status === 'cumplido' ? 'success' : 'default'} />)}
            </Stack>
          )}

          {tab === 4 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdAccountBalanceWallet /><Typography fontWeight={700}>Presupuesto real</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={4}><TextField disabled={!canEditTab} size="small" fullWidth label="Proyecto financiado" value={budgetForm.project} onChange={(e) => setBudgetForm((p) => ({ ...p, project: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth type="number" label="Asignado" value={budgetForm.assigned} onChange={(e) => setBudgetForm((p) => ({ ...p, assigned: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth type="number" label="Gastado" value={budgetForm.spent} onChange={(e) => setBudgetForm((p) => ({ ...p, spent: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addBudget}>Guardar</Button></Grid>
                <Grid item xs={12} md={2}><Chip label={`Saldo: ${(totalAssigned - totalSpent).toLocaleString()}`} color="info" /></Grid>
              </Grid>
              {data.budgets.map((item) => (
                <Chip key={item.id} label={`${item.project} · Asig: ${Number(item.assigned || 0).toLocaleString()} · Gasto: ${Number(item.spent || 0).toLocaleString()}`} variant="outlined" />
              ))}
            </Stack>
          )}

          {tab === 5 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdBadge /><Typography fontWeight={700}>Registro de representantes</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Nombre" value={repForm.name} onChange={(e) => setRepForm((p) => ({ ...p, name: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Cargo" value={repForm.role} onChange={(e) => setRepForm((p) => ({ ...p, role: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} select size="small" fullWidth label="Facultad" value={repForm.faculty} onChange={(e) => setRepForm((p) => ({ ...p, faculty: e.target.value }))}>{FACULTIES.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Periodo" value={repForm.period} onChange={(e) => setRepForm((p) => ({ ...p, period: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Responsabilidades" value={repForm.responsibilities} onChange={(e) => setRepForm((p) => ({ ...p, responsibilities: e.target.value }))} /></Grid>
                <Grid item xs={12} md={1}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addRepresentative}>+</Button></Grid>
              </Grid>
              {data.representatives.map((item) => <Chip key={item.id} label={`${item.name} · ${item.role} · ${item.faculty} · ${item.period}`} variant="outlined" />)}
            </Stack>
          )}

          {tab === 6 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdTrackChanges /><Typography fontWeight={700}>Planeación estratégica</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={4}><TextField disabled={!canEditTab} size="small" fullWidth label="Objetivo anual" value={strategyForm.objective} onChange={(e) => setStrategyForm((p) => ({ ...p, objective: e.target.value }))} /></Grid>
                <Grid item xs={12} md={3}><TextField disabled={!canEditTab} size="small" fullWidth label="Indicador" value={strategyForm.indicator} onChange={(e) => setStrategyForm((p) => ({ ...p, indicator: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Meta" value={strategyForm.target} onChange={(e) => setStrategyForm((p) => ({ ...p, target: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth label="Avance %" value={strategyForm.progress} onChange={(e) => setStrategyForm((p) => ({ ...p, progress: e.target.value }))} /></Grid>
                <Grid item xs={12} md={1}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addStrategy}>+</Button></Grid>
              </Grid>
              {data.strategicPlans.map((item) => (
                <Chip key={item.id} label={`${item.objective} · ${item.indicator} · ${item.progress || 0}%`} variant="outlined" />
              ))}
            </Stack>
          )}

          {tab === 7 && canViewTab && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} alignItems="center"><MdEmojiEvents /><Typography fontWeight={700}>Logros, reputación y portafolio de liderazgo</Typography></Stack>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={4}><TextField disabled={!canEditTab} size="small" fullWidth label="Logro" value={achievementForm.title} onChange={(e) => setAchievementForm((p) => ({ ...p, title: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField disabled={!canEditTab} size="small" fullWidth label="Impacto real" value={achievementForm.impact} onChange={(e) => setAchievementForm((p) => ({ ...p, impact: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><TextField disabled={!canEditTab} size="small" fullWidth type="number" label="Puntaje" value={achievementForm.score} onChange={(e) => setAchievementForm((p) => ({ ...p, score: e.target.value }))} /></Grid>
                <Grid item xs={12} md={2}><Button disabled={!canEditTab} fullWidth variant="contained" onClick={addAchievement}>Añadir</Button></Grid>
              </Grid>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: alpha(theme.palette.primary.main, 0.35) }}>
                    <CardContent>
                      <Stack spacing={0.75}>
                        <Stack direction="row" spacing={0.8} alignItems="center"><MdAssignmentTurnedIn /><Typography fontWeight={700}>CV cívico automático</Typography></Stack>
                        <Typography variant="body2">Cargos ocupados: {leadershipPortfolio.positions}</Typography>
                        <Typography variant="body2">Proyectos ejecutados: {leadershipPortfolio.projects}</Typography>
                        <Typography variant="body2">Resultados medibles: {leadershipPortfolio.measurableResults}</Typography>
                        <Typography variant="body2">Habilidades desarrolladas: {leadershipPortfolio.developedSkills}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: alpha(theme.palette.secondary.main, 0.45) }}>
                    <CardContent>
                      <Typography fontWeight={700} gutterBottom>Modelo de negocio educativo (viable)</Typography>
                      <Typography variant="body2">• Licencias por institución</Typography>
                      <Typography variant="body2">• Convenios con ministerios de educación</Typography>
                      <Typography variant="body2">• Programas de formación cívica</Typography>
                      <Typography variant="body2">• EdTech + GovTech</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {data.achievements.map((item) => (
                <Chip key={item.id} label={`${item.title} · impacto: ${item.impact} · +${item.score || 0} pts`} color="secondary" variant="outlined" />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
