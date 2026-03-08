/**
 * Modelos y esquemas de datos
 * Documentación de estructuras utilizadas en la API
 */

/**
 * @typedef {Object} User
 * @property {number} id - ID único del usuario
 * @property {string} name - Nombre completo
 * @property {string} email - Email único
 * @property {string} password_hash - Hash de contraseña (bcryptjs)
 * @property {'admin'|'operator'|'auditor'|'viewer'} role - Rol del usuario
 * @property {string} phone - Teléfono de contacto
 * @property {number} zone_id - ID de la zona asignada
 * @property {boolean} active - Usuario activo/inactivo
 * @property {Date} created_at - Fecha de creación
 * @property {Date} updated_at - Fecha de actualización
 */
export const UserModel = {
  id: 'number',
  name: 'string',
  email: 'string',
  password_hash: 'string',
  role: 'enum[admin,operator,auditor,viewer]',
  phone: 'string',
  zone_id: 'number',
  active: 'boolean',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

/**
 * @typedef {Object} Voter
 * @property {number} id - ID único del votante
 * @property {string} name - Nombre del votante
 * @property {string} dni - DNI único (6-10 dígitos)
 * @property {string} phone - Teléfono de contacto
 * @property {string} email - Email de contacto
 * @property {string} address - Dirección
 * @property {number} zone_id - ID de la zona
 * @property {'pending'|'confirmed'|'contacted'|'interested'|'rejected'} status - Estado del votante
 * @property {'high'|'medium'|'low'} priority - Prioridad de contacto
 * @property {number} latitude - Latitud (geolocalización)
 * @property {number} longitude - Longitud (geolocalización)
 * @property {boolean} encrypted - ¿Datos encriptados?
 * @property {Date} created_at - Fecha de creación
 * @property {Date} updated_at - Fecha de actualización
 */
export const VoterModel = {
  id: 'number',
  name: 'string',
  dni: 'string',
  phone: 'string',
  email: 'string',
  address: 'string',
  zone_id: 'number',
  status: 'enum[pending,confirmed,contacted,interested,rejected]',
  priority: 'enum[high,medium,low]',
  latitude: 'decimal',
  longitude: 'decimal',
  encrypted: 'boolean',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

/**
 * @typedef {Object} Zone
 * @property {number} id - ID único de la zona
 * @property {string} name - Nombre de la zona
 * @property {number} priority - Prioridad (1-5)
 * @property {string} manager - Gerente responsable
 * @property {string} description - Descripción de la zona
 * @property {Date} created_at - Fecha de creación
 * @property {Date} updated_at - Fecha de actualización
 */
export const ZoneModel = {
  id: 'number',
  name: 'string',
  priority: 'number',
  manager: 'string',
  description: 'string',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

/**
 * @typedef {Object} Task
 * @property {number} id - ID único de la tarea
 * @property {string} title - Título de la tarea
 * @property {string} description - Descripción detallada
 * @property {number} assigned_to - ID del usuario asignado
 * @property {'pending'|'in_progress'|'completed'|'cancelled'} status - Estado de la tarea
 * @property {'high'|'medium'|'low'} priority - Prioridad
 * @property {Date} due_date - Fecha de vencimiento
 * @property {boolean} completed - ¿Completada?
 * @property {'outreach'|'verification'|'campaign'|'admin'} type - Tipo de tarea
 * @property {Date} created_at - Fecha de creación
 * @property {Date} updated_at - Fecha de actualización
 */
export const TaskModel = {
  id: 'number',
  title: 'string',
  description: 'string',
  assigned_to: 'number',
  status: 'enum[pending,in_progress,completed,cancelled]',
  priority: 'enum[high,medium,low]',
  due_date: 'date',
  completed: 'boolean',
  type: 'enum[outreach,verification,campaign,admin]',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

/**
 * @typedef {Object} AuditLog
 * @property {number} id - ID único del log
 * @property {number} user_id - ID del usuario que realizó la acción
 * @property {string} action - CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
 * @property {string} resource_type - Tipo de recurso (USER, VOTER, ZONE, TASK)
 * @property {number} resource_id - ID del recurso afectado
 * @property {Object} details - Detalles adicionales de la acción
 * @property {string} ip_address - IP desde donde se realizó la acción
 * @property {string} user_agent - User-Agent del navegador/cliente
 * @property {Date} created_at - Marca de tiempo
 */
export const AuditLogModel = {
  id: 'number',
  user_id: 'number',
  action: 'string',
  resource_type: 'string',
  resource_id: 'number',
  details: 'jsonb',
  ip_address: 'string',
  user_agent: 'string',
  created_at: 'timestamp'
};

/**
 * Response de autenticación
 */
export const AuthResponse = {
  message: 'string',
  user: 'User',
  token: 'string'
};

/**
 * Response paginado
 */
export const PaginatedResponse = {
  data: 'Array',
  pagination: {
    page: 'number',
    limit: 'number',
    total: 'number',
    pages: 'number'
  }
};

/**
 * Error Response
 */
export const ErrorResponse = {
  error: 'string',
  code: 'string',
  statusCode: 'number',
  message: 'string',
  timestamp: 'ISO8601'
};
