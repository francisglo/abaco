import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Acceso requerido</h3>
        <p>Debe iniciar sesión para ver esta sección.</p>
      </div>
    )
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div style={{ padding: 16 }}>
        <h3>Acceso denegado</h3>
        <p>Necesitas permisos de administrador para ver esta sección.</p>
      </div>
    )
  }

  return children
}
