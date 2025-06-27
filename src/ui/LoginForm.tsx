import React, { useState } from 'react';
import { useAppState } from './Store';

interface Props { onSuccess: () => void; }
export default function LoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAppState();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, api_key: apiKey })
    })
      .then(r => r.json())
      .then(data => {
        setToken(data.token);
        onSuccess();
      })
      .finally(() => setLoading(false));
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto space-y-4 p-4 border rounded shadow"
    >
      <h2 className="text-xl font-semibold text-center">Login</h2>
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
