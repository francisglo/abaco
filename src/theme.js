import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a365d',     // Azul marino oscuro
      light: '#2d5a8c',
      dark: '#0f1f3a'
    },
    secondary: {
      main: '#00a86b',     // Verde esmeralda profesional
      light: '#1abc9c',
      dark: '#008959'
    },
    success: {
      main: '#10b981'      // Verde profesional
    },
    warning: {
      main: '#f59e0b'      // Naranja corporativo
    },
    error: {
      main: '#ef4444'      // Rojo corporativo
    },
    info: {
      main: '#0ea5e9'      // Azul cielo
    },
    background: {
      default: '#f8f9fa',  // Gris muy suave
      paper: '#ffffff'
    },
    text: {
      primary: '#1a365d',   // Azul marino para texto
      secondary: '#4b5563'  // Gris profesional
    },
    divider: 'rgba(0, 0, 0, 0.06)'
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em'
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em'
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem'
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      letterSpacing: '0.3px'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
      letterSpacing: '0.5px'
    }
  },
  shape: {
    borderRadius: 8
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
    ...Array(20).fill('0 25px 50px -12px rgba(0, 0, 0, 0.08)')
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)'
          }
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.04)'
        }
      }
    }
  }
})

export default theme
