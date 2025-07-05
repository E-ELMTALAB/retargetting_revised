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

  const stopCampaign = id => {
    fetch(`${API_BASE}/campaigns/${id}/stop`, { method: 'POST' })
      .then(() => fetchCampaigns())
      .catch(err => console.error('stop campaign', err))
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
      <ul className="space-y-3">
        {campaigns.map(c => (
          <li
            key={c.id}
            className="flex items-center justify-between bg-white p-4 rounded shadow border"
          >
            <div>
              <p className="font-medium">Campaign #{c.id}</p>
              <p className="text-sm text-gray-600">{c.message_text.slice(0, 60)}...</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs px-2 py-1 rounded ${c.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
              {c.status === 'running' ? (
                <>
                  <button
                    className="text-sm underline text-blue-600"
                    onClick={() => monitor(c.id)}
                  >
                    Monitor
                  </button>
                  <button
                    className="text-sm underline text-red-600 ml-2"
                    onClick={() => stopCampaign(c.id)}
                  >
                    Stop
                  </button>
                </>
              ) : (
                <button
                  className="text-sm underline text-green-700"
                  onClick={() => startCampaign(c.id)}
                >
                  Run
                </button>
              )}
            </div>
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
