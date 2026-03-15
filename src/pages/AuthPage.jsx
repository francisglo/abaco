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
    // Estados principales
    const [tab, setTab] = useState(0); // 0: login, 1: registro
    const [showKID, setShowKID] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginForm, setLoginForm] = useState({
      identifier: '',
      password: '',
      method: 'password',
      pin: '',
      pattern: ''
    });
    const [registerForm, setRegisterForm] = useState({
      name: '',
      username: '',
      email: '',
      phone: '',
      bio: '',
      password: '',
      confirmPassword: '',
      pin: '',
      pattern: '',
      method: 'password'
    });

    // Handlers para los formularios
    const onChangeLogin = (field) => (e) => {
      setLoginForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
    const onChangeRegister = (field) => (e) => {
      setRegisterForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    // Handler de envío de login real
    const { login } = useContext(AuthContext);
    const [loginError, setLoginError] = useState('');
    const onSubmitLogin = async (e) => {
      e.preventDefault();
      setLoading(true);
      setLoginError('');
      try {
        await login({
          identifier: loginForm.identifier,
          password: loginForm.password
        });
      } catch (err) {
        setLoginError(err?.message || 'Error de autenticación');
      } finally {
        setLoading(false);
      }
    };
    // Registro real conectado
    const { register } = useContext(AuthContext);
    const [registerError, setRegisterError] = useState('');
    const onSubmitRegister = async (e) => {
      e.preventDefault();
      setLoading(true);
      setRegisterError('');
      try {
        await register({
          name: registerForm.name,
          username: registerForm.username,
          email: registerForm.email,
          phone: registerForm.phone,
          bio: registerForm.bio,
          password: registerForm.password,
          pin: registerForm.pin,
          pattern: registerForm.pattern
        });
      } catch (err) {
        setRegisterError(err?.message || 'Error de registro');
      } finally {
        setLoading(false);
      }
    };
  const { loginWithGoogle } = useContext(AuthContext)
  const [animatedLogoError, setAnimatedLogoError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [showSplash, setShowSplash] = useState(true);
  // Splash effect: hide after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ my: 1 }}>
      {/* Selector de método SINE */}
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
      {tab === 0 && !showKID ? (
        <form onSubmit={onSubmitLogin}>
          <Stack spacing={2}>
            <TextField
              label="Correo, usuario o teléfono"
              value={loginForm.identifier}
              onChange={onChangeLogin('identifier')}
              fullWidth
              autoFocus
              disabled={loading}
            />
            {loginForm.method === 'password' && (
              <TextField
                label="Contraseña"
                type="password"
                value={loginForm.password}
                onChange={onChangeLogin('password')}
                fullWidth
                disabled={loading}
              />
            )}
            {loginError && (
              <Alert severity="error">{loginError}</Alert>
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
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
            </Button>
          </Stack>
        </form>
      ) : (
        <form onSubmit={onSubmitRegister}>
          <Stack spacing={2}>
            {registerError && (
              <Alert severity="error">{registerError}</Alert>
            )}
            <TextField label="Nombre completo" value={registerForm.name} onChange={onChangeRegister('name')} fullWidth />
            <TextField label="Usuario" value={registerForm.username} onChange={onChangeRegister('username')} fullWidth />
            <TextField label="Correo electrónico" value={registerForm.email} onChange={onChangeRegister('email')} fullWidth />
            <TextField label="Teléfono" value={registerForm.phone} onChange={onChangeRegister('phone')} fullWidth />
            <TextField label="Biografía" value={registerForm.bio} onChange={onChangeRegister('bio')} fullWidth multiline minRows={2} />
            {registerForm.method === 'password' && (
              <>
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
              </>
            )}
            {registerForm.method === 'pin' && (
              <TextField
                label="PIN (opcional)"
                type="password"
                value={registerForm.pin}
                onChange={onChangeRegister('pin')}
                fullWidth
                inputProps={{ maxLength: 12, inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText="PIN numérico para acceso rápido (mínimo 4 dígitos, evita secuencias simples como 1234)"
              />
            )}
            {registerForm.method === 'pattern' && (
              <TextField
                label="Patrón o secuencia (opcional)"
                type="password"
                value={registerForm.pattern}
                onChange={onChangeRegister('pattern')}
                fullWidth
                helperText="Secuencia de caracteres como backup (mínimo 4 caracteres, evita patrones triviales como abcd o 1111)"
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
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Registrar'}
            </Button>
          </Stack>
        </form>
      )}
    </Box>
  );
}
