import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para caché de datos con TTL (Time To Live)
 * Mejora el rendimiento al evitar peticiones redundantes
 */
export function useCache(key, ttl = 300000) { // TTL por defecto: 5 minutos
  const [cache, setCache] = useState(() => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error al leer caché:', error);
    }
    return null;
  });

  const saveToCache = useCallback((data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      setCache(data);
    } catch (error) {
      console.warn('Error al guardar en caché:', error);
    }
  }, [key]);

  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setCache(null);
    } catch (error) {
      console.warn('Error al limpiar caché:', error);
    }
  }, [key]);

  return { cache, saveToCache, clearCache };
}

/**
 * Hook para peticiones con caché automático
 */
export function useCachedFetch(url, options = {}) {
  const { ttl = 300000, enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cache, saveToCache } = useCache(url, ttl);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    
    if (cache && !force) {
      setData(cache);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      saveToCache(result);
      setData(result);
    } catch (err) {
      setError(err.message);
      // Si falla, intentar usar caché antiguo
      if (cache) {
        setData(cache);
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled, cache, saveToCache]);

  useEffect(() => {
    fetchData();
  }, [url, enabled]);

  return { data, loading, error, refetch: () => fetchData(true) };
}

/**
 * Hook para gestión de caché global
 */
export function useCacheManager() {
  const clearAllCache = useCallback(() => {
    try {
      // Solo limpiar claves relacionadas con datos de la app
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('http://localhost:4000')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Error al limpiar caché global:', error);
      return false;
    }
  }, []);

  const getCacheSize = useCallback(() => {
    try {
      let size = 0;
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          size += sessionStorage[key].length + key.length;
        }
      }
      return (size / 1024).toFixed(2); // KB
    } catch (error) {
      return 0;
    }
  }, []);

  return { clearAllCache, getCacheSize };
}
