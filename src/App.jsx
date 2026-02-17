import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import ZonesPage from './pages/ZonesPage'
import VotersPage from './pages/VotersPage'
import UsersPage from './pages/UsersPage'
import Layout from './components/Layout'
import { ThemeProvider } from '@mui/material/styles'
import theme from './theme'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/zones" element={<ZonesPage />} />
              <Route path="/voters" element={<VotersPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
