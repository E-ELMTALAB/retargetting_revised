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

  const create = async (e: React.FormEvent) => {
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

    const res = await fetch('/campaigns', {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    await fetch(`/campaigns/${data.id}/start`, { method: 'POST' });
    alert('Campaign started');
  };

  return (

    <form onSubmit={create} className="space-y-4 p-4 border rounded shadow">
      <h2 className="text-xl font-semibold text-center">Create Campaign</h2>
      <label className="block">
        <span className="block mb-1">Message</span>
        <RichTextEditor html={message} onChange={setMessage} />
      </label>
      <label className="block">
        <span className="block mb-1">Insert Placeholder</span>
        <select
          className="border p-2 rounded"
          onChange={e => setMessage(message + ' ' + e.target.value)}
          defaultValue=""
        >

          <option value="" disabled>Select...</option>
          {placeholders.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block mb-1">Media</span>
        <input className="border p-2 rounded w-full" type="file" onChange={e => setMedia(e.target.files?.[0] || null)} />
      </label>
      <label className="block">
        <span className="block mb-1">Category</span>
        <select
          className="border p-2 rounded w-full"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >

          <option value="">None</option>
          <option value="buyer">Buyer</option>
          <option value="browser">Browser</option>
          <option value="refund_risk">Refund Risk</option>
        </select>
      </label>

      <div className="flex space-x-4">
        <label className="block flex-1">
          <span className="block mb-1">Quiet Hours Start</span>
          <input className="border p-2 rounded w-full" type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} />
        </label>
        <label className="block flex-1">
          <span className="block mb-1">Quiet Hours End</span>
          <input className="border p-2 rounded w-full" type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} />
        </label>
      </div>
      <label className="block">
        <span className="block mb-1">Nudge Text</span>
        <input className="border p-2 rounded w-full" value={nudgeText} onChange={e => setNudgeText(e.target.value)} />
      </label>
      <label className="block">
        <span className="block mb-1">Nudge Delay (mins)</span>
        <input className="border p-2 rounded" type="number" value={nudgeDelay} onChange={e => setNudgeDelay(parseInt(e.target.value))} />
      </label>
      <label className="block">
        <span className="block mb-1">Tracking URL</span>
        <input className="border p-2 rounded w-full" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} />
      </label>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Create</button>

    </form>
  );
}
