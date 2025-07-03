import React, { useState, useEffect } from 'react'


const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'


console.log('Using API base', API_BASE)



export default function ConnectTelegram({ accountId, sessionId, onSelectSession }) {
  const [step, setStep] = useState('list')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [sessions, setSessions] = useState([])

  const fetchSessions = () => {
    console.log('fetching sessions for', accountId)
    fetch(`${API_BASE}/session/status?account_id=${accountId}`)
      .then(r => r.json())
      .then(d => {
        console.log('session status data', d)
        setSessions(d.sessions || [])
        if ((d.sessions || []).length > 0) {
          setStep('list')
        } else {
          setStep('phone')
        }
      })
      .catch(e => console.error('status error', e))
  }

  useEffect(() => {
    fetchSessions()
  }, [accountId])

  const sendPhone = async e => {
    e.preventDefault()
    setStatus('Sending code...')
    try {
      console.log('frontend sending phone', phone)

      const resp = await fetch(`${API_BASE}/session/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, account_id: accountId }),
      })

      console.log('frontend connect status', resp.status)
      const data = await resp.json().catch(() => ({}))
      console.log('frontend connect body', data)
      if (!resp.ok) throw new Error(JSON.stringify(data))

      setStep('code')
      setStatus('Code sent. Check your Telegram account.')
    } catch (err) {
      console.error('frontend phone error', err)
      setStatus('Failed to send code')
    }
  }

  const verifyCode = async e => {
    e.preventDefault()
    setStatus('Verifying...')
    try {
      console.log('frontend verifying code', code)

      const resp = await fetch(`${API_BASE}/session/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, account_id: accountId }),
      })

      console.log('frontend verify status', resp.status)
      const data = await resp.json().catch(() => ({}))
      console.log('frontend verify body', data)
      if (!resp.ok) throw new Error(JSON.stringify(data))

      console.log('frontend verify success', data)
      setStatus('Account connected!')
      fetchSessions()
      onSelectSession && onSelectSession(data.session_id)
      setStep('list')
    } catch (err) {
      console.error('frontend verify error', err)
      setStatus('Verification failed')
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-semibold text-center">Connect Telegram</h2>
      {step === 'list' && (
        <div className="space-y-2">
          <p className="text-sm">Select a session:</p>
          <ul className="space-y-1">
            {sessions.map(s => (
              <li key={s.id} className="flex items-center justify-between border p-2 rounded">
                <span>{s.phone || 'Session ' + s.id}</span>
                <button
                  className="text-sm underline"
                  onClick={() => {
                    console.log('select session', s.id)
                    onSelectSession && onSelectSession(s.id)
                  }}
                >
                  {sessionId == s.id ? 'Selected' : 'Use'}
                </button>
              </li>
            ))}
          </ul>
          <button className="text-sm underline" onClick={() => setStep('phone')}>Add New Session</button>
        </div>
      )}
      {step === 'phone' && (
        <form onSubmit={sendPhone} className="space-y-2">
          <input
            type="tel"
            placeholder="Phone number"
            className="border p-2 w-full"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Send Code
          </button>
        </form>
      )}
      {step === 'code' && (
        <form onSubmit={verifyCode} className="space-y-2">
          <input
            type="text"
            placeholder="Telegram code"
            className="border p-2 w-full"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Verify
          </button>
        </form>
      )}
      {step === 'done' && (
        <p className="text-center">Telegram already connected.</p>
      )}
      {status && <p className="text-center text-sm text-gray-600">{status}</p>}
    </div>
  )
}
