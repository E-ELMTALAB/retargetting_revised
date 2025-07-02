import React, { useState, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const placeholders = ['{{first_name}}', '{{last_order}}', '{{discount_code}}']

export default function CampaignEditor() {
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState(null)
  const [categories, setCategories] = useState([])
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')
  const [nudge, setNudge] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const quillRef = useRef(null)

  const insertPlaceholder = ph => {
    const quill = quillRef.current.getEditor()
    const range = quill.getSelection(true)
    quill.insertText(range.index, ph)
  }

  const handleSubmit = e => {
    e.preventDefault()
    alert('Campaign saved (mock)')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-700 mb-6">Campaign Editor</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        <div className="space-y-2">
          <label className="block font-semibold">Message</label>
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
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                onClick={() => insertPlaceholder(ph)}
              >
                {ph}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Media</label>
          <input
            type="file"
            className="block border rounded p-2 w-full"
            onChange={e => setMedia(e.target.files[0])}
          />
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Category Filters</label>
          <select
            multiple
            className="border rounded p-2 w-full"
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
            <label className="font-semibold">Quiet Start</label>
            <input
              type="time"
              className="border rounded p-2"
              value={quietStart}
              onChange={e => setQuietStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="font-semibold">Quiet End</label>
            <input
              type="time"
              className="border rounded p-2"
              value={quietEnd}
              onChange={e => setQuietEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Nudge Message</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={nudge}
            onChange={e => setNudge(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block font-semibold">Link Tracking URL</label>
          <input
            type="url"
            className="border rounded p-2 w-full"
            value={trackingUrl}
            onChange={e => setTrackingUrl(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded self-start"
        >
          Start Campaign
        </button>
      </form>
    </div>
  )
}
