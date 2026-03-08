import React from 'react'
import { Box, Button, Container, Paper, Typography, Alert } from '@mui/material'
import { MdError, MdRefresh, MdHome } from 'react-icons/md'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo)
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // Ejemplo: Sentry.captureException(error)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', py: 4 }}>
          <Container maxWidth="md">
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <MdError style={{ fontSize: 80, color: '#ef4444', marginBottom: 24 }} />
              
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#1a202c' }}>
                ¡Ups! Algo salió mal
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Se ha producido un error inesperado. No te preocupes, tu información está segura.
              </Typography>

              {this.state.errorCount > 3 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Se han detectado múltiples errores. Considera recargar la página o contactar al soporte.
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button variant="contained" startIcon={<MdRefresh />} onClick={this.handleReset}>
                  Intentar de nuevo
                </Button>
                <Button variant="outlined" startIcon={<MdHome />} onClick={this.handleGoHome}>
                  Ir al inicio
                </Button>
                <Button variant="text" onClick={this.handleReload}>
                  Recargar
                </Button>
              </Box>

              {isDevelopment && this.state.error && (
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'left', bgcolor: '#fef2f2', border: '1px solid #fecaca', mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#ef4444' }}>
                    Detalles del error (solo en desarrollo):
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12, color: '#7f1d1d', mb: 1 }}>
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 11, color: '#991b1b', maxHeight: 150, overflow: 'auto' }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Paper>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                Si el problema persiste, contacta al administrador del sistema
              </Typography>
            </Paper>
          </Container>
        </Box>
      )
    }

    return this.props.children
  }
}
