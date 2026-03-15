import React, { useState, useEffect } from 'react';
import { Tooltip, Fab, Box, Modal, Typography, IconButton, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Textos de ayuda por ruta (puedes personalizar)
const helpTexts = {
  '/abaco-electoral/dashboard': `Este módulo muestra el análisis electoral por zona, KPIs clave, filtros avanzados y exportación de datos. Usa los filtros para segmentar la información y los botones de exportación para descargar reportes.`,
  '/abaco-gubernamental/dashboard': `Aquí puedes analizar datos territoriales públicos, visualizar KPIs, filtrar por zona y exportar información relevante.`,
  // ...agrega más rutas y textos según módulos
  'default': `Bienvenido a ÁBACO. Usa este asistente para obtener ayuda contextual sobre cualquier módulo o sección de la plataforma.`
};

export default function ABAssistant() {
  const [open, setOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();
  const [helpText, setHelpText] = useState(helpTexts.default);

  useEffect(() => {
    setHelpText(helpTexts[location.pathname] || helpTexts.default);
    if (!localStorage.getItem('aba_onboarding_done')) {
      setShowOnboarding(true);
      localStorage.setItem('aba_onboarding_done', '1');
    }
  }, [location.pathname]);

  const handleOpenDocs = () => {
    window.open('https://docs.abaco.com/ayuda', '_blank');
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2000 }}>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{ display: 'inline-block' }}
            key="fab"
          >
            <Tooltip title="¿Necesitas ayuda?">
              <Fab
                color="primary"
                size="medium"
                onClick={() => setOpen(true)}
                aria-label="ABA Ayuda"
                sx={{
                  boxShadow: '0 0 24px #00d8ff88',
                  transition: 'box-shadow 0.3s',
                  '&:hover': {
                    boxShadow: '0 0 48px #00d8ffcc, 0 0 8px #a259ff99',
                  }
                }}
              >
                <InfoOutlinedIcon />
              </Fab>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{ position: 'absolute', bottom: 100, right: 40, width: 360, zIndex: 2100 }}>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.7, y: 40, filter: 'blur(8px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                style={{ background: 'none' }}
                key="modal"
              >
                <Box sx={{
                  width: 360,
                  bgcolor: 'background.paper',
                  boxShadow: '0 0 48px #00d8ff55, 0 0 8px #a259ff99',
                  borderRadius: 3,
                  p: 3,
                  border: '2px solid #00d8ff44',
                  background: 'linear-gradient(120deg, #181a20 60%, #23263a 100%)',
                  color: 'text.primary',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ flex: 1, letterSpacing: '0.04em', fontWeight: 700 }}>Asistente ABA</Typography>
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'primary.main' }}><CloseIcon /></IconButton>
                  </Box>
                  {showOnboarding && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Box sx={{ bgcolor: '#0a0a0a', color: 'primary.main', borderRadius: 2, mb: 2, p: 2, boxShadow: '0 0 16px #00d8ff44' }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>👋 ¡Bienvenido a ÁBACO!</Typography>
                        <Typography variant="body2">Aquí puedes consultar ayuda contextual y acceder a la documentación interactiva.<br />Haz clic en "Ver documentación" para explorar tutoriales y guías.</Typography>
                        <Button onClick={() => setShowOnboarding(false)} variant="contained" sx={{ mt: 2 }}>¡Entendido!</Button>
                      </Box>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>{helpText}</Typography>
                    <Button variant="outlined" onClick={handleOpenDocs} fullWidth sx={{ borderColor: '#00d8ff', color: '#00d8ff', '&:hover': { borderColor: '#a259ff', color: '#a259ff', background: '#181a20' } }}>Ver documentación</Button>
                  </motion.div>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Modal>
    </Box>
  );
}
