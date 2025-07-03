import React, { useState } from 'react'
import Login from './components/Login'
import MainPage from './components/MainPage'

export default function App() {
  const [accountId, setAccountId] = useState(() => localStorage.getItem('accountId'))
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('sessionId'))

  const handleLogin = (id, sessId) => {
    console.log('App login', id, sessId)
    setAccountId(id)
    localStorage.setItem('accountId', id)
    if (sessId) {
      setSessionId(sessId)
      localStorage.setItem('sessionId', sessId)
    }
  }

  const handleLogout = () => {
    console.log('App logout')
    setAccountId(null)
    setSessionId(null)
    localStorage.removeItem('accountId')
    localStorage.removeItem('sessionId')
  }

  if (!accountId) {
    return <Login onLogin={handleLogin} />
  }

  const handleSelectSession = id => {
    console.log('App selected session', id)
    setSessionId(id)
    if (id) localStorage.setItem('sessionId', id)
    else localStorage.removeItem('sessionId')
  }

  return <MainPage accountId={accountId} sessionId={sessionId} onSelectSession={handleSelectSession} onLogout={handleLogout} />
}
