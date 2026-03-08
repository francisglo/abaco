/**
 * Constantes de la aplicación
 */

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  AUDITOR: 'auditor',
  VIEWER: 'viewer'
};

// Estados de votante
export const VOTER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CONTACTED: 'contacted',
  INTERESTED: 'interested',
  REJECTED: 'rejected'
};

// Prioridades
export const PRIORITY_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Estados de tarea
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Tipos de tarea
export const TASK_TYPES = {
  OUTREACH: 'outreach',
  VERIFICATION: 'verification',
  CAMPAIGN: 'campaign',
  ADMIN: 'admin'
};

// Acciones de auditoría
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
};

// Códigos de error
export const ERROR_CODES = {
  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Autenticación
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  
  // Autorización
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Recursos
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VOTER_NOT_FOUND: 'VOTER_NOT_FOUND',
  ZONE_NOT_FOUND: 'ZONE_NOT_FOUND',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  
  // Conflictos
  CONFLICT: 'CONFLICT',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  DNI_EXISTS: 'DNI_EXISTS',
  ZONE_EXISTS: 'ZONE_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Restricciones
  ZONE_HAS_VOTERS: 'ZONE_HAS_VOTERS',
  CANNOT_DELETE: 'CANNOT_DELETE',
  NO_DATA: 'NO_DATA',
  
  // Servidor
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

// Límites de validación
export const VALIDATION_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 255,
  PHONE_MIN: 7,
  PHONE_MAX: 20,
  DNI_MIN: 6,
  DNI_MAX: 10,
  ADDRESS_MAX: 255,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 1000
};

// Paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_SORT: 'created_at',
  DEFAULT_ORDER: 'DESC'
};

// Tiempos
export const TIME_LIMITS = {
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
  TOKEN_EXPIRATION: '7d',
  LOCK_TIME: 15 * 60 * 1000, // 15 minutos
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutos
  RATE_LIMIT_MAX: 100 // máximo 100 requests por ventana
};

// Configuración de seguridad
export const SECURITY = {
  BCRYPT_ROUNDS: 10,
  JWT_SECRET_MIN_LENGTH: 32,
  PASSWORD_HASH_ALGORITHM: 'bcrypt'
};

// Códigos HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Mensajes por defecto
export const DEFAULT_MESSAGES = {
  CREATED: 'Recurso creado correctamente',
  UPDATED: 'Recurso actualizado correctamente',
  DELETED: 'Recurso eliminado correctamente',
  LOGIN_SUCCESS: 'Login exitoso',
  LOGOUT_SUCCESS: 'Logout exitoso',
  INTERNAL_ERROR: 'Error interno del servidor'
};

// Campos sensibles (nunca incluir en logs)
export const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'jwt',
  'secret',
  'apiKey',
  'authorization'
];

// Índices de base de datos
export const DB_INDEXES = [
  { table: 'users', column: 'email' },
  { table: 'users', column: 'role' },
  { table: 'voters', column: 'dni' },
  { table: 'voters', column: 'zone_id' },
  { table: 'voters', column: 'status' },
  { table: 'voters', column: 'priority' },
  { table: 'zones', column: 'priority' },
  { table: 'tasks', column: 'assigned_to' },
  { table: 'tasks', column: 'status' },
  { table: 'tasks', column: 'due_date' },
  { table: 'audit_logs', column: 'user_id' },
  { table: 'audit_logs', column: 'action' },
  { table: 'audit_logs', column: 'created_at' }
];
