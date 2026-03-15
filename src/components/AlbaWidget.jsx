import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Fab, Modal, Typography, IconButton, TextField, Button, Avatar, Stack, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

const ALBA_AVATAR = 'https://huggingface.co/front/thumbnails/transformers.png'; // Puedes cambiar por un avatar propio

export default function AlbaWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'alba', text: '¡Hola! Soy Alba, tu asistente en ÁBACO. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const inputRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // Onboarding: mostrar solo la primera vez que se abre Alba
    useEffect(() => {
      if (open && !localStorage.getItem('alba_onboarding_done')) {
        setShowOnboarding(true);
        localStorage.setItem('alba_onboarding_done', '1');
      }
    }, [open]);

    // Acciones rápidas: sugeridas según hora, rol y contexto
    const getQuickActions = () => {
      const actions = [];
      const hour = new Date().getHours();
      const isMorning = hour < 12;
      const isAfternoon = hour >= 12 && hour < 18;
      const isEvening = hour >= 18;
      const role = user?.role || 'usuario';
      const path = location.pathname;

      // Sugerencias por hora
      if (isMorning) actions.push({ label: 'Planifica tu día', command: '¿Qué tareas tengo para hoy?' });
      if (isAfternoon) actions.push({ label: 'Revisa tu progreso', command: '¿Qué tareas me faltan por terminar?' });
      if (isEvening) actions.push({ label: 'Resumen del día', command: '¿Qué logré hoy y qué tengo pendiente?' });

      // Sugerencias por rol
      if (role === 'admin' || role === 'coordinador') {
        actions.push({ label: 'Ver propuestas globales', command: 'Muéstrame las propuestas de todos los usuarios' });
      }
      if (role === 'estudiante') {
        actions.push({ label: 'Mis grupos', command: '¿A qué grupos pertenezco?' });
      }

      // Sugerencias por ruta/contexto
      if (path.includes('coworking')) {
        actions.push({ label: 'Ver grupos activos', command: '¿Cuáles son los grupos activos en coworking?' });
      }
      if (path.includes('dashboard')) {
        actions.push({ label: 'KPIs principales', command: '¿Cuáles son los KPIs más importantes hoy?' });
      }

      // Acciones generales
      actions.push({ label: 'Ayuda', command: '¿Qué puedes hacer por mí?' });
      return actions;
    };

    const quickActions = getQuickActions();

    const handleQuickAction = (command) => {
      setInput(command);
      sendMessage(command);
    };
  // Acceso a contexto global
  const user = useSelector(state => state.auth.user);
  const proposals = useSelector(state => state.studentProposals.proposals);
  const tasks = useSelector(state => state.tasks?.tasks || []);
  const notifications = useSelector(state => state.notifications?.notifications || []);
  const groups = useSelector(state => state.groups?.groups || []);
  const location = useLocation();

  const sendMessage = async (customInput) => {
    const msgText = typeof customInput === 'string' ? customInput : input;
    // Lógica para enviar el mensaje a la IA y actualizar el estado
    // Ejemplo:
    // setMessages([...messages, { sender: 'user', text: msgText }]);
    // setLoading(true);
    // ... llamada a API, etc.
    // setLoading(false);
  } // <- cierre correcto de la función

  // Return principal del componente AlbaWidget
  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 8 : 24,
        right: isMobile ? 8 : 24,
        zIndex: 9999
      }}
      aria-live="polite"
      aria-label="Asistente Alba"
    >
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ borderRadius: '50%', width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, background: '#1976d2', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: isMobile ? 22 : 28, cursor: 'pointer' }}
          title="Abrir Alba"
          aria-label="Abrir chat de Alba"
        >
          <span role="img" aria-label="robot">🤖</span>
        </button>
      )}
      {/* Ventana de chat */}
      {open && (
        <div
          style={{
            width: isMobile ? '98vw' : 340,
            height: isMobile ? '60vh' : 480,
            background: '#fff',
            borderRadius: isMobile ? 8 : 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxWidth: 420
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Chat con Alba"
        >
          {/* Header */}
          <div style={{ background: '#1976d2', color: '#fff', padding: isMobile ? '10px 10px' : '12px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Alba</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: isMobile ? 18 : 20, cursor: 'pointer' }} title="Cerrar" aria-label="Cerrar chat">×</button>
          </div>
          {/* Onboarding */}
          {showOnboarding && (
            <div style={{ padding: isMobile ? 10 : 16, background: '#e3f0fc', color: '#1976d2', fontWeight: 500, borderBottom: '1px solid #b3d3f6' }}>
              <div>👋 ¡Bienvenido a Alba!<br />
                Soy tu asistente IA. Puedo ayudarte a consultar tareas, notificaciones, propuestas, y más.<br />
                Prueba las acciones rápidas o pregúntame lo que quieras.
              </div>
              <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer' }}>¡Entendido!</button>
            </div>
          )}
          {/* Acciones rápidas */}
          {!showOnboarding && (
            <div style={{ padding: isMobile ? '6px 10px' : '8px 16px', borderBottom: '1px solid #e0e0e0', background: '#f7fafd', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {quickActions.map(action => (
                <button key={action.label} onClick={() => handleQuickAction(action.command)} style={{ background: '#e3f0fc', color: '#1976d2', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: isMobile ? 12 : 13, cursor: 'pointer' }}>{action.label}</button>
              ))}
            </div>
          )}
          {/* Mensajes */}
          <div ref={inputRef} style={{ flex: 1, padding: isMobile ? 10 : 16, overflowY: 'auto', background: '#f7fafd' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: msg.sender === 'alba' ? 'left' : 'right' }}>
                <div style={{ display: 'inline-block', background: msg.sender === 'alba' ? '#e3f0fc' : '#d1ffd6', color: '#222', borderRadius: 12, padding: '8px 14px', maxWidth: 220 }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ marginBottom: 12, textAlign: 'left' }}>
                <div style={{ display: 'inline-block', background: '#e3f0fc', color: '#222', borderRadius: 12, padding: '8px 14px', maxWidth: 220 }}>
                  ...
                </div>
              </div>
            )}
          </div>
          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); /* handleSend(); */ }}
            style={{ display: 'flex', borderTop: '1px solid #e0e0e0', background: '#f7fafd' }}
            aria-label="Enviar mensaje a Alba"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              style={{ flex: 1, border: 'none', outline: 'none', padding: isMobile ? 10 : 12, fontSize: isMobile ? 14 : 15, background: 'transparent' }}
              disabled={loading}
              aria-label="Mensaje para Alba"
            />
            <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 0, padding: isMobile ? '0 10px' : '0 18px', fontSize: isMobile ? 14 : 16, cursor: 'pointer' }} disabled={loading || !input.trim()} aria-label="Enviar mensaje">
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
