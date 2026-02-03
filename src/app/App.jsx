import React from 'react'
import Header from '../shared/components/Header'
import Signup from '../features/auth/Signup'
import Login from '../features/auth/Login'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import Clients from '../features/clients/Clients'
import ClientDashboard from '../features/clients/ClientDashboard'
import AssessmentPage from '../features/assessments/AssessmentPage'
import ReadOnlyAssessmentPage from '../features/assessments/ReadOnlyAssessmentPage'
import TemplatesPage from '../features/templates/TemplatesPage'
import RoadmapPage from '../features/roadmap/RoadmapPage'

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
    return <Navigate to='/clients' replace />
  }
  return children
}

const App = () => {
  const location = useLocation()
  return (
    <div>
      <Header />
      <Routes>
        <Route path='/' element={<Navigate to='/clients' replace />} />
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
              <Navigate to='/clients' replace />
            </RequireAuth>
          }
        />
        <Route
          path='/clients'
          element={
            <RequireAuth>
              <Clients />
            </RequireAuth>
          }
        />
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
              <AssessmentPage />
            </RequireAuth>
          }
        />
        <Route
          path='/assessments/:assessmentId/read-only'
          element={
            <RequireAuth>
              <ReadOnlyAssessmentPage />
            </RequireAuth>
          }
        />
        <Route
          path='/templates'
          element={
            <RequireAuth>
              <TemplatesPage />
            </RequireAuth>
          }
        />
        <Route
          path='/roadmap'
          element={
            <RequireAuth>
              <RoadmapPage />
            </RequireAuth>
          }
        />
        <Route
          path='*'
          element={
            location.pathname.startsWith('/login') || location.pathname.startsWith('/signup') ? (
              <Navigate to='/login' replace />
            ) : (
              <Navigate to='/clients' replace />
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App
