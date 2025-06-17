import React, { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, api_key: apiKey })
    }).then(r => r.json()).then(console.log);
  };
  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        placeholder="API Key"
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
