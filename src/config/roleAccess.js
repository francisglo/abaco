export const ROLE_ALIASES = {
  campaign_manager: 'manager',
  jefe_campana: 'manager',
  jefe_de_campana: 'manager',
  security_monitor: 'auditor',
  monitor_seguridad: 'auditor',
  guest: 'visitor',
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
}

export const ALL_ROLES = ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']

export const ROLE_LABELS = {
  admin: 'Administrador del sistema',
  manager: 'Coordinador estratégico',
  operator: 'Operador territorial',
  auditor: 'Analista',
  viewer: 'Cliente institucional',
  visitor: 'Usuario público'
}

export const ROLE_CAPABILITIES = {
  admin: ['manage_users', 'upload_datasets', 'configure_indicators', 'create_models', 'analyze_territory', 'download_reports', 'view_dashboards'],
  manager: ['upload_datasets', 'configure_indicators', 'create_models', 'analyze_territory', 'download_reports', 'view_dashboards'],
  operator: ['analyze_territory', 'view_dashboards'],
  auditor: ['analyze_territory', 'download_reports', 'view_dashboards'],
  viewer: ['view_dashboards', 'download_reports'],
  visitor: ['view_dashboards']
}

export const VIEW_MODES = {
  edit: 'Modo edición',
  analysis: 'Modo análisis',
  visualization: 'Modo visualización'
}

export function getViewModeByPath(pathname = '') {
  const path = String(pathname || '')
  if (path.startsWith('/settings') || path.startsWith('/users') || path.startsWith('/data-management')) return 'edit'
  if (
    path.startsWith('/query-analytics')
    || path.startsWith('/management-indicators')
    || path.startsWith('/strategic-intelligence')
    || path.startsWith('/financial-intelligence')
    || path.startsWith('/operational-algorithms')
    || path.startsWith('/abaco-bi-integrador')
  ) return 'analysis'
  return 'visualization'
}

export function getRoleLabel(rawRole) {
  const role = normalizeRole(rawRole)
  return ROLE_LABELS[role] || ROLE_LABELS.visitor
}

export function canByCapability(rawRole, capability) {
  const role = normalizeRole(rawRole)
  const capabilities = ROLE_CAPABILITIES[role] || []
  return capabilities.includes(capability)
}

export function getModuleActionsByRole(rawRole, moduleSlug = '', context = {}) {
  const role = normalizeRole(rawRole)
  const territory = String(context.territory || 'Nacional')
  const project = String(context.project || 'General')
  const baseActions = {
    admin: ['Editar datasets', 'Subir datos', 'Configurar indicadores', 'Crear modelos', 'Administrar usuarios'],
    manager: ['Configurar indicadores', 'Crear modelos', 'Comparar territorios', 'Crear reportes'],
    operator: ['Explorar mapas', 'Consultar indicadores', 'Ejecutar seguimiento territorial'],
    auditor: ['Explorar mapas', 'Analizar indicadores', 'Crear reportes', 'Comparar territorios'],
    viewer: ['Ver dashboards', 'Consultar mapas', 'Descargar reportes', 'Filtrar territorios'],
    visitor: ['Datos generales', 'Visualización simple']
  }

  const actions = baseActions[role] || baseActions.visitor
  const contextual = []
  if (territory !== 'Nacional') {
    contextual.push(`Aplicar enfoque territorial en ${territory}`)
  }
  if (project !== 'General') {
    contextual.push(`Priorizar análisis para proyecto: ${project}`)
  }

  if (moduleSlug === 'seguridad-gobernanza-territorial' && role === 'auditor') {
    return ['Analizar riesgos territoriales', 'Comparar tendencias', ...actions.filter((item) => item !== 'Explorar mapas')]
  }

  if (moduleSlug === 'inteligencia-demografica-social') {
    const demographicActions = {
      admin: ['Configurar variables demográficas', 'Diseñar políticas focalizadas', 'Integrar datos interinstitucionales'],
      manager: ['Priorizar territorios vulnerables', 'Comparar escenarios poblacionales', 'Planificar demanda de servicios'],
      operator: ['Consultar distribución poblacional', 'Monitorear crecimiento territorial', 'Identificar alertas sociales'],
      auditor: ['Auditar brechas sociodemográficas', 'Validar proyecciones de demanda', 'Crear reportes comparativos'],
      viewer: ['Visualizar indicadores demográficos', 'Descargar fichas territoriales', 'Seguir tendencias sociales'],
      visitor: ['Ver panorama demográfico general']
    }

    return [...(demographicActions[role] || demographicActions.visitor), ...contextual]
  }

  return [...actions, ...contextual]
}

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
