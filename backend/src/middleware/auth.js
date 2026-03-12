import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getJwtExpiresIn, getJwtSecret } from '../config/runtime.js';

dotenv.config();

const ROLE_ALIASES = {
  campaign_manager: 'manager',
  security_monitor: 'auditor',
  administrador: 'admin',
  administrador_del_sistema: 'admin',
  system_admin: 'admin',
  analista: 'auditor',
  analyst: 'auditor',
  consultor: 'auditor',
  consultant: 'auditor',
  cliente: 'viewer',
  cliente_institucional: 'viewer',
  institutional_client: 'viewer',
  publico: 'visitor',
  usuario_publico: 'visitor',
  public_user: 'visitor'
};

function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase();
  return ROLE_ALIASES[key] || key;
}

/**
 * Middleware de autenticación JWT
 * Verifica token en header Authorization
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = getJwtSecret();
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // Agregar usuario al request
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Error en autenticación',
      message: error.message
    });
  }
}

/**
 * Middleware de autorización por rol
 * @param {...string} allowedRoles - Roles permitidos
 * @returns {Function}
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const normalizedUserRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Generar token JWT
 * @param {object} payload - Datos a encriptar
 * @param {string} expiresIn - Tiempo de expiración
 * @returns {string} Token JWT
 */
export function generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN) {
  const jwtSecret = getJwtSecret();
  const normalizedExpiresIn = String(expiresIn || '').trim() || getJwtExpiresIn();
  return jwt.sign(payload, jwtSecret, { expiresIn: normalizedExpiresIn });
}

/**
 * Verificar token
 * @param {string} token - Token a verificar
 * @returns {object} Token decodificado
 */
export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}
