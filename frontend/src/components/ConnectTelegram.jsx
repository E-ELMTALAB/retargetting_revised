import React, { useState } from 'react'


const API_BASE = import.meta.env.VITE_API_BASE || ''


export default function ConnectTelegram() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')

  const sendPhone = async e => {
    e.preventDefault()
    setStatus('Sending code...')
    try {

      await fetch(`${API_BASE}/session/connect`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      setStep('code')
      setStatus('Code sent. Check your Telegram account.')
    } catch (err) {
      setStatus('Failed to send code')
    }
  }

  const verifyCode = async e => {
    e.preventDefault()
    setStatus('Verifying...')
    try {

      await fetch(`${API_BASE}/session/verify`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      setStatus('Account connected!')
    } catch (err) {
      setStatus('Verification failed')
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-semibold text-center">Connect Telegram</h2>
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
      {status && <p className="text-center text-sm text-gray-600">{status}</p>}
    </div>
  )
}
