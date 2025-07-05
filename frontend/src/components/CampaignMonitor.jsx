import React, { useState, useEffect } from 'react'

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'

export default function CampaignMonitor({ accountId, campaignId, onSelectCampaign }) {
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState([])
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState([])
  const [activeId, setActiveId] = useState(campaignId || null)


  const stopCampaign = id => {
    fetch(`${API_BASE}/campaigns/${id}/stop`, { method: 'POST' })
      .catch(e => console.error('stop campaign', e))
  }

  useEffect(() => {
    setActiveId(campaignId || null)
  }, [campaignId])

  useEffect(() => {

    if (!accountId) return
    const fetchRunning = () => {
      fetch(`${API_BASE}/campaigns?account_id=${accountId}`)
        .then(r => r.json())
        .then(d => {
          const arr = (d.campaigns || []).filter(c => c.status === 'running')
          setRunning(arr)
        })
        .catch(e => console.error('fetch running campaigns', e))
    }
    fetchRunning()
    const id = setInterval(fetchRunning, 5000)
    return () => clearInterval(id)
  }, [accountId])

  useEffect(() => {
    if (!activeId) return
    const fetchLogs = () => {
      fetch(`${API_BASE}/campaigns/${activeId}/logs`)
        .then(r => r.json())
        .then(d => {
          const arr = d.logs || []
          setLogs(arr)
          const sent = arr.filter(l => l.status === 'sent').length
          const total = arr.length
          if (total > 0) setProgress(Math.round((sent / total) * 100))
          const errs = arr.filter(l => l.status !== 'sent').map(l => `${l.phone}: ${l.error || 'failed'}`)
          setErrors(errs)
        })
        .catch(e => console.error('log fetch error', e))
    }
    fetchLogs()
    const id = setInterval(fetchLogs, 2000)
    return () => clearInterval(id)
  }, [activeId])

  return (

    <div className="p-4 space-y-4">
      <h2 className="text-2xl mb-2 font-semibold">Campaign Monitor</h2>

      <div>
        <h3 className="font-medium mb-1">Running Campaigns</h3>
        {running.length === 0 ? (
          <p className="text-sm text-gray-500">No campaigns running</p>
        ) : (
          <ul className="space-y-1">
            {running.map(c => (
              <li
                key={c.id}
                onClick={() => {
                  setActiveId(c.id)
                  onSelectCampaign && onSelectCampaign(c.id)
                }}
                className={`cursor-pointer p-2 border rounded ${c.id === activeId ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
              >
                <p className="text-sm font-medium">#{c.id}</p>
                <p className="text-xs text-gray-600">{c.message_text.slice(0, 60)}...</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeId && (
        <div className="flex flex-col md:flex-row gap-6 border rounded p-4 bg-white shadow">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-medium mb-1">Live Sending Status</h3>
              <div className="w-full bg-gray-200 h-4 rounded overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-sm">{progress}% complete</p>
                <button
                  className="ml-2 px-2 py-1 text-sm bg-red-600 text-white rounded"
                  onClick={() => stopCampaign(activeId)}
                >
                  Stop
                </button>
              </div>

            </div>

            <div>
              <h3 className="font-medium mb-1">Error Notifications</h3>
              {errors.length === 0 ? (
                <p className="text-sm text-gray-500">No errors</p>
              ) : (
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <h3 className="font-medium">Quiet Hours:</h3>
              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm">
                Off
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h3 className="font-medium">Nudge Status:</h3>
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                Waiting
              </span>
            </div>

            <div className="text-sm">
              <h3 className="font-medium">Revenue Generated</h3>
              <p>$123.45</p>
            </div>

            <div>
              <h3 className="font-medium mb-1">Live Logs</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">No logs yet</p>
              ) : (
                <ul className="text-sm list-disc list-inside space-y-1">
                  {logs.map((l, i) => (
                    <li key={i}>
                      {l.phone}: {l.status}
                      {l.error && ` - ${l.error}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
