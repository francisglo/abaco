import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, users, loading, login, logout } = useAuth()

  if (loading) return <div>Loading users...</div>

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>Conectado como <strong>{user.name}</strong> ({user.role})</span>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select onChange={e => login(e.target.value)} defaultValue="">
        <option value="">Iniciar sesión como...</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
        ))}
      </select>
    </div>
  )
}
