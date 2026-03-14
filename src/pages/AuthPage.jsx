import React, { useEffect, useRef, useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { getGoogleClientId } from '../utils/env'
import abacoLogo from '../../TFG/TFG.png';
import { Alert, alpha, Avatar, Box, Button, Card, CardContent, CircularProgress, Divider, Fade, Grow, InputAdornment, Paper, Stack, Typography, Tabs, Tab, Slide, TextField } from '@mui/material';
import { MdLockOutline, MdOutlineMail, MdPersonAddAlt1 } from 'react-icons/md';

// Utilidades fuera del componente
const isTrivialSequence = (str) => {
  const trivial = ['1234', '1111', '0000', 'abcd', 'qwer', 'asdf', '4321', '2222', '9999']
  return trivial.includes((str || '').toLowerCase())
}

const isStrongPassword = (str) => {
  // Al menos 6 caracteres, mayúscula, minúscula, número y símbolo
  return /[A-Z]/.test(str) && /[a-z]/.test(str) && /[0-9]/.test(str) && /[^A-Za-z0-9]/.test(str) && (str || '').length >= 6
}

export default function AuthPage() {
  const { loginWithGoogle } = useContext(AuthContext)
  const [animatedLogoError, setAnimatedLogoError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    method: 'password',
    password: '',
    pin: '',
    pattern: ''
  });
  const [loading, setLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    pin: '',
    pattern: ''
  });
  const googleButtonRef = useRef(null);
  // ...existing code...
  const onChangeLogin = (field) => (event) => {
    setLoginForm((prev) => ({ ...prev, [field]: event.target.value }))
  }
  const onChangeLoginMethod = (event, value) => {
    setLoginForm((prev) => ({ ...prev, method: value, password: '', pin: '', pattern: '' }))
  }

  const onChangeRegister = (field) => (event) => {
    setRegisterForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const onSubmitLogin = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const payload = { identifier: loginForm.identifier.trim() }
      if (loginForm.method === 'password') payload.password = loginForm.password
      if (loginForm.method === 'pin') payload.pin = loginForm.pin
      if (loginForm.method === 'pattern') payload.pattern = loginForm.pattern
      await login(payload)
    } catch (submitError) {
      setError(submitError.message || 'No se pudo iniciar sesión')
    }
  }

  const onSubmitRegister = async (event) => {
    event.preventDefault()
    setError('')

    if (registerForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validación de PIN: numérico, mínimo 4, no secuencial ni repetido
    if (registerForm.pin) {
      if (!/^[0-9]{4,12}$/.test(registerForm.pin)) {
        setError('El PIN debe ser numérico y tener entre 4 y 12 dígitos')
        return
      }
      const sequential = /^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321)$/;
      const repeated = /^([0-9])\1+$/;
      if (sequential.test(registerForm.pin) || repeated.test(registerForm.pin)) {
        setError('El PIN no puede ser una secuencia simple ni dígitos repetidos')
        return
      }
    }
    // Validación de patrón: mínimo 4, no trivial
    if (registerForm.pattern) {
      if (registerForm.pattern.length < 4) {
        setError('El patrón debe tener al menos 4 caracteres')
        return
      }
      const trivialPatterns = ['abcd', 'dcba', 'qwer', 'asdf', 'zxcv', '1234', '4321', '1111', '0000'];
      if (trivialPatterns.includes(registerForm.pattern.toLowerCase())) {
        setError('El patrón es demasiado simple, elige otro')
        return
      }
    }
    // Validación de contraseña fuerte
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(registerForm.password)) {
      setError('La contraseña debe tener mayúsculas, minúsculas, número y símbolo')
      return
    }

    try {
      await register({
        name: registerForm.name.trim(),
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        phone: registerForm.phone.trim(),
        bio: registerForm.bio.trim(),
        pin: registerForm.pin,
        pattern: registerForm.pattern
      })
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear la cuenta')
    }
  }


  useEffect(() => {
    const clientId = getGoogleClientId()
    if (!clientId || !googleButtonRef.current) return

    const ensureScript = () => new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }

      const existing = document.querySelector('script[data-google-identity="true"]')
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity')), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity'))
      document.head.appendChild(script)
    })

    ensureScript()
      .then(() => {
        if (!window.google?.accounts?.id || !googleButtonRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              if (!response?.credential) throw new Error('Google no devolvió credential')
              await loginWithGoogle(response.credential)
            } catch (googleError) {
              setError(googleError.message || 'No se pudo iniciar sesión con Google')
            }
          }
        })

        googleButtonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          width: 320
        })
      })
      .catch((scriptError) => {
        setError(scriptError.message || 'No se pudo inicializar Google Sign-In')
      })
  }, [loginWithGoogle])

  return (
    <Box
      sx={{
        '@keyframes floatPulse': {
          '0%': { transform: 'translateY(0px) scale(1)', opacity: 0.65 },
          '50%': { transform: 'translateY(-12px) scale(1.04)', opacity: 0.92 },
          '100%': { transform: 'translateY(0px) scale(1)', opacity: 0.65 }
        },
        '@keyframes drift': {
          '0%': { transform: 'translateX(0px) translateY(0px)' },
          '50%': { transform: 'translateX(10px) translateY(-8px)' },
          '100%': { transform: 'translateX(0px) translateY(0px)' }
        },
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: { xs: 2, md: 3 },
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        background: (theme) => `
          radial-gradient(circle at 12% 18%, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 34%),
          radial-gradient(circle at 88% 82%, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 36%),
          linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${alpha(theme.palette.background.default, 1)} 45%, ${alpha(theme.palette.secondary.dark, 0.08)} 100%)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-80px',
          left: '-60px',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: (theme) => alpha(theme.palette.primary.main, 0.18),
          filter: 'blur(10px)',
          animation: 'floatPulse 7s ease-in-out infinite'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          right: '-70px',
          bottom: '-70px',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: (theme) => alpha(theme.palette.secondary.main, 0.14),
          filter: 'blur(14px)',
          animation: 'drift 8s ease-in-out infinite'
        }
      }}
    >
      <Grow in timeout={560}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 920,
            borderRadius: 3,
            overflow: 'hidden',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            boxShadow: (theme) => `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
            position: 'relative',
            zIndex: 2,
            transition: 'transform 280ms ease, box-shadow 280ms ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.primary.main, 0.26)}`
            }
          }}
        >
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Paper
            square
            elevation={0}
            sx={{
              width: { xs: '100%', md: '42%' },
              p: { xs: 3, md: 4 },
              color: 'primary.contrastText',
              background: (theme) => `linear-gradient(155deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 52%, ${theme.palette.secondary.main} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 18,
                right: 18,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: (theme) => alpha(theme.palette.common.white, 0.08),
                filter: 'blur(1px)',
                animation: 'floatPulse 6s ease-in-out infinite'
              }
            }}
          >
            <Stack spacing={2.5}>
              <Box
                sx={{ width: { xs: 148, md: 180 }, maxWidth: '100%' }}
              >
                {!animatedLogoError ? (
                  <Box
                    component="img"
                    src={"/TFG/TFG.GIF"}
                    alt="ÁBACO dinámico"
                    onError={() => setAnimatedLogoError(true)}
                    sx={{
                      width: '100%',
                      borderRadius: 2,
                      border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.35)}`,
                      bgcolor: (theme) => alpha(theme.palette.common.white, 0.1),
                      p: 0.6
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      borderRadius: 2,
                      border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.35)}`,
                      bgcolor: (theme) => alpha(theme.palette.common.white, 0.12),
                      p: 1.2,
                      textAlign: 'center',
                      fontWeight: 800,
                      letterSpacing: 1.2
                    }}
                  >
                    ÁBACO
                  </Box>
                )}
              </Box>
              <Avatar
                src={logoError ? undefined : abacoLogo}
                imgProps={{ onError: () => setLogoError(true) }}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: (theme) => alpha(theme.palette.common.white, 0.2),
                  border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.35)}`,
                  animation: 'drift 4.2s ease-in-out infinite'
                }}
              >
                <MdLockOutline size={28} />
              </Avatar>
              <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
                Bienvenido a ÁBACO
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Accede de forma segura para gestionar campañas, equipos y datos territoriales.
              </Typography>
              <Divider sx={{ borderColor: (theme) => alpha(theme.palette.common.white, 0.28) }} />
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Si aún no tienes cuenta, puedes crearla en segundos desde esta misma pantalla.
              </Typography>
            </Stack>
          </Paper>

          <CardContent sx={{ flex: 1, p: { xs: 2.5, md: 4 } }}>
            <Stack spacing={2.25}>
              <Typography variant="h5" fontWeight={700}>
                {tab === 0 ? 'Iniciar sesión' : 'Crear cuenta'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tab === 0
                  ? 'Ingresa tus credenciales para continuar.'
                  : 'Completa tus datos para crear un nuevo usuario.'}
              </Typography>

              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                variant="fullWidth"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 2,
                  minHeight: 42,
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '& .MuiTabs-indicator': {
                    height: '100%',
                    borderRadius: 1.5,
                    background: (theme) => `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    zIndex: 0
                  },
                  '& .MuiTab-root': {
                    minHeight: 42,
                    zIndex: 1,
                    fontWeight: 600,
                    color: 'text.secondary'
                  },
                  '& .MuiTab-root.Mui-selected': {
                    color: 'primary.contrastText'
                  }
                }}
              >
                <Tab label="Iniciar sesión" />
                <Tab label="Crear cuenta" />
              </Tabs>

              {error && <Alert severity="error">{error}</Alert>}

              <Fade in timeout={260} key={tab}>
                <Box>
                  {tab === 0 ? (
                    <Slide in direction="left" timeout={260} appear={false}>
                      <Box component="form" onSubmit={onSubmitLogin}>
                        <Stack spacing={2}>
                          <TextField
                            label="Usuario o correo"
                            value={loginForm.identifier}
                            onChange={onChangeLogin('identifier')}
                            required
                            fullWidth
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdOutlineMail />
                                </InputAdornment>
                              )
                            }}
                          />
                          <Tabs
                            value={loginForm.method}
                            onChange={onChangeLoginMethod}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                            sx={{ mb: 1 }}
                          >
                            <Tab value="password" label="Contraseña" />
                            <Tab value="pin" label="PIN" />
                            <Tab value="pattern" label="Patrón" />
                          </Tabs>
                          {loginForm.method === 'password' && (
                            <TextField
                              label="Contraseña"
                              type="password"
                              value={loginForm.password}
                              onChange={onChangeLogin('password')}
                              required
                              fullWidth
                              helperText="Introduce tu contraseña."
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <MdLockOutline />
                                  </InputAdornment>
                                )
                              }}
                            />
                          )}
                          {loginForm.method === 'pin' && (
                            <TextField
                              label="PIN"
                              type="password"
                              value={loginForm.pin}
                              onChange={onChangeLogin('pin')}
                              required
                              fullWidth
                              inputProps={{ maxLength: 12, inputMode: 'numeric', pattern: '[0-9]*' }}
                              helperText="PIN numérico definido al registrarte."
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <MdLockOutline />
                                  </InputAdornment>
                                )
                              }}
                            />
                          )}
                          {loginForm.method === 'pattern' && (
                            <TextField
                              label="Patrón o secuencia"
                              type="password"
                              value={loginForm.pattern}
                              onChange={onChangeLogin('pattern')}
                              required
                              fullWidth
                              helperText="Patrón o secuencia definida al registrarte."
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <MdLockOutline />
                                  </InputAdornment>
                                )
                              }}
                            />
                          )}
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                              mt: 0.5,
                              background: (theme) => `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              boxShadow: (theme) => `0 10px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                              transition: 'transform 200ms ease, box-shadow 200ms ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: (theme) => `0 14px 28px ${alpha(theme.palette.primary.main, 0.35)}`
                              }
                            }}
                          >
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
                          </Button>
                          <Divider>o</Divider>
                          <Box ref={googleButtonRef} sx={{ display: 'flex', justifyContent: 'center' }} />
                        </Stack>
                      </Box>
                    </Slide>
                  ) : (
                    <Slide in direction="right" timeout={260} appear={false}>
                      <Box component="form" onSubmit={onSubmitRegister}>
                        <Stack spacing={2}>
                          <TextField
                            label="Nombre"
                            value={registerForm.name}
                            onChange={onChangeRegister('name')}
                            required
                            fullWidth
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdPersonAddAlt1 />
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField
                            label="Usuario"
                            value={registerForm.username}
                            onChange={onChangeRegister('username')}
                            required
                            fullWidth
                          />
                          <TextField
                            label="Correo"
                            type="email"
                            value={registerForm.email}
                            onChange={onChangeRegister('email')}
                            fullWidth
                            helperText="Opcional: si lo dejas vacío, se crea cuenta sin email"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdOutlineMail />
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField
                            label="Teléfono"
                            value={registerForm.phone}
                            onChange={onChangeRegister('phone')}
                            fullWidth
                          />
                          <TextField
                            label="Perfil / Bio"
                            value={registerForm.bio}
                            onChange={onChangeRegister('bio')}
                            multiline
                            minRows={2}
                            fullWidth
                          />
                          <TextField
                            label="Contraseña"
                            type="password"
                            value={registerForm.password}
                            onChange={onChangeRegister('password')}
                            required
                            fullWidth
                            helperText="Mínimo 6 caracteres, usa mayúsculas, minúsculas, número y símbolo."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdLockOutline />
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField
                            label="Confirmar contraseña"
                            type="password"
                            value={registerForm.confirmPassword}
                            onChange={onChangeRegister('confirmPassword')}
                            required
                            fullWidth
                            helperText="Repite la contraseña para confirmar."
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MdLockOutline />
                                </InputAdornment>
                              )
                            }}
                          />
                          <TextField
                            label="PIN (opcional)"
                            type="password"
                            value={registerForm.pin}
                            onChange={onChangeRegister('pin')}
                            fullWidth
                            inputProps={{ maxLength: 12, inputMode: 'numeric', pattern: '[0-9]*' }}
                            helperText="PIN numérico para acceso rápido (mínimo 4 dígitos, evita secuencias simples como 1234)"
                          />
                          <TextField
                            label="Patrón o secuencia (opcional)"
                            type="password"
                            value={registerForm.pattern}
                            onChange={onChangeRegister('pattern')}
                            fullWidth
                            helperText="Secuencia de caracteres como backup (mínimo 4 caracteres, evita patrones triviales como abcd o 1111)"
                          />
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                              mt: 0.5,
                              background: (theme) => `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              boxShadow: (theme) => `0 10px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                              transition: 'transform 200ms ease, box-shadow 200ms ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: (theme) => `0 14px 28px ${alpha(theme.palette.primary.main, 0.35)}`
                              }
                            }}
                          >
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Registrar'}
                          </Button>
                        </Stack>
                      </Box>
                    </Slide>
                  )}
                </Box>
              </Fade>
            </Stack>
          </CardContent>
        </Stack>
        </Card>
      </Grow>
    </Box>
  )
}
