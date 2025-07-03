import React, { useState } from 'react'

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus(mode === 'signup' ? 'Signing up...' : 'Logging in...')
    try {
      console.log('login form submit', mode, email)
      const resp = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await resp.json().catch(() => ({}))
      console.log('auth response', resp.status, data)
      if (!resp.ok) throw new Error(JSON.stringify(data))
      const id = data.id
      localStorage.setItem('accountId', id)

      let firstSessionId = null
      try {
        const sessResp = await fetch(`${API_BASE}/session/status?account_id=${id}`)
        const sessData = await sessResp.json().catch(() => ({}))
        console.log('session status resp', sessResp.status, sessData)
        if (sessResp.ok && sessData.sessions && sessData.sessions.length > 0) {
          firstSessionId = sessData.sessions[0].id
          localStorage.setItem('sessionId', firstSessionId)
        }
      } catch (sessErr) {
        console.error('session status error', sessErr)
      }

      setStatus('Success')
      onLogin(id, firstSessionId)
    } catch (err) {
      console.error('auth error', err)
      const msg = err && err.message ? err.message : 'Failed'
      setStatus('Failed: ' + msg)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-white p-8 rounded shadow gap-4 w-80"
      >
        <h1 className="text-xl font-semibold text-center">{mode === 'signup' ? 'Sign Up' : 'Login'}</h1>
        <input
          type="text"
          placeholder="Email"
          className="border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded"
        >
          {mode === 'signup' ? 'Sign Up' : 'Log In'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          className="text-sm underline"
        >
          {mode === 'signup' ? 'Have an account? Login' : 'Need an account? Sign Up'}
        </button>
        {status && <p className="text-sm text-center">{status}</p>}
      </form>
    </div>
  )
}
