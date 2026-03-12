import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './context/AuthContext'

import theme from './theme'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import NetworkStatusBar from './components/NetworkStatusBar'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import { getDefaultPathByRole } from './config/roleAccess'

// Páginas críticas (carga inmediata)
import HomePage from './pages/HomePage'

// Páginas con lazy loading (carga diferida para mejor rendimiento)
const ZonesPage = lazy(() => import('./pages/ZonesPage'))
const VotersPage = lazy(() => import('./pages/VotersPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const DataManagementPage = lazy(() => import('./pages/DataManagementPage'))
const QueryAnalyticsPage = lazy(() => import('./pages/QueryAnalyticsPage'))
const ExecutiveDashboardPage = lazy(() => import('./pages/ExecutiveDashboardPage'))
const GeoReferencePage = lazy(() => import('./pages/GeoReferencePage'))
const AuditPage = lazy(() => import('./pages/AuditPage'))
const SurveysPage = lazy(() => import('./pages/SurveysPage'))
const FilesPage = lazy(() => import('./pages/FilesPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const SmartAlertsPage = lazy(() => import('./pages/SmartAlertsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AbacoTrainingPage = lazy(() => import('./pages/AbacoTrainingPage'))
const AbacoAscendPage = lazy(() => import('./pages/AbacoAscendPage'))
const CitizenRequestsPage = lazy(() => import('./pages/CitizenRequestsPage'))
const TerritorialCommunicationPage = lazy(() => import('./pages/TerritorialCommunicationPage'))
const ManagementIndicatorsPage = lazy(() => import('./pages/ManagementIndicatorsPage'))
const StrategicIntelligencePage = lazy(() => import('./pages/StrategicIntelligencePage'))
const AccessPortalsPage = lazy(() => import('./pages/AccessPortalsPage'))
const FinancialTerritorialIntelligencePage = lazy(() => import('./pages/FinancialTerritorialIntelligencePage'))
const AbacoElectoralSectionPage = lazy(() => import('./pages/AbacoElectoralSectionPage'))
const AbacoGubernamentalSectionPage = lazy(() => import('./pages/AbacoGubernamentalSectionPage'))
const AbacoAdministrationSectionPage = lazy(() => import('./pages/AbacoAdministrationSectionPage'))
const AbacoVerticalsSectionPage = lazy(() => import('./pages/AbacoVerticalsSectionPage'))
const AbacoVerticalDetailPage = lazy(() => import('./pages/AbacoVerticalDetailPage'))
const AbacoIntegratedBiPage = lazy(() => import('./pages/AbacoIntegratedBiPage'))
const OperationalAlgorithmsPage = lazy(() => import('./pages/OperationalAlgorithmsPage'))

// Componente de carga
function LoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}
    >
      <CircularProgress size={60} />
    </Box>
  )
}

export default function App() {
  const { isAuthenticated, authReady, user } = useAuth()
  const roleHome = getDefaultPathByRole(user?.role)

  if (!authReady) {
    return <LoadingFallback />
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage />
      </ThemeProvider>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <NetworkStatusBar />
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><ExecutiveDashboardPage /></ProtectedRoute>} />
                <Route path="/zones" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}><ZonesPage /></ProtectedRoute>} />
                <Route path="/voters" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}><VotersPage /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}><TasksPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><SettingsPage /></ProtectedRoute>} />
                <Route path="/data-management" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><DataManagementPage /></ProtectedRoute>} />
                <Route path="/query-analytics" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'auditor', 'viewer']}><QueryAnalyticsPage /></ProtectedRoute>} />
                <Route path="/georeference" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><GeoReferencePage /></ProtectedRoute>} />
                <Route path="/security" element={<Navigate to="/settings?section=security" replace />} />
                <Route path="/performance" element={<Navigate to="/settings?section=performance" replace />} />
                <Route path="/audit" element={<ProtectedRoute allowedRoles={['admin', 'auditor']}><AuditPage /></ProtectedRoute>} />
                <Route path="/surveys" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'visitor']}><SurveysPage /></ProtectedRoute>} />
                <Route path="/files" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><FilesPage /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'viewer']}><LeaderboardPage /></ProtectedRoute>} />
                <Route path="/smart-alerts" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'auditor']}><SmartAlertsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/abaco-training" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'viewer']}><AbacoTrainingPage /></ProtectedRoute>} />
                <Route path="/abaco-ascend" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor']}><AbacoAscendPage /></ProtectedRoute>} />
                <Route path="/portales" element={<AccessPortalsPage />} />
                <Route path="/abaco-electoral" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><AbacoElectoralSectionPage /></ProtectedRoute>} />
                <Route path="/abaco-gubernamental" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><AbacoGubernamentalSectionPage /></ProtectedRoute>} />
                <Route path="/abaco-administracion" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><AbacoAdministrationSectionPage /></ProtectedRoute>} />
                <Route path="/abaco-verticales" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><AbacoVerticalsSectionPage /></ProtectedRoute>} />
                <Route path="/abaco-verticales/:slug" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><AbacoVerticalDetailPage /></ProtectedRoute>} />
                <Route path="/abaco-bi-integrador" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><AbacoIntegratedBiPage /></ProtectedRoute>} />
                <Route path="/operational-algorithms" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><OperationalAlgorithmsPage /></ProtectedRoute>} />
                <Route path="/citizen-requests" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'visitor']}><CitizenRequestsPage /></ProtectedRoute>} />
                <Route path="/territorial-communication" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}><TerritorialCommunicationPage /></ProtectedRoute>} />
                <Route path="/management-indicators" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'auditor', 'viewer']}><ManagementIndicatorsPage /></ProtectedRoute>} />
                <Route path="/strategic-intelligence" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'auditor']}><StrategicIntelligencePage /></ProtectedRoute>} />
                <Route path="/financial-intelligence" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><FinancialTerritorialIntelligencePage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to={roleHome} replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
