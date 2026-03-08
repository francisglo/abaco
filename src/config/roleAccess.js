export const ROLE_ALIASES = {
  campaign_manager: 'manager',
  jefe_campana: 'manager',
  jefe_de_campana: 'manager',
  security_monitor: 'auditor',
  monitor_seguridad: 'auditor',
  guest: 'visitor'
}

export const ALL_ROLES = ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']

export function normalizeRole(rawRole) {
  const role = String(rawRole || '').trim().toLowerCase()
  if (!role) return 'visitor'
  if (ALL_ROLES.includes(role)) return role
  return ROLE_ALIASES[role] || 'visitor'
}

export function getDefaultPathByRole(rawRole) {
  const role = normalizeRole(rawRole)
  if (role === 'admin') return '/dashboard'
  if (role === 'manager') return '/dashboard'
  if (role === 'auditor') return '/audit'
  if (role === 'operator') return '/tasks'
  if (role === 'viewer') return '/query-analytics'
  return '/portales'
}

export function canAccessByRole(rawRole, allowedRoles = []) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true
  const role = normalizeRole(rawRole)
  return allowedRoles.includes(role)
}
