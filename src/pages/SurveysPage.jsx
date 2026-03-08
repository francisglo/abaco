/**
 * ÁBACO - Sistema de Encuestas
 */

import React, { useMemo, useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
  Select,
  MenuItem,
  Stack
} from '@mui/material'
import { MdAdd, MdEdit, MdDelete, MdBarChart } from 'react-icons/md'

const STORAGE_SURVEYS_KEY = 'abaco_surveys'
const STORAGE_RESPONSES_KEY = 'abaco_survey_responses'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const initialSurveyTemplate = {
  title: '',
  description: '',
  questions: []
}

const defaultSeedSurveys = [
  {
    id: 1001,
    title: 'Satisfacción del Servicio',
    description: 'Evaluación post-servicio en territorio',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    questions: [
      {
        id: 1,
        text: '¿Cómo calificaría nuestro servicio?',
        type: 'radio',
        options: ['Excelente', 'Bueno', 'Regular', 'Malo']
      },
      {
        id: 2,
        text: '¿Recomendaría nuestros servicios?',
        type: 'radio',
        options: ['Sí', 'No', 'Tal vez']
      }
    ]
  }
]

export default function SurveysPage() {
  const [surveys, setSurveys] = useState([])
  const [responses, setResponses] = useState([])
  const [totalContacts, setTotalContacts] = useState(0)

  const [openEditor, setOpenEditor] = useState(false)
  const [openAnswerDialog, setOpenAnswerDialog] = useState(false)
  const [openResultsDialog, setOpenResultsDialog] = useState(false)

  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [editingSurveyId, setEditingSurveyId] = useState(null)
  const [newSurvey, setNewSurvey] = useState(initialSurveyTemplate)
  const [answerDraft, setAnswerDraft] = useState({})

  useEffect(() => {
    try {
      const savedSurveys = JSON.parse(localStorage.getItem(STORAGE_SURVEYS_KEY) || 'null')
      const savedResponses = JSON.parse(localStorage.getItem(STORAGE_RESPONSES_KEY) || '[]')

      if (savedSurveys && Array.isArray(savedSurveys)) {
        setSurveys(savedSurveys)
      } else {
        setSurveys(defaultSeedSurveys)
      }

      setResponses(Array.isArray(savedResponses) ? savedResponses : [])
    } catch {
      setSurveys(defaultSeedSurveys)
      setResponses([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_SURVEYS_KEY, JSON.stringify(surveys))
  }, [surveys])

  useEffect(() => {
    localStorage.setItem(STORAGE_RESPONSES_KEY, JSON.stringify(responses))
  }, [responses])

  useEffect(() => {
    const loadTotalContacts = async () => {
      try {
        const res = await fetch(`${API_BASE}/voters`)
        if (!res.ok) throw new Error('No disponible')
        const voters = await res.json()
        setTotalContacts(Array.isArray(voters) ? voters.length : 0)
      } catch {
        setTotalContacts(0)
      }
    }

    loadTotalContacts()
  }, [])

  const responsesBySurvey = useMemo(() => {
    return responses.reduce((acc, item) => {
      const surveyId = Number(item.surveyId)
      acc[surveyId] = (acc[surveyId] || 0) + 1
      return acc
    }, {})
  }, [responses])

  const getCoverage = (surveyId) => {
    const total = totalContacts || 0
    const surveyResponses = responsesBySurvey[Number(surveyId)] || 0
    if (!total) return 0
    return Math.min(100, Math.round((surveyResponses / total) * 100))
  }

  const openCreateDialog = () => {
    setEditingSurveyId(null)
    setNewSurvey(initialSurveyTemplate)
    setOpenEditor(true)
  }

  const openEditDialog = (survey) => {
    setEditingSurveyId(survey.id)
    setNewSurvey({
      title: survey.title || '',
      description: survey.description || '',
      questions: Array.isArray(survey.questions) ? survey.questions : []
    })
    setOpenEditor(true)
  }

  const handleSaveSurvey = () => {
    if (!newSurvey.title?.trim()) return

    const sanitizedQuestions = (newSurvey.questions || [])
      .map(q => ({
        ...q,
        text: q.text?.trim() || '',
        options: (q.options || []).map(opt => opt.trim()).filter(Boolean)
      }))
      .filter(q => q.text && q.options.length >= 2)

    if (editingSurveyId) {
      setSurveys(prev => prev.map(s => (
        s.id === editingSurveyId
          ? { ...s, title: newSurvey.title.trim(), description: newSurvey.description?.trim() || '', questions: sanitizedQuestions }
          : s
      )))
    } else {
      setSurveys(prev => [
        {
          id: Date.now(),
          title: newSurvey.title.trim(),
          description: newSurvey.description?.trim() || '',
          status: 'draft',
          createdAt: new Date().toISOString(),
          questions: sanitizedQuestions
        },
        ...prev
      ])
    }

    setOpenEditor(false)
    setNewSurvey(initialSurveyTemplate)
    setEditingSurveyId(null)
  }

  const handleDeleteSurvey = (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta encuesta?')) return
    setSurveys(prev => prev.filter(s => s.id !== id))
    setResponses(prev => prev.filter(r => Number(r.surveyId) !== Number(id)))
  }

  const addQuestion = () => {
    setNewSurvey(prev => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        { id: Date.now(), text: '', type: 'radio', options: ['Opción 1', 'Opción 2'] }
      ]
    }))
  }

  const removeQuestion = (questionId) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: (prev.questions || []).filter(q => q.id !== questionId)
    }))
  }

  const setSurveyStatus = (survey, status) => {
    setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, status } : s))
  }

  const openAnswerSurvey = (survey) => {
    setSelectedSurvey(survey)
    setAnswerDraft({})
    setOpenAnswerDialog(true)
  }

  const toggleCheckboxAnswer = (questionId, option) => {
    setAnswerDraft(prev => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : []
      const exists = current.includes(option)
      const next = exists ? current.filter(item => item !== option) : [...current, option]
      return { ...prev, [questionId]: next }
    })
  }

  const isAnswerValid = useMemo(() => {
    if (!selectedSurvey) return false
    const questions = selectedSurvey.questions || []
    if (!questions.length) return false
    return questions.every(q => {
      const value = answerDraft[q.id]
      if (q.type === 'checkbox') return Array.isArray(value) && value.length > 0
      return typeof value === 'string' && value.length > 0
    })
  }, [answerDraft, selectedSurvey])

  const submitSurveyResponse = () => {
    if (!selectedSurvey || !isAnswerValid) return

    setResponses(prev => [
      {
        id: Date.now(),
        surveyId: selectedSurvey.id,
        submittedAt: new Date().toISOString(),
        answers: answerDraft
      },
      ...prev
    ])

    setOpenAnswerDialog(false)
    setSelectedSurvey(null)
    setAnswerDraft({})
  }

  const openResults = (survey) => {
    setSelectedSurvey(survey)
    setOpenResultsDialog(true)
  }

  const getQuestionOptionCount = (surveyId, questionId, option) => {
    const surveyResponses = responses.filter(r => Number(r.surveyId) === Number(surveyId))
    return surveyResponses.reduce((acc, response) => {
      const answer = response.answers?.[questionId]
      if (Array.isArray(answer)) {
        return answer.includes(option) ? acc + 1 : acc
      }
      return answer === option ? acc + 1 : acc
    }, 0)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Encuestas
        </Typography>
        <Button variant="contained" startIcon={<MdAdd />} onClick={openCreateDialog} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Nueva Encuesta
        </Button>
      </Box>

      <Grid container spacing={2}>
        {surveys.map((survey) => {
          const surveyResponses = responsesBySurvey[Number(survey.id)] || 0
          const coverage = getCoverage(survey.id)
          const statusLabel = survey.status === 'active' ? 'Activa' : survey.status === 'closed' ? 'Cerrada' : 'Borrador'
          const statusColor = survey.status === 'active' ? 'success' : survey.status === 'closed' ? 'warning' : 'default'

          return (
            <Grid item xs={12} md={6} key={survey.id}>
              <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {survey.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {survey.description || 'Sin descripción'}
                      </Typography>
                    </Box>
                    <Chip label={statusLabel} color={statusColor} size="small" />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Respuestas: {surveyResponses} / {totalContacts || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {coverage}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={coverage} sx={{ borderRadius: 1, height: 8 }} />
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {(survey.questions || []).length} preguntas • Creada {new Date(survey.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<MdBarChart />} onClick={() => openResults(survey)}>
                      Resultados
                    </Button>

                    {survey.status === 'draft' && (
                      <Button size="small" onClick={() => setSurveyStatus(survey, 'active')}>
                        Activar
                      </Button>
                    )}

                    {survey.status === 'active' && (
                      <>
                        <Button size="small" onClick={() => openAnswerSurvey(survey)}>
                          Responder
                        </Button>
                        <Button size="small" onClick={() => setSurveyStatus(survey, 'closed')}>
                          Cerrar
                        </Button>
                      </>
                    )}
                  </Stack>

                  <Box>
                    <IconButton size="small" onClick={() => openEditDialog(survey)}>
                      <MdEdit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteSurvey(survey.id)}>
                      <MdDelete />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Dialog open={openEditor} onClose={() => setOpenEditor(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSurveyId ? 'Editar Encuesta' : 'Nueva Encuesta'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            value={newSurvey.title}
            onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={2}
            value={newSurvey.description}
            onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Preguntas
            </Typography>
            <Button size="small" startIcon={<MdAdd />} onClick={addQuestion}>
              Agregar Pregunta
            </Button>
          </Box>

          {(newSurvey.questions || []).map((question, index) => (
            <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Pregunta ${index + 1}`}
                  value={question.text}
                  onChange={(e) => {
                    const updated = [...(newSurvey.questions || [])]
                    updated[index].text = e.target.value
                    setNewSurvey({ ...newSurvey, questions: updated })
                  }}
                />

                <Select
                  size="small"
                  value={question.type || 'radio'}
                  onChange={(e) => {
                    const updated = [...(newSurvey.questions || [])]
                    updated[index].type = e.target.value
                    setNewSurvey({ ...newSurvey, questions: updated })
                  }}
                >
                  <MenuItem value="radio">Opción única</MenuItem>
                  <MenuItem value="checkbox">Selección múltiple</MenuItem>
                </Select>

                <TextField
                  fullWidth
                  size="small"
                  label="Opciones (separadas por coma)"
                  value={(question.options || []).join(', ')}
                  onChange={(e) => {
                    const updated = [...(newSurvey.questions || [])]
                    updated[index].options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                    setNewSurvey({ ...newSurvey, questions: updated })
                  }}
                />

                <Box>
                  <Button size="small" color="error" onClick={() => removeQuestion(question.id)}>
                    Eliminar pregunta
                  </Button>
                </Box>
              </Stack>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditor(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveSurvey} disabled={!newSurvey.title?.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAnswerDialog} onClose={() => setOpenAnswerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Responder Encuesta</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, mt: 1 }}>
            {selectedSurvey?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedSurvey?.description}
          </Typography>

          {(selectedSurvey?.questions || []).map((question) => (
            <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.2 }}>
                {question.text}
              </Typography>

              {question.type === 'checkbox' ? (
                <Stack>
                  {(question.options || []).map(option => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          checked={Array.isArray(answerDraft[question.id]) ? answerDraft[question.id].includes(option) : false}
                          onChange={() => toggleCheckboxAnswer(question.id, option)}
                        />
                      }
                      label={option}
                    />
                  ))}
                </Stack>
              ) : (
                <RadioGroup
                  value={answerDraft[question.id] || ''}
                  onChange={(e) => setAnswerDraft(prev => ({ ...prev, [question.id]: e.target.value }))}
                >
                  {(question.options || []).map(option => (
                    <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
                  ))}
                </RadioGroup>
              )}
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnswerDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitSurveyResponse} disabled={!isAnswerValid}>
            Enviar respuesta
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openResultsDialog} onClose={() => setOpenResultsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Resultados de Encuesta</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, mt: 1 }}>
            {selectedSurvey?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Respuestas registradas: {selectedSurvey ? (responsesBySurvey[Number(selectedSurvey.id)] || 0) : 0}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {(selectedSurvey?.questions || []).map(question => {
            const totalSurveyResponses = responsesBySurvey[Number(selectedSurvey?.id)] || 0

            return (
              <Paper key={question.id} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.2 }}>
                  {question.text}
                </Typography>

                <Stack spacing={1}>
                  {(question.options || []).map(option => {
                    const count = getQuestionOptionCount(selectedSurvey.id, question.id, option)
                    const pct = totalSurveyResponses ? Math.round((count / totalSurveyResponses) * 100) : 0

                    return (
                      <Box key={option}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{option}</Typography>
                          <Typography variant="body2" color="text.secondary">{count} ({pct}%)</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 1 }} />
                      </Box>
                    )
                  })}
                </Stack>
              </Paper>
            )
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResultsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
