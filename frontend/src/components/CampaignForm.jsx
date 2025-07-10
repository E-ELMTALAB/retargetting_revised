import React, { useState, useRef, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'

const placeholders = ['{{first_name}}', '{{last_order}}', '{{discount_code}}']

export default function CampaignForm({ accountId, sessionId, onSaved, onClose }) {
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState(null)
  const [includeCats, setIncludeCats] = useState([])
  const [excludeCats, setExcludeCats] = useState([])
  const [availableCats, setAvailableCats] = useState([])
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')
  const [nudge, setNudge] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const quillRef = useRef(null)
  const [chatStartTime, setChatStartTime] = useState('')
  const [chatStartTimeCmp, setChatStartTimeCmp] = useState('after')
  const [newestChatTime, setNewestChatTime] = useState('')
  const [newestChatTimeCmp, setNewestChatTimeCmp] = useState('after')
  const [sleepTime, setSleepTime] = useState('1')
  const [limit, setLimit] = useState('')

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const resp = await fetch(`${API_BASE}/categories`)
        const data = await resp.json()
        setAvailableCats(data.categories || [])
      } catch (e) {
        console.error('fetch categories', e)
      }
    }
    fetchCats()
  }, [])

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
    setStatus('Saving...')
    try {
      const resp = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          telegram_session_id: sessionId,
          message_text: message,
          chat_start_time: chatStartTime || undefined,
          chat_start_time_cmp: chatStartTimeCmp,
          newest_chat_time: newestChatTime || undefined,
          newest_chat_time_cmp: newestChatTimeCmp,
          sleep_time: sleepTime,
          limit: limit ? parseInt(limit) : undefined,
          include_categories: includeCats,
          exclude_categories: excludeCats,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(JSON.stringify(data))
      setStatus('Saved')
      onSaved && onSaved(data.id)
    } catch (err) {
      console.error('campaign save error', err)
      setStatus('Failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-lg w-full relative overflow-y-auto max-h-full">
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl mb-4 font-semibold">New Campaign</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
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
            <div className="space-y-1">
              {availableCats.map(cat => (
                <div key={cat.name} className="flex items-center gap-2">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      value={cat.name}
                      checked={includeCats.includes(cat.name)}
                      onChange={e => {
                        const v = e.target.value
                        setIncludeCats(prev =>
                          prev.includes(v)
                            ? prev.filter(c => c !== v)
                            : [...prev, v]
                        )
                      }}
                    />
                    <span className="text-sm">Include {cat.name}</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      value={cat.name}
                      checked={excludeCats.includes(cat.name)}
                      onChange={e => {
                        const v = e.target.value
                        setExcludeCats(prev =>
                          prev.includes(v)
                            ? prev.filter(c => c !== v)
                            : [...prev, v]
                        )
                      }}
                    />
                    <span className="text-sm">Exclude {cat.name}</span>
                  </label>
                </div>
              ))}
            </div>
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

          <div className="space-y-1">
            <label className="block font-semibold">Chat Start Time</label>
            <div className="flex gap-2">
              <select value={chatStartTimeCmp} onChange={e => setChatStartTimeCmp(e.target.value)} className="border rounded p-2">
                <option value="after">After</option>
                <option value="before">Before</option>
              </select>
              <input type="datetime-local" value={chatStartTime} onChange={e => setChatStartTime(e.target.value)} className="border rounded p-2 flex-1" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold">Newest Chat Time</label>
            <div className="flex gap-2">
              <select value={newestChatTimeCmp} onChange={e => setNewestChatTimeCmp(e.target.value)} className="border rounded p-2">
                <option value="after">After</option>
                <option value="before">Before</option>
              </select>
              <input type="datetime-local" value={newestChatTime} onChange={e => setNewestChatTime(e.target.value)} className="border rounded p-2 flex-1" />
            </div>
          </div>

          <div className="space-y-1">
          <label className="block font-semibold">Sleep Time (seconds between messages)</label>
          <input type="number" min="0" step="0.1" value={sleepTime} onChange={e => setSleepTime(e.target.value)} className="border rounded p-2 w-full" />
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Limit Chats (optional)</label>
          <input
            type="number"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            placeholder="Leave empty for no limit"
          />
        </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded self-start"
          >
            Save Campaign
          </button>
          {errors.session && (
            <p className="text-red-600 text-sm">{errors.session}</p>
          )}
          {status && <p className="text-sm">{status}</p>}
        </form>
      </div>
    </div>
  )
}
