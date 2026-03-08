import crypto from 'crypto';

function computeSeverityScore(error, req) {
  const status = Number(error?.statusCode || error?.status || 500);
  const dbWeight = error?.code ? 20 : 0;
  const validationWeight = error?.isJoi ? 10 : 0;
  const authWeight = status === 401 || status === 403 ? 18 : 0;
  const statusWeight = Math.min(Math.max((status / 5), 0), 70);
  const endpointWeight = req?.path?.startsWith('/api/v1/geo') ? 8 : 0;
  return Math.min(Math.round(statusWeight + dbWeight + validationWeight + authWeight + endpointWeight), 100);
}

function buildErrorId(error, req) {
  const seed = [
    req?.method || 'UNKNOWN',
    req?.path || 'UNKNOWN_PATH',
    error?.code || 'NO_CODE',
    String(error?.message || 'NO_MESSAGE').slice(0, 120)
  ].join('|');

  return crypto.createHash('sha1').update(seed).digest('hex').slice(0, 12);
}

/**
 * Middleware de manejo de errores
 * Captura y formatea errores de manera consistente
 */
export function errorHandler(error, req, res, next) {
  const errorId = buildErrorId(error, req);
  const severityScore = computeSeverityScore(error, req);

  console.error('❌ Error capturado:', {
    errorId,
    severityScore,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Error de validación Joi
  if (error.isJoi) {
    return res.status(400).json({
      error: 'Validación fallida',
      code: 'VALIDATION_ERROR',
      errorId,
      severityScore,
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }))
    });
  }

  // Error de base de datos
  if (error.code) {
    const code = String(error.code).toUpperCase();
    const dbUnavailableCodes = new Set([
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ECONNRESET',
      '57P01',
      '57P02',
      '57P03',
      '53300'
    ]);

    if (dbUnavailableCodes.has(code)) {
      return res.status(503).json({
        error: 'Base de datos no disponible temporalmente',
        code: 'DB_UNAVAILABLE',
        errorId,
        severityScore
      });
    }

    if (code === '42P01') {
      return res.status(500).json({
        error: process.env.NODE_ENV === 'production'
          ? 'Estructura de base de datos incompleta'
          : (error.message || 'Relación no encontrada en base de datos'),
        code: 'DB_SCHEMA_MISSING',
        errorId,
        severityScore
      });
    }

    return res.status(400).json({
      error: 'Error en base de datos',
      code,
      errorId,
      severityScore,
      message: error.detail || error.message
    });
  }

  // Error personalizado
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      errorId,
      severityScore
    });
  }

  // Error genérico
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    code: 'INTERNAL_ERROR',
    errorId,
    severityScore,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

/**
 * Crear error personalizado
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper para controladores async
 * Captura errores automáticamente
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
