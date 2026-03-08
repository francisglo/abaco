/**
 * Utilidades comunes
 */

/**
 * Formatea una respuesta de paginación
 */
export function paginationResponse(data, page, limit, total) {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Construye una respuesta exitosa
 */
export function successResponse(message, data = null) {
  return {
    message,
    ...(data && { data })
  };
}

/**
 * Obtiene el offset para paginación
 */
export function getOffset(page, limit) {
  return (page - 1) * limit;
}

/**
 * Valida si un email es válido
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida si una DNI es válida (6-10 dígitos)
 */
export function isValidDNI(dni) {
  return /^\d{6,10}$/.test(dni);
}

/**
 * Valida si un teléfono es válido
 */
export function isValidPhone(phone) {
  return /^\d{7,15}$/.test(phone.replace(/\D/g, ''));
}

/**
 * Genera un hash simple para auditoría
 */
export function hashAuditData(data) {
  return JSON.stringify(data);
}

/**
 * Obtiene información del IP desde el request
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Trunca un string a un máximo de caracteres
 */
export function truncate(str, max = 50) {
  return str && str.length > max ? str.substring(0, max) + '...' : str;
}

/**
 * Pausa la ejecución por X milisegundos
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convierte un objeto a query string
 */
export function objectToQueryString(obj) {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

/**
 * Merge de objetos de forma segura
 */
export function safeMerge(target, source) {
  const result = { ...target };
  Object.keys(source).forEach(key => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  });
  return result;
}
