import React, { useState, useEffect } from 'react';
import { Box, Modal, Typography, Button, Stepper, Step, StepLabel, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const steps = [
  {
    label: 'Bienvenido a ÁBACO',
    description: 'Esta plataforma integra inteligencia electoral, territorial y financiera en un solo lugar. Te guiaremos por los módulos principales.'
  },
  {
    label: 'Navegación Modular',
    description: 'Utiliza el menú lateral para acceder a los dashboards y módulos clave. Cada sección tiene KPIs, filtros y visualizaciones interactivas.'
  },
  {
    label: 'Filtros y Segmentación',
    description: 'Filtra la información por zona, participación, riesgo y más. Los filtros avanzados te permiten segmentar los datos de forma precisa.'
  },
  {
    label: 'Exportación y Reportes',
    description: 'Descarga los datos y reportes en PDF, Excel o CSV usando los botones de exportación en cada dashboard.'
  },
  {
    label: 'Asistente ABA',
    description: '¿Dudas? Haz clic en el botón flotante ABA para obtener ayuda contextual sobre cualquier módulo o sección.'
  }
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const seenTour = localStorage.getItem('abaco_onboarding_tour');
    if (!seenTour) setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('abaco_onboarding_tour', '1');
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(s => s + 1);
    else handleClose();
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep(s => s - 1);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 420, bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>{steps[activeStep].label}</Typography>
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </Box>
        <Typography variant="body1" sx={{ mb: 3 }}>{steps[activeStep].description}</Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
          {steps.map((step, idx) => (
            <Step key={step.label} completed={activeStep > idx}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack} disabled={activeStep === 0}>Atrás</Button>
          <Button variant="contained" onClick={handleNext}>{activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
        </Box>
      </Box>
    </Modal>
  );
}
