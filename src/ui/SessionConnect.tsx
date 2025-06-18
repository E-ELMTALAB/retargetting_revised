import React, { useState } from 'react';

interface Props { onSuccess: () => void; }
export default function SessionConnect({ onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = () => {
    fetch('/session/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetch('/session/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code })
    })
      .then(() => onSuccess())
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2>Connect Telegram</h2>
      <input
        placeholder="Phone"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <button onClick={sendOtp}>Send OTP</button>
      <form onSubmit={verify}>
        <input
          placeholder="Code"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
      </form>
    </div>
  );
}
