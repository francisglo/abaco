/**
 * ÁBACO - Sistema de Gamificación y Leaderboard
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material'
import {
  MdEmojiEvents,
  MdStar,
  MdTrendingUp,
  MdLocalFireDepartment,
  MdWorkspacePremium
} from 'react-icons/md'

export default function LeaderboardPage() {
    useEffect(() => {
      document.body.classList.add('fade-page');
      return () => document.body.classList.remove('fade-page');
    }, []);
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    // Datos simulados
    const mockLeaderboard = [
      {
        id: 1,
        name: 'Juan Pérez',
        points: 2850,
        level: 12,
        contactsRegistered: 145,
        surveysCompleted: 23,
        territoriesCovered: 8,
        streak: 15,
        badges: ['top_performer', 'data_champion', 'pioneer']
      },
      {
        id: 2,
        name: 'Ana López',
        points: 2620,
        level: 11,
        contactsRegistered: 132,
        surveysCompleted: 19,
        territoriesCovered: 7,
        streak: 12,
        badges: ['consistent', 'team_player']
      },
      {
        id: 3,
        name: 'Carlos Ruiz',
        points: 2480,
        level: 10,
        contactsRegistered: 118,
        surveysCompleted: 21,
        territoriesCovered: 6,
        streak: 10,
        badges: ['rising_star', 'dedicated']
      },
      {
        id: 4,
        name: 'María García',
        points: 2310,
        level: 10,
        contactsRegistered: 105,
        surveysCompleted: 18,
        territoriesCovered: 5,
        streak: 8,
        badges: ['efficient']
      },
      {
        id: 5,
        name: 'Luis Fernández',
        points: 2180,
        level: 9,
        contactsRegistered: 98,
        surveysCompleted: 16,
        territoriesCovered: 5,
        streak: 7,
        badges: ['consistent']
      }
    ]

    const mockAchievements = [
      {
        id: 1,
        name: 'Primer Contacto',
        description: 'Registraste tu primer contacto',
        icon: '🎯',
        unlocked: true,
        unlockedAt: new Date(Date.now() - 86400000 * 30)
      },
      {
        id: 2,
        name: 'Century Club',
        description: 'Registraste 100 contactos',
        icon: '💯',
        unlocked: true,
        unlockedAt: new Date(Date.now() - 86400000 * 15)
      },
      {
        id: 3,
        name: 'Racha de Fuego',
        description: 'Mantén una racha de 30 días',
        icon: '🔥',
        unlocked: false,
        progress: 50
      },
      {
        id: 4,
        name: 'Explorador',
        description: 'Cubre 10 territorios diferentes',
        icon: '🗺️',
        unlocked: false,
        progress: 80
      }
    ]

    setLeaderboard(mockLeaderboard)
    setCurrentUser(mockLeaderboard[0])
    setAchievements(mockAchievements)
  }, [])

  const getRankIcon = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getBadgeColor = (badge) => {
    const colors = {
      top_performer: '#ffd700',
      data_champion: '#1976d2',
      pioneer: '#9c27b0',
      consistent: '#4caf50',
      team_player: '#ff9800',
      rising_star: '#e91e63',
      dedicated: '#00bcd4',
      efficient: '#8bc34a'
    }
    return colors[badge] || '#757575'
  }

  const getBadgeLabel = (badge) => {
    const labels = {
      top_performer: 'Top Performer',
      data_champion: 'Campeón de Datos',
      pioneer: 'Pionero',
      consistent: 'Consistente',
      team_player: 'Jugador de Equipo',
      rising_star: 'Estrella en Ascenso',
      dedicated: 'Dedicado',
      efficient: 'Eficiente'
    }
    return labels[badge] || badge
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Leaderboard y Gamificación
      </Typography>

      <Grid container spacing={3}>
        {/* Perfil del Usuario Actual */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)', mb: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '2rem'
                }}
              >
                {currentUser?.name?.charAt(0)}
              </Avatar>
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                {currentUser?.name}
              </Typography>
              <Chip
                label={`Nivel ${currentUser?.level}`}
                color="primary"
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Puntos
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {currentUser?.points?.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(currentUser?.points % 500) / 5}
                sx={{ borderRadius: 1, height: 8 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {500 - (currentUser?.points % 500)} puntos para el siguiente nivel
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<MdLocalFireDepartment />}
                label={`${currentUser?.streak} días`}
                size="small"
                sx={{ bgcolor: '#ff5722', color: 'white' }}
              />
              <Chip
                icon={<MdStar />}
                label={`${currentUser?.badges?.length || 0} badges`}
                size="small"
                color="primary"
              />
            </Box>
          </Paper>

          {/* Logros */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Logros
            </Typography>
            <Grid container spacing={2}>
              {achievements.map((achievement) => (
                <Grid item xs={6} key={achievement.id}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      opacity: achievement.unlocked ? 1 : 0.5,
                      bgcolor: achievement.unlocked ? 'rgba(102, 126, 234, 0.05)' : 'transparent'
                    }}
                  >
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {achievement.icon}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      {achievement.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {achievement.description}
                    </Typography>
                    {!achievement.unlocked && achievement.progress && (
                      <LinearProgress
                        variant="determinate"
                        value={achievement.progress}
                        sx={{ mt: 1, borderRadius: 1, height: 4 }}
                      />
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Leaderboard */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Top Performers
            </Typography>
            <List>
              {leaderboard.map((user, index) => (
                <ListItem
                  key={user.id}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    bgcolor: index < 3 ? 'rgba(102, 126, 234, 0.05)' : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Box sx={{ textAlign: 'center', mr: 1 }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>
                        {getRankIcon(index)}
                      </Typography>
                      <Avatar
                        sx={{
                          bgcolor: getBadgeColor(user.badges[0]),
                          width: 40,
                          height: 40
                        }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {user.name}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                          {user.points.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          {user.badges.map((badge) => (
                            <Chip
                              key={badge}
                              label={getBadgeLabel(badge)}
                              size="small"
                              sx={{
                                bgcolor: getBadgeColor(badge),
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            📍 {user.contactsRegistered} contactos
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            📊 {user.surveysCompleted} encuestas
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            🗺️ {user.territoriesCovered} territorios
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
