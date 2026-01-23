import React from 'react'
import Header from './components/Header'
import Signup from './pages/Signup'
import Login from './pages/Login'
import { Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'

const App = () => {
  return (
    <div>
      <Header />
      <Routes>
        <Route path='/' element={<Navigate to='/dashboard' replace />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/clients' element={<Clients />} />
        <Route path='/dashboard' element={<Navigate to='/dashboard' replace />} />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </div>
  )
}

export default App
