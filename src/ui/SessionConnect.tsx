import React, { useState } from 'react';
import { useAppState } from './Store';

interface Props { onSuccess: () => void; }
export default function SessionConnect({ onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAppState();

  const sendOtp = () => {
    fetch('/session/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ phone })
    });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetch('/session/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ phone, code })
    })
      .then(() => onSuccess())
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Connect Telegram</h2>
      <input
        className="border p-2 w-full"
        placeholder="Phone"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={sendOtp}>Send OTP</button>
      <form onSubmit={verify} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Code"
          value={code}
          onChange={e => setCode(e.target.value)}
        />

        <button
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

      </form>
    </div>
  );
}
