import React from 'react'
import Header from './components/Header'
import Signup from './pages/Signup'
import Login from './pages/Login'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import Clients from './pages/Clients'
import ClientDashboard from './pages/ClientDashboard'
import AssessmentPage from './pages/AssessmentPage'
import Templates from './pages/Templates'

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
          path='/templates'
          element={
            <RequireAuth>
              <Templates />
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
