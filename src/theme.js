import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d8ff', // Azul cian neón
      light: '#5efcff',
      dark: '#0081a7'
    },
    secondary: {
      main: '#a259ff', // Violeta neón
      light: '#c299fc',
      dark: '#6d2aff'
    },
    success: {
      main: '#00ffb0' // Verde neón
    },
    warning: {
      main: '#ffe156' // Amarillo neón
    },
    error: {
      main: '#ff3864' // Rojo neón
    },
    info: {
      main: '#00b4d8' // Azul info
    },
    background: {
      default: '#0a0a0a', // Negro puro
      paper: '#181a20' // Gris oscuro para cards
    },
    text: {
      primary: '#f4faff', // Blanco azulado
      secondary: '#b2b8c6' // Gris claro
    },
    divider: 'rgba(0,255,255,0.08)'
  },
  typography: {
    fontFamily: '"Orbitron", "Montserrat", "Segoe UI", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.7rem',
      letterSpacing: '0.01em',
      textTransform: 'uppercase',
      color: '#00d8ff',
      textShadow: '0 0 16px #00d8ff44'
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.1rem',
      letterSpacing: '0.01em',
      color: '#5efcff',
      textShadow: '0 0 8px #00d8ff33'
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem',
      color: '#a259ff'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#f4faff'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem',
      color: '#f4faff'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#f4faff'
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      letterSpacing: '0.3px',
      color: '#f4faff'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#b2b8c6'
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      fontSize: '1rem',
      letterSpacing: '0.08em',
      color: '#00d8ff'
    }
  },
  shape: {
    borderRadius: 14
  },
  shadows: [
    'none',
    '0 1px 3px 0 #00d8ff22',
    '0 4px 6px -1px #00d8ff22',
    '0 10px 15px -3px #a259ff22',
    '0 20px 25px -5px #a259ff22',
    '0 25px 50px -12px #00d8ff22',
    ...Array(20).fill('0 25px 50px -12px #00d8ff22')
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#0a0a0a',
          color: '#f4faff',
          fontFamily: '"Orbitron", "Montserrat", "Segoe UI", "Roboto", "Arial", sans-serif',
          letterSpacing: '0.02em',
        },
        '::selection': {
          background: '#00d8ff44',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: '0 0 16px #00d8ff33',
          background: 'linear-gradient(90deg, #00d8ff 0%, #a259ff 100%)',
          color: '#fff',
          transition: 'background 0.3s, box-shadow 0.3s',
        },
        contained: {
          background: 'linear-gradient(90deg, #00d8ff 0%, #a259ff 100%)',
          color: '#fff',
          boxShadow: '0 0 24px #00d8ff44',
        },
        outlined: {
          borderColor: '#00d8ff',
          color: '#00d8ff',
          '&:hover': {
            background: '#181a20',
            borderColor: '#a259ff',
            color: '#a259ff',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1.5px solid #181a20',
          background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)',
          boxShadow: '0 4px 32px #00d8ff22',
          color: '#f4faff',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10,10,10,0.98)',
          borderBottom: '1.5px solid #181a20',
          boxShadow: '0 2px 24px 0 #00d8ff22',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)',
          borderRight: '1.5px solid #181a20',
          color: '#f4faff',
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: '#23263a',
          color: '#00d8ff',
          fontWeight: 600,
          fontSize: '0.95em',
          border: '1px solid #00d8ff44',
        }
      }
    }
  }
})

export default theme
