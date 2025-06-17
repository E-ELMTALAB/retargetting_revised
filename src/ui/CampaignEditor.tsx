import React, { useState } from 'react';

export default function CampaignEditor() {
  const [message, setMessage] = useState('');

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_text: message })
    });
  };

  return (
    <form onSubmit={create}>
      <h2>Create Campaign</h2>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Message text"
      />
      <button type="submit">Create</button>
    </form>
  );
}
