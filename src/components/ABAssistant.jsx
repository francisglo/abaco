import React, { useState, useEffect } from 'react';
import { Tooltip, Fab, Box, Modal, Typography, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';

// Textos de ayuda por ruta (puedes personalizar)
const helpTexts = {
  '/abaco-electoral/dashboard': `Este módulo muestra el análisis electoral por zona, KPIs clave, filtros avanzados y exportación de datos. Usa los filtros para segmentar la información y los botones de exportación para descargar reportes.`,
  '/abaco-gubernamental/dashboard': `Aquí puedes analizar datos territoriales públicos, visualizar KPIs, filtrar por zona y exportar información relevante.`,
  // ...agrega más rutas y textos según módulos
  'default': `Bienvenido a ÁBACO. Usa este asistente para obtener ayuda contextual sobre cualquier módulo o sección de la plataforma.`
};

export default function ABAssistant() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [helpText, setHelpText] = useState(helpTexts.default);

  useEffect(() => {
    setHelpText(helpTexts[location.pathname] || helpTexts.default);
  }, [location.pathname]);

  return (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2000 }}>
      <Tooltip title="¿Necesitas ayuda?">
        <Fab color="primary" size="medium" onClick={() => setOpen(true)} aria-label="ABA Ayuda">
          <InfoOutlinedIcon />
        </Fab>
      </Tooltip>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{ position: 'absolute', bottom: 100, right: 40, width: 340, bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flex: 1 }}>Asistente ABA</Typography>
            <IconButton size="small" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{helpText}</Typography>
        </Box>
      </Modal>
    </Box>
  );
}
