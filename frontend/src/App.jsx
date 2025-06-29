import React, { useState } from 'react'
import Login from './components/Login'
import MainPage from './components/MainPage'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return <MainPage onLogout={() => setLoggedIn(false)} />
}
