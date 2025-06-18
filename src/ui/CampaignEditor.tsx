import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

const placeholders = [
  { label: 'First Name', value: '{{first_name}}' },
  { label: 'Last Order', value: '{{last_order}}' },
  { label: 'Discount Code', value: '{{discount_code}}' }
];

export default function CampaignEditor() {
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');
  const [nudgeText, setNudgeText] = useState('');
  const [nudgeDelay, setNudgeDelay] = useState(0);
  const [trackingUrl, setTrackingUrl] = useState('');

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('message_text', message);
    if (media) form.append('media', media);
    form.append('category', category);
    form.append('quiet_start', quietStart);
    form.append('quiet_end', quietEnd);
    form.append('nudge_text', nudgeText);
    form.append('nudge_delay', String(nudgeDelay));
    form.append('tracking_url', trackingUrl);

    fetch('/campaigns', {
      method: 'POST',
      body: form
    });
  };

  return (
    <form onSubmit={create}>
      <h2>Create Campaign</h2>
      <label>
        Message
        <RichTextEditor html={message} onChange={setMessage} />
      </label>
      <label>
        Insert Placeholder
        <select onChange={e => setMessage(message + ' ' + e.target.value)} defaultValue="">
          <option value="" disabled>Select...</option>
          {placeholders.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      <label>
        Media
        <input type="file" onChange={e => setMedia(e.target.files?.[0] || null)} />
      </label>
      <label>
        Category
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">None</option>
          <option value="buyer">Buyer</option>
          <option value="browser">Browser</option>
          <option value="refund_risk">Refund Risk</option>
        </select>
      </label>
      <label>
        Quiet Hours Start
        <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} />
      </label>
      <label>
        Quiet Hours End
        <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} />
      </label>
      <label>
        Nudge Text
        <input value={nudgeText} onChange={e => setNudgeText(e.target.value)} />
      </label>
      <label>
        Nudge Delay (mins)
        <input type="number" value={nudgeDelay} onChange={e => setNudgeDelay(parseInt(e.target.value))} />
      </label>
      <label>
        Tracking URL
        <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} />
      </label>
      <button type="submit">Create</button>
    </form>
  );
}
