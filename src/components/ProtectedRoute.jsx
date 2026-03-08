import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccessByRole, getDefaultPathByRole } from '../config/roleAccess'

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to={getDefaultPathByRole(user.role)} replace />
  }

  if (!canAccessByRole(user.role, allowedRoles)) {
    return <Navigate to={getDefaultPathByRole(user.role)} replace />
  }

  return children
}
