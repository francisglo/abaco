import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  loginAuth,
  registerAuth,
  fetchAuthMe,
  updateAuthMe,
  deleteAuthMe
} from '../api'

const AuthContext = createContext()
const TOKEN_KEY = 'abaco_auth_token'

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
      .catch(() => {
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
      const response = await loginAuth(credentials)
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

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
  }

  async function register(payload) {
    setLoading(true)
    try {
      const response = await registerAuth(payload)
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
