import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './context/AuthContext'

import theme from './theme'
import Layout from './components/Layout'
import AlbaWidget from './components/AlbaWidget.jsx'
import OnboardingTour from './components/OnboardingTour'
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
const CoworkingPage = lazy(() => import('./pages/CoworkingPage'))
const CoworkingMessagesPage = lazy(() => import('./pages/CoworkingMessagesPage'))
const CoworkingGroupsPage = lazy(() => import('./pages/CoworkingGroupsPage'))
const CoworkingEventsPage = lazy(() => import('./pages/CoworkingEventsPage'))

// Dashboards funcionales de módulos principales
const ElectoralDashboard = lazy(() => import('./pages/ElectoralDashboard'))
const TerritorialDashboard = lazy(() => import('./pages/TerritorialDashboard'))
const FinancieraDashboard = lazy(() => import('./pages/FinancieraDashboard'))
const DesarrolloEconomicoDashboard = lazy(() => import('./pages/DesarrolloEconomicoDashboard'))
const InversionPublicaDashboard = lazy(() => import('./pages/InversionPublicaDashboard'))
const InclusionFinancieraDashboard = lazy(() => import('./pages/InclusionFinancieraDashboard'))
const CooperacionDesarrolloDashboard = lazy(() => import('./pages/CooperacionDesarrolloDashboard'))
const OrdenamientoTerritorialDashboard = lazy(() => import('./pages/OrdenamientoTerritorialDashboard'))

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
            <OnboardingTour />
            <AlbaWidget />
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
                <Route path="/abaco-electoral/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><ElectoralDashboard /></ProtectedRoute>} />
                <Route path="/abaco-gubernamental/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><TerritorialDashboard /></ProtectedRoute>} />
                <Route path="/financial-intelligence/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><FinancieraDashboard /></ProtectedRoute>} />
                <Route path="/abaco-verticales/desarrollo-economico-territorial/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><DesarrolloEconomicoDashboard /></ProtectedRoute>} />
                <Route path="/abaco-verticales/inversion-publica/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><InversionPublicaDashboard /></ProtectedRoute>} />
                <Route path="/abaco-verticales/inclusion-financiera/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><InclusionFinancieraDashboard /></ProtectedRoute>} />
                <Route path="/abaco-verticales/cooperacion-desarrollo/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><CooperacionDesarrolloDashboard /></ProtectedRoute>} />
                <Route path="/abaco-verticales/ordenamiento-territorial-planeacion-urbana/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer']}><OrdenamientoTerritorialDashboard /></ProtectedRoute>} />
                <Route path="/coworking" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><CoworkingPage /></ProtectedRoute>} />
                <Route path="/coworking/messages" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><CoworkingMessagesPage /></ProtectedRoute>} />
                <Route path="/coworking/groups" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><CoworkingGroupsPage /></ProtectedRoute>} />
                <Route path="/coworking/events" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']}><CoworkingEventsPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to={roleHome} replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
