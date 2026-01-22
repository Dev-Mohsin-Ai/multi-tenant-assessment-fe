import React from 'react'
import Header from './components/Header'
import SignUp from './pages/SignUp'
import LogIn from './pages/LogIn'
import { Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

const App = () => {
  return (
    <div>
      <Header />
      <Routes>
        <Route path='/signup' element={<SignUp />} />
        <Route path='/login' element={<LogIn />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/dasboard' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </div>
  )
}

export default App
