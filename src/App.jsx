import React from 'react'
import Header from './components/Header'
import SignUp from './pages/SignUp'
import LogIn from './pages/LogIn'
import { Route, Routes } from 'react-router'

const App = () => {
  return (
    <div>
      <Header />
      <Routes>
        <Route path='/signup' element={<SignUp />} />
        <Route path='/login' element={<LogIn />} />
      </Routes>
    </div>
  )
}

export default App