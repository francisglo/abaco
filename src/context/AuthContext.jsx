export { AuthContext }
import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  loginAuth,
  registerAuth,
  googleAuthLogin,
  fetchAuthMe,
  updateAuthMe,
  deleteAuthMe
} from '../api'

const AuthContext = createContext()
const TOKEN_KEY = 'abaco_auth_token'
const LOCAL_USERS_KEY = 'abaco_local_users'
const LOCAL_TOKEN_PREFIX = 'local:'
const AUTH_ALLOW_LOCAL_FALLBACK = String(process.env.VITE_AUTH_ALLOW_LOCAL_FALLBACK || '').toLowerCase() === 'true'

function isNetworkAuthError(error) {
  const msg = String(error?.message || '').toLowerCase()
  return (
    msg.includes('no se pudo conectar') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('failed to login: 5') ||
    msg.includes('failed to register: 5') ||
    msg.includes('error interno') ||
    msg.includes('internal_error')
  )
}

function readLocalUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function createLocalSession(user) {
  return `${LOCAL_TOKEN_PREFIX}${user.id}`
}

function findLocalUserByToken(token) {
  if (!token?.startsWith(LOCAL_TOKEN_PREFIX)) return null
  const id = Number(token.replace(LOCAL_TOKEN_PREFIX, ''))
  if (!Number.isFinite(id)) return null
  return readLocalUsers().find((item) => Number(item.id) === id) || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (!savedToken) {
      setAuthReady(true)
      return
    }

    setLoading(true)
    fetchAuthMe(savedToken)
      .then((response) => {
        setToken(savedToken)
        setUser(response?.user || null)
      })
      .catch((error) => {
        // Si el backend responde 401, forzar logout inmediato
        if (String(error?.message || '').toLowerCase().includes('401') || String(error?.message || '').toLowerCase().includes('token')) {
          localStorage.removeItem(TOKEN_KEY)
          setToken('')
          setUser(null)
          setAuthReady(true)
          setLoading(false)
          return
        }
        if (AUTH_ALLOW_LOCAL_FALLBACK && isNetworkAuthError(error)) {
          const localUser = findLocalUserByToken(savedToken)
          if (localUser) {
            setToken(savedToken)
            setUser(localUser)
            return
          }
        }
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
        setAuthReady(true)
      })
  }, [])

  async function login(credentials) {
    setLoading(true)
    try {
      try {
        const response = await loginAuth(credentials)
        const nextToken = response?.token || ''
        const nextUser = response?.user || null

        setToken(nextToken)
        setUser(nextUser)
        if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
        return nextUser
      } catch (error) {
        if (!AUTH_ALLOW_LOCAL_FALLBACK || !isNetworkAuthError(error)) throw error

        const users = readLocalUsers()
        const normalizedIdentifier = String(credentials.identifier || credentials.email || credentials.username || '').trim().toLowerCase()
        const matched = users.find((item) => {
          const emailMatch = item.email?.toLowerCase() === normalizedIdentifier
          const usernameMatch = item.username?.toLowerCase() === normalizedIdentifier
          return (emailMatch || usernameMatch) && item.password === credentials.password
        })

        if (!matched) throw new Error('No se encontró una cuenta local con esas credenciales')

        const safeUser = { ...matched }
        delete safeUser.password

        const nextToken = createLocalSession(safeUser)
        setToken(nextToken)
        setUser(safeUser)
        localStorage.setItem(TOKEN_KEY, nextToken)
        return safeUser
      }
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
  }

  async function register(payload) {
    setLoading(true)
    try {
      try {
        const response = await registerAuth(payload)
        const nextToken = response?.token || ''
        const nextUser = response?.user || null

        setToken(nextToken)
        setUser(nextUser)
        if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
        return nextUser
      } catch (error) {
        if (!AUTH_ALLOW_LOCAL_FALLBACK || !isNetworkAuthError(error)) throw error

        const users = readLocalUsers()
        const normalizedEmail = payload.email?.trim().toLowerCase() || ''
        const normalizedUsername = payload.username?.trim().toLowerCase() || ''
        const exists = users.some((item) => (
          (normalizedEmail && item.email?.toLowerCase() === normalizedEmail)
          || (normalizedUsername && item.username?.toLowerCase() === normalizedUsername)
        ))
        if (exists) throw new Error('Ya existe una cuenta local con ese usuario/correo')

        const newLocalUser = {
          id: Date.now(),
          name: payload.name?.trim() || 'Usuario',
          email: normalizedEmail,
          username: normalizedUsername,
          phone: payload.phone?.trim() || '',
          bio: payload.bio?.trim() || '',
          role: 'operator',
          active: true,
          password: payload.password
        }

        saveLocalUsers([...users, newLocalUser])

        const safeUser = { ...newLocalUser }
        delete safeUser.password

        const nextToken = createLocalSession(safeUser)
        setToken(nextToken)
        setUser(safeUser)
        localStorage.setItem(TOKEN_KEY, nextToken)
        return safeUser
      }
    } finally {
      setLoading(false)
    }
  }

  async function loginWithGoogle(idToken) {
    if (!idToken) throw new Error('Token de Google inválido')
    setLoading(true)
    try {
      const response = await googleAuthLogin({ idToken })
      const nextToken = response?.token || ''
      const nextUser = response?.user || null

      setToken(nextToken)
      setUser(nextUser)
      if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
      return nextUser
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (!token) return null
    setLoading(true)
    try {
      const response = await fetchAuthMe(token)
      setUser(response?.user || null)
      return response?.user || null
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(payload) {
    if (!token) throw new Error('No hay sesión activa')
    setLoading(true)
    try {
      const response = await updateAuthMe(token, payload)
      const nextToken = response?.token || token
      setToken(nextToken)
      if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
      setUser(response?.user || null)
      return response?.user || null
    } finally {
      setLoading(false)
    }
  }

  async function deleteAccount(password) {
    if (!token) throw new Error('No hay sesión activa')
    setLoading(true)
    try {
      await deleteAuthMe(token, { password })
      logout()
      return true
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authReady,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        loginWithGoogle,
        refreshProfile,
        updateProfile,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
