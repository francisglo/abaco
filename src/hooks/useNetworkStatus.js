import { useState, useEffect } from 'react';

/**
 * Hook para monitorear el estado de la conexión de red
 * Mejora la disponibilidad al detectar desconexiones
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Notificar reconexión
        console.log('Conexión restaurada');
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.warn('Conexión perdida');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

/**
 * Hook para monitoreo de latencia del servidor
 */
export function useServerHealth(url = 'http://localhost:4000/users', interval = 30000) {
  const [health, setHealth] = useState({
    status: 'unknown',
    latency: null,
    lastCheck: null
  });

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
        const latency = Date.now() - start;
        
        setHealth({
          status: response.ok ? 'healthy' : 'degraded',
          latency,
          lastCheck: new Date().toISOString()
        });
      } catch (error) {
        setHealth({
          status: 'offline',
          latency: null,
          lastCheck: new Date().toISOString()
        });
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, interval);

    return () => clearInterval(intervalId);
  }, [url, interval]);

  return health;
}
