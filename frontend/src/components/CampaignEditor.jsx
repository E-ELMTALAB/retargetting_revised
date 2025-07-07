import React, { useState, useRef, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'

const placeholders = ['{{first_name}}', '{{last_order}}', '{{discount_code}}']

export default function CampaignEditor({ accountId, sessionId, onSelectCampaign }) {
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState(null)
  const [categories, setCategories] = useState([])
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')
  const [nudge, setNudge] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [drafts, setDrafts] = useState([])
  const quillRef = useRef(null)

  const fetchDrafts = () => {
    if (!accountId) return
    fetch(`${API_BASE}/campaigns?account_id=${accountId}`)
      .then(r => r.json())
      .then(d => setDrafts(d.campaigns || []))
      .catch(e => console.error('draft fetch error', e))
  }

  useEffect(() => {
    fetchDrafts()
  }, [accountId])

  const insertPlaceholder = ph => {
    const quill = quillRef.current.getEditor()
    const range = quill.getSelection(true)
    quill.insertText(range.index, ph)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = {}
    if (!message || message.trim().length === 0) errs.message = 'Message required'
    if (!sessionId) errs.session = 'Telegram session required'
    if (trackingUrl && !/^https?:\/\//.test(trackingUrl)) errs.trackingUrl = 'Invalid URL'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setStatus('Starting...')
    try {
      const resp = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          telegram_session_id: sessionId,
          message_text: message,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(JSON.stringify(data))
      const campaignId = data.id
      await fetch(`${API_BASE}/campaigns/${campaignId}/start`, { method: 'POST' })
      setStatus('Campaign running')
      fetchDrafts()
      onSelectCampaign && onSelectCampaign(campaignId)
    } catch (err) {
      console.error('campaign start error', err)
      setStatus('Failed to start')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-700 mb-6">Campaign Editor</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-lg shadow-md border border-gray-200"
      >
        <div className="space-y-2">
          <label className="block font-semibold">Message (required)</label>
          <ReactQuill
            ref={quillRef}
            value={message}
            onChange={setMessage}
            className="bg-white border rounded"
          />
          <div className="flex flex-wrap gap-2">
            {placeholders.map(ph => (
              <button
                type="button"
                key={ph}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                onClick={() => insertPlaceholder(ph)}
              >
                {ph}
              </button>
            ))}
          </div>
          {errors.message && (
            <p className="text-red-600 text-sm">{errors.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Media (optional)</label>
          <input
            type="file"
            className="block border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setMedia(e.target.files[0])}
          />
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Category Filters (optional)</label>
          <select
            multiple
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categories}
            onChange={e =>
              setCategories(Array.from(e.target.selectedOptions, o => o.value))
            }
          >
            <option value="vip">VIP</option>
            <option value="new">New</option>
            <option value="returning">Returning</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="font-semibold">Quiet Start (optional)</label>
            <input
              type="time"
              className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quietStart}
              onChange={e => setQuietStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="font-semibold">Quiet End (optional)</label>
            <input
              type="time"
              className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quietEnd}
              onChange={e => setQuietEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Nudge Message (optional)</label>
          <input
            type="text"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={nudge}
            onChange={e => setNudge(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Link Tracking URL (optional)</label>
          <input
            type="url"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={trackingUrl}
            onChange={e => setTrackingUrl(e.target.value)}
          />
          {errors.trackingUrl && (
            <p className="text-red-600 text-sm">{errors.trackingUrl}</p>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded self-start"
        >
          Start Campaign
        </button>
        {errors.session && (
          <p className="text-red-600 text-sm">{errors.session}</p>
        )}
        {status && <p className="text-sm">{status}</p>}
      </form>

      {drafts.length > 0 && (
        <div className="mt-8 space-y-2">
          <h3 className="text-xl font-semibold">Existing Campaigns</h3>
          <ul className="space-y-1">
            {drafts.map(c => (
              <li key={c.id} className="flex items-center justify-between border p-2 rounded">
                <div className="flex-1">
                  <span className="block">{c.message_text.slice(0, 30)}...</span>
                  <span className="text-xs text-gray-500">Status: {c.status}</span>
                </div>
                <div className="flex gap-2">
                  {c.status === 'stopped' || c.status === 'completed' ? (
                    <button
                      className="text-sm px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      onClick={() => {
                        fetch(`${API_BASE}/campaigns/${c.id}/resume`, { method: 'POST' })
                          .then(() => {
                            setStatus('Campaign resumed')
                            onSelectCampaign && onSelectCampaign(c.id)
                          })
                          .catch(err => {
                            console.error('resume error', err)
                            setStatus('Failed to resume')
                          })
                      }}
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => {
                        fetch(`${API_BASE}/campaigns/${c.id}/start`, { method: 'POST' })
                          .then(() => {
                            setStatus('Campaign running')
                            onSelectCampaign && onSelectCampaign(c.id)
                          })
                          .catch(err => {
                            console.error('rerun error', err)
                            setStatus('Failed to start')
                          })
                      }}
                    >
                      Run
                    </button>
                  )}
                  <button
                    className="text-sm px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    onClick={() => {
                      // Navigate to campaign monitor to edit
                      onSelectCampaign && onSelectCampaign(c.id)
                    }}
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
