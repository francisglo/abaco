import React, { useEffect, useRef, useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext'
import { getGoogleClientId } from '../utils/env'
import abacoLogo from '../../TFG/TFG.png';
import { Alert, alpha, Avatar, Box, Button, Card, CardContent, CircularProgress, Divider, Fade, Grow, InputAdornment, Paper, Stack, Typography, Tabs, Tab, Slide, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { MdArrowUpward, MdArrowDownward, MdArrowBack, MdArrowForward, MdSpaceBar } from 'react-icons/md';
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
  const [showSplash, setShowSplash] = useState(true);
    // Splash effect: hide after 2.5s
    useEffect(() => {
      const timer = setTimeout(() => setShowSplash(false), 2500);
      return () => clearTimeout(timer);
    }, []);
  // 0: pantalla principal, 1: login, 2: registro, 3: KyD
  const [screen, setScreen] = useState(0);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    method: 'password',
    password: '',
    pin: '',
    pattern: '',
    patternMode: 'buttons', // 'buttons' o 'text'
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
    pattern: '',
    patternMode: 'buttons',
  });
    // Opciones de patrón
    const patternOptions = [
      { value: 'U', icon: <MdArrowUpward /> },
      { value: 'D', icon: <MdArrowDownward /> },
      { value: 'L', icon: <MdArrowBack /> },
      { value: 'R', icon: <MdArrowForward /> },
      { value: 'S', icon: <MdSpaceBar /> },
    ];

    const handlePatternButton = (formType, value) => {
      if (formType === 'login') {
        setLoginForm((prev) => ({ ...prev, pattern: prev.pattern + value }));
      } else {
        setRegisterForm((prev) => ({ ...prev, pattern: prev.pattern + value }));
      }
    };
    const handlePatternBackspace = (formType) => {
      if (formType === 'login') {
        setLoginForm((prev) => ({ ...prev, pattern: prev.pattern.slice(0, -1) }));
      } else {
        setRegisterForm((prev) => ({ ...prev, pattern: prev.pattern.slice(0, -1) }));
      }
    };
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
    <>
      {showSplash && (
        <Box
          sx={{
            position: 'fixed',
            zIndex: 2000,
            inset: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: '#0a0a0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.7s',
            animation: 'fadeSplash 2.5s cubic-bezier(0.4,0,0.2,1)',
            '@keyframes fadeSplash': {
              '0%': { opacity: 1 },
              '80%': { opacity: 1 },
              '100%': { opacity: 0 }
            }
          }}
        >
          <Box
            component="img"
            src={"/TFG/TFG.GIF"}
            alt="ÁBACO splash"
            sx={{
              width: { xs: 180, md: 260 },
              filter: 'drop-shadow(0 0 32px #00eaff88)',
              borderRadius: 3,
              animation: 'splashLogoPop 1.8s cubic-bezier(0.4,0,0.2,1)',
              '@keyframes splashLogoPop': {
                '0%': { opacity: 0, transform: 'scale(0.7)' },
                '40%': { opacity: 1, transform: 'scale(1.08)' },
                '70%': { opacity: 1, transform: 'scale(0.98)' },
                '100%': { opacity: 1, transform: 'scale(1)' }
              }
            }}
          />
        </Box>
      )}
      {!showSplash && (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0A0A0A',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ width: '100%', maxWidth: 400 }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src={"/TFG/TFG.GIF"}
                alt="ÁBACO"
                sx={{ width: 120, mx: 'auto', mb: 2, borderRadius: 2, boxShadow: '0 0 24px #00eaff33' }}
              />
              <Typography variant="h3" fontWeight={900} color="#fff" letterSpacing={2} sx={{ mb: 0.5, fontFamily: 'Montserrat, sans-serif' }}>
                ÁBACO
              </Typography>
              <Typography variant="subtitle1" color="#fff" sx={{ opacity: 0.7, fontWeight: 500, letterSpacing: 1, mb: 2 }}>
                Plataforma Electoral
              </Typography>
            </Box>
            <AnimatePresence mode="wait">
              {screen === 0 && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.5 }}
                >
                  <Stack spacing={2}>
                    <Button variant="contained" size="large" fullWidth sx={{ fontWeight: 800, fontSize: 18, py: 1.5, bgcolor: '#fff', color: '#0A0A0A', borderRadius: 2, boxShadow: '0 2px 16px #fff2', letterSpacing: 2, '&:hover': { bgcolor: '#eaeaea', color: '#000' } }} onClick={() => setScreen(1)}>
                      INICIAR SESIÓN
                    </Button>
                    <Button variant="outlined" size="large" fullWidth sx={{ fontWeight: 700, fontSize: 17, py: 1.5, borderColor: '#fff', color: '#fff', borderRadius: 2, letterSpacing: 2, '&:hover': { bgcolor: '#fff', color: '#000' } }} onClick={() => setScreen(2)}>
                      CREAR CUENTA
                    </Button>
                    <Divider sx={{ my: 1, borderColor: '#2A2A2A', color: '#fff', fontWeight: 600 }}>o</Divider>
                    <Button variant="outlined" size="large" fullWidth sx={{ fontWeight: 700, fontSize: 17, py: 1.5, borderColor: '#00eaff', color: '#00eaff', borderRadius: 2, letterSpacing: 2, '&:hover': { bgcolor: '#00eaff', color: '#000' } }} onClick={() => setScreen(3)}>
                      ACCEDER CON KYD
                    </Button>
                    <Typography variant="caption" color="#00eaff" sx={{ mt: 1, letterSpacing: 1, fontWeight: 600 }}>
                      Identidad digital segura
                    </Typography>
                  </Stack>
                </motion.div>
              )}
              {screen === 1 && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* ... Formulario de login clásico ... */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" color="#fff" fontWeight={700} sx={{ mb: 2 }}>Iniciar sesión</Typography>
                    {/* ...existing code for login form... */}
                  </Box>
                  {/* Aquí puedes insertar el formulario clásico de login */}
                  {/* ... */}
                  <Button fullWidth sx={{ mt: 2, color: '#fff', borderColor: '#fff' }} onClick={() => setScreen(0)}>
                    Volver
                  </Button>
                </motion.div>
              )}
              {screen === 2 && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.4 }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" color="#fff" fontWeight={700} sx={{ mb: 2 }}>Crear cuenta</Typography>
                    {/* ...existing code for registro clásico... */}
                  </Box>
                  {/* Aquí puedes insertar el formulario clásico de registro */}
                  {/* ... */}
                  <Button fullWidth sx={{ mt: 2, color: '#fff', borderColor: '#fff' }} onClick={() => setScreen(0)}>
                    Volver
                  </Button>
                </motion.div>
              )}
              {screen === 3 && (
                <motion.div
                  key="kyd"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.4 }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" color="#00eaff" fontWeight={800} sx={{ mb: 2 }}>Acceder con KyD</Typography>
                    {/* ...existing code for KyD login/registro... */}
                  </Box>
                  {/* Aquí puedes insertar el formulario KyD (PIN/patrón) */}
                  {/* ... */}
                  <Button fullWidth sx={{ mt: 2, color: '#00eaff', borderColor: '#00eaff' }} onClick={() => setScreen(0)}>
                    Volver
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Box>
      )}
              {/* Selector de método SINE */}
              <Box sx={{ my: 1 }}>
                <ToggleButtonGroup
                  value={tab === 0 ? loginForm.method : registerForm.method}
                  exclusive
                  onChange={(e, v) => {
                    if (!v) return;
                    if (tab === 0) setLoginForm((prev) => ({ ...prev, method: v, password: '', pin: '', pattern: '' }));
                    else setRegisterForm((prev) => ({ ...prev, method: v, password: '', pin: '', pattern: '' }));
                  }}
                  size="small"
                  color="primary"
                  sx={{ mb: 1 }}
                >
                  <ToggleButton value="password">Contraseña</ToggleButton>
                  <ToggleButton value="pin">PIN</ToggleButton>
                  <ToggleButton value="pattern">Patrón</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {tab === 0 && !showKID ? (
                <form onSubmit={onSubmitLogin}>
                  <Stack spacing={2}>
                    <TextField
                      label="Correo, usuario o teléfono"
                      value={loginForm.identifier}
                      onChange={onChangeLogin('identifier')}
                      fullWidth
                      autoFocus
                    />
                    {loginForm.method === 'password' && (
                      <TextField
                        label="Contraseña"
                        type="password"
                        value={loginForm.password}
                        onChange={onChangeLogin('password')}
                        fullWidth
                      />
                    )}
                    {loginForm.method === 'pin' && (
                      <TextField
                        label="PIN"
                        type="password"
                        value={loginForm.pin}
                        onChange={onChangeLogin('pin')}
                        fullWidth
                        inputProps={{ maxLength: 12 }}
                      />
                    )}
                    {loginForm.method === 'pattern' && (
                      <>
                        <ToggleButtonGroup
                          value={loginForm.patternMode}
                          exclusive
                          onChange={(e, v) => v && setLoginForm((prev) => ({ ...prev, patternMode: v, pattern: '' }))}
                          size="small"
                          sx={{ mb: 1 }}
                        >
                          <ToggleButton value="buttons">Botones</ToggleButton>
                          <ToggleButton value="text">Texto</ToggleButton>
                        </ToggleButtonGroup>
                        {loginForm.patternMode === 'buttons' ? (
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            {patternOptions.map(opt => (
                              <IconButton key={opt.value} onClick={() => handlePatternButton('login', opt.value)}>{opt.icon}</IconButton>
                            ))}
                            <Button size="small" onClick={() => handlePatternBackspace('login')}>Borrar</Button>
                          </Box>
                        ) : (
                          <TextField
                            label="Patrón (ej: UDLR)"
                            value={loginForm.pattern}
                            onChange={onChangeLogin('pattern')}
                            fullWidth
                          />
                        )}
                        <Box sx={{ fontSize: 18, fontWeight: 600, letterSpacing: 2, mb: 1 }}>
                          {loginForm.pattern.split('').map((c, i) => {
                            const opt = patternOptions.find(o => o.value === c);
                            return <span key={i}>{opt ? opt.icon : c}</span>;
                          })}
                        </Box>
                      </>
                    )}
                  </Stack>
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, fontWeight: 700 }} disabled={loading}>
                    Entrar
                  </Button>
                </form>
              ) : tab === 2 || showKID ? (
                <form onSubmit={onSubmitRegister}>
                  <Stack spacing={2}>
                    <TextField label="Usuario" value={registerForm.username} onChange={onChangeRegister('username')} fullWidth />
                    {/* Selector de método KID */}
                    <ToggleButtonGroup
                      value={registerForm.method}
                      exclusive
                      onChange={(e, v) => v && setRegisterForm((prev) => ({ ...prev, method: v, password: '', pin: '', pattern: '' }))}
                      size="small"
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      <ToggleButton value="pin">PIN</ToggleButton>
                      <ToggleButton value="pattern">Patrón</ToggleButton>
                    </ToggleButtonGroup>
                    {registerForm.method === 'pin' && (
                      <TextField label="PIN" type="password" value={registerForm.pin} onChange={onChangeRegister('pin')} fullWidth inputProps={{ maxLength: 12 }} />
                    )}
                    {registerForm.method === 'pattern' && (
                      <>
                        <ToggleButtonGroup
                          value={registerForm.patternMode}
                          exclusive
                          onChange={(e, v) => v && setRegisterForm((prev) => ({ ...prev, patternMode: v, pattern: '' }))}
                          size="small"
                          sx={{ mb: 1 }}
                        >
                          <ToggleButton value="buttons">Botones</ToggleButton>
                          <ToggleButton value="text">Texto</ToggleButton>
                        </ToggleButtonGroup>
                        {registerForm.patternMode === 'buttons' ? (
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            {patternOptions.map(opt => (
                              <IconButton key={opt.value} onClick={() => handlePatternButton('register', opt.value)}>{opt.icon}</IconButton>
                            ))}
                            <Button size="small" onClick={() => handlePatternBackspace('register')}>Borrar</Button>
                          </Box>
                        ) : (
                          <TextField
                            label="Patrón (ej: UDLR)"
                            value={registerForm.pattern}
                            onChange={onChangeRegister('pattern')}
                            fullWidth
                          />
                        )}
                        <Box sx={{ fontSize: 18, fontWeight: 600, letterSpacing: 2, mb: 1 }}>
                          {registerForm.pattern.split('').map((c, i) => {
                            const opt = patternOptions.find(o => o.value === c);
                            return <span key={i}>{opt ? opt.icon : c}</span>;
                          })}
                        </Box>
                      </>
                    )}
                  </Stack>
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, fontWeight: 700 }} disabled={loading}>
                    Crear cuenta con KID
                  </Button>
                  <Button fullWidth sx={{ mt: 1 }} onClick={() => setShowKID(false)}>
                    Volver al registro clásico
                  </Button>
                </form>
              ) : (
                <form onSubmit={onSubmitRegister}>
                  <Stack spacing={2}>
                    <TextField label="Nombre completo" value={registerForm.name} onChange={onChangeRegister('name')} fullWidth />
                    <TextField label="Usuario" value={registerForm.username} onChange={onChangeRegister('username')} fullWidth />
                    <TextField label="Correo electrónico" value={registerForm.email} onChange={onChangeRegister('email')} fullWidth />
                    <TextField label="Teléfono" value={registerForm.phone} onChange={onChangeRegister('phone')} fullWidth />
                    <TextField label="Biografía" value={registerForm.bio} onChange={onChangeRegister('bio')} fullWidth multiline minRows={2} />
                    {/* Selector de método clásico */}
                    <ToggleButtonGroup
                      value={registerForm.method}
                      exclusive
                      onChange={(e, v) => v && setRegisterForm((prev) => ({ ...prev, method: v, password: '', pin: '', pattern: '' }))}
                      size="small"
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      <ToggleButton value="password">Contraseña</ToggleButton>
                    </ToggleButtonGroup>
                    {registerForm.method === 'password' && (
                      <>
                        <TextField label="Contraseña" type="password" value={registerForm.password} onChange={onChangeRegister('password')} fullWidth />
                        <TextField label="Confirmar contraseña" type="password" value={registerForm.confirmPassword} onChange={onChangeRegister('confirmPassword')} fullWidth />
                      </>
                    )}
                  </Stack>
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, fontWeight: 700 }} disabled={loading}>
                    Crear cuenta
                  </Button>
                </form>
              )}
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
