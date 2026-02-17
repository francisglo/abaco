import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchUsers, login, logout } from '../store/authSlice'

export default function Login() {
  const dispatch = useDispatch()
  const { users, user, loading } = useSelector(state => state.auth)

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  if (loading) return <div>Loading users...</div>

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>Conectado como <strong>{user.name}</strong> ({user.role})</span>
        <button onClick={() => dispatch(logout())}>Cerrar sesión</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select onChange={e => dispatch(login(e.target.value))} defaultValue="">
        <option value="">Iniciar sesión como...</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
        ))}
      </select>
    </div>
  )
}
