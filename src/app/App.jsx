import React from 'react'
import Header from '../shared/components/Header'
import Signup from '../features/auth/Signup'
import Login from '../features/auth/Login'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import ClientSelectPage from '../features/clients/ClientSelectPage'
import ClientDashboard from '../features/clients/ClientDashboard'
import AssessmentPage from '../features/assessments/AssessmentPage'
import ReadOnlyAssessmentPage from '../features/assessments/ReadOnlyAssessmentPage'
import TemplatesPage from '../features/templates/TemplatesPage'
import RoadmapPage from '../features/roadmap/RoadmapPage'
import GoalsPage from '../features/goals/GoalsPage'

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to='/login' replace />
  }
  return children
}

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (token) {
    return <Navigate to='/clients/select' replace />
  }
  return children
}

const RequireClient = ({ children }) => {
  const activeOrganizationId = localStorage.getItem('activeOrganizationId')
  if (!activeOrganizationId) {
    return <Navigate to='/clients/select' replace />
  }
  return children
}

const App = () => {
  const location = useLocation()
  return (
    <div>
      <Header />
      <Routes>
        <Route path='/' element={<Navigate to='/clients/select' replace />} />
        <Route
          path='/login'
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path='/signup'
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path='/dashboard'
          element={
            <RequireAuth>
              <Navigate to='/clients/select' replace />
            </RequireAuth>
          }
        />
        <Route
          path='/clients/select'
          element={
            <RequireAuth>
              <ClientSelectPage />
            </RequireAuth>
          }
        />
        <Route path='/clients' element={<Navigate to='/clients/select' replace />} />
        <Route
          path='/clients/:organizationId'
          element={
            <RequireAuth>
              <ClientDashboard />
            </RequireAuth>
          }
        />
        <Route
          path='/assessments/:assessmentId'
          element={
            <RequireAuth>
              <RequireClient>
                <AssessmentPage />
              </RequireClient>
            </RequireAuth>
          }
        />
        <Route
          path='/assessments/:assessmentId/read-only'
          element={
            <RequireAuth>
              <RequireClient>
                <ReadOnlyAssessmentPage />
              </RequireClient>
            </RequireAuth>
          }
        />
        <Route
          path='/templates'
          element={
            <RequireAuth>
              <RequireClient>
                <TemplatesPage />
              </RequireClient>
            </RequireAuth>
          }
        />
        <Route
          path='/roadmap'
          element={
            <RequireAuth>
              <RequireClient>
                <RoadmapPage />
              </RequireClient>
            </RequireAuth>
          }
        />
        <Route
          path='/goals'
          element={
            <RequireAuth>
              <RequireClient>
                <GoalsPage />
              </RequireClient>
            </RequireAuth>
          }
        />
        <Route
          path='*'
          element={
            location.pathname.startsWith('/login') || location.pathname.startsWith('/signup') ? (
              <Navigate to='/login' replace />
            ) : (
              <Navigate to='/clients/select' replace />
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App
