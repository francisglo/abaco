import { AppError } from '../middleware/errorHandler.js';

const DEV_FALLBACK_SECRET = 'abaco-dev-insecure-secret-change-me-2026';

function isProduction() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

export function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim();

  if (secret.length >= 32) {
    return secret;
  }

  if (!isProduction()) {
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET no definido. Se usará secreto temporal de desarrollo.');
    } else {
      console.warn('⚠️ JWT_SECRET demasiado corto. Se usará secreto temporal de desarrollo.');
    }
    return DEV_FALLBACK_SECRET;
  }

  throw new AppError(
    'Configuración incompleta: JWT_SECRET debe existir y tener al menos 32 caracteres',
    503,
    'CONFIGURATION_ERROR'
  );
}

export function getJwtExpiresIn() {
  return String(process.env.JWT_EXPIRES_IN || '7d').trim() || '7d';
}
