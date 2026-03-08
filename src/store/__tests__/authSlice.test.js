import { describe, it, expect } from 'vitest'
import authReducer, { login, logout, fetchUsers } from '../authSlice'

describe('authSlice', () => {
  it('handles fetchUsers.fulfilled', () => {
    const initial = { users: [], user: null, loading: false }
    const action = { type: fetchUsers.fulfilled.type, payload: [{ id: 1, name: 'Admin', role: 'admin' }] }
    const state = authReducer(initial, action)
    expect(state.users).toHaveLength(1)
    expect(state.loading).toBe(false)
  })

  it('handles login and logout', () => {
    const initial = { users: [{ id: 1, name: 'Admin', role: 'admin' }], user: null, loading: false }
    const logged = authReducer(initial, login(1))
    expect(logged.user).not.toBeNull()
    expect(logged.user.name).toBe('Admin')
    const out = authReducer(logged, logout())
    expect(out.user).toBeNull()
  })
})
