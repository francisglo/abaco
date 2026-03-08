import React from 'react';
import { Box, Alert, IconButton, Collapse } from '@mui/material';
import { MdClose, MdCloudOff, MdCloudDone } from 'react-icons/md';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Componente para mostrar el estado de la conexión
 * Mejora la disponibilidad al notificar problemas de red
 */
export default function NetworkStatusBar() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Alerta de sin conexión */}
      <Collapse in={!isOnline}>
        <Alert
          severity="error"
          icon={<MdCloudOff />}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            borderRadius: 0,
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: 'center'
            }
          }}
        >
          Sin conexión a Internet. Algunas funciones pueden no estar disponibles.
        </Alert>
      </Collapse>

      {/* Alerta de reconexión */}
      <Collapse in={showReconnected}>
        <Alert
          severity="success"
          icon={<MdCloudDone />}
          action={
            <IconButton
              size="small"
              onClick={() => setShowReconnected(false)}
            >
              <MdClose fontSize="small" />
            </IconButton>
          }
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            borderRadius: 0,
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: 'center'
            }
          }}
        >
          Conexión restaurada. Los datos se sincronizarán automáticamente.
        </Alert>
      </Collapse>
    </>
  );
}
