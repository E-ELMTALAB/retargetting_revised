import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CampaignForm from './CampaignForm'

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'

export default function Campaigns({ accountId, sessionId, onSelectCampaign }) {
  const [campaigns, setCampaigns] = useState([])
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const fetchCampaigns = () => {
    if (!accountId) return
    fetch(`${API_BASE}/campaigns?account_id=${accountId}`)
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns || []))
      .catch(e => console.error('fetch campaigns', e))
  }

  useEffect(() => {
    fetchCampaigns()
  }, [accountId])

  const startCampaign = id => {
    fetch(`${API_BASE}/campaigns/${id}/start`, { method: 'POST' })
      .then(() => {
        fetchCampaigns()
        onSelectCampaign && onSelectCampaign(id)
      })
      .catch(err => console.error('start campaign', err))
  }

  const monitor = id => {
    onSelectCampaign && onSelectCampaign(id)
    navigate('/monitor')
  }

  return (
    <div className="p-6 relative">
      <h2 className="text-3xl font-bold mb-4">Campaigns</h2>
      <button
        className="absolute top-4 right-4 text-3xl font-bold text-blue-600"
        onClick={() => setShowForm(true)}
        aria-label="Add campaign"
      >
        +
      </button>
      <ul className="space-y-2">
        {campaigns.map(c => (
          <li
            key={c.id}
            className="flex items-center justify-between border p-2 rounded"
          >
            <span>{c.message_text.slice(0, 40)}...</span>
            {c.status === 'running' ? (
              <button
                className="text-sm underline text-blue-600"
                onClick={() => monitor(c.id)}
              >
                Monitor
              </button>
            ) : (
              <button
                className="text-sm underline text-green-700"
                onClick={() => startCampaign(c.id)}
              >
                Run
              </button>
            )}
          </li>
        ))}
      </ul>
      {showForm && (
        <CampaignForm
          accountId={accountId}
          sessionId={sessionId}
          onSaved={() => {
            setShowForm(false)
            fetchCampaigns()
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
