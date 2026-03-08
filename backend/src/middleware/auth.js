import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ROLE_ALIASES = {
  campaign_manager: 'manager',
  visitor: 'viewer',
  security_monitor: 'auditor'
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
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Verificar token
 * @param {string} token - Token a verificar
 * @returns {object} Token decodificado
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
