import React, { useState, useEffect } from 'react'

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://retargetting-worker.elmtalabx.workers.dev'

export default function CampaignMonitor({ accountId }) {
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState([])
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [campaignStatus, setCampaignStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const initialMount = React.useRef(true)

  const stopCampaign = async (id) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/campaigns/${id}/stop`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      console.log('Stop campaign response:', data)
      if (response.ok) {
        // Refresh the running campaigns list
        fetchRunningCampaigns()
      } else {
        setError(`Failed to stop campaign: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      console.error('stop campaign error:', e)
      setError(`Failed to stop campaign: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchRunningCampaigns = async () => {
    try {
      const response = await fetch(`${API_BASE}/campaigns?account_id=${accountId}`)
      const data = await response.json()
      if (response.ok) {
        const allCampaigns = (data.campaigns || []).map(c => {
          let f = {}
          try { f = c.filters_json ? JSON.parse(c.filters_json) : {} } catch {}
          return { ...c, categoryUpdate: !!f.categorize_only }
        })
        // Only keep the most recent running campaign
        const runningCampaigns = allCampaigns.filter(c => c.status === 'running')
        if (runningCampaigns.length > 0) {
          // Pick the most recent (highest id)
          const mostRecent = runningCampaigns.reduce((a, b) => (a.id > b.id ? a : b))
          setActiveCampaign(mostRecent)
          setActiveId(mostRecent.id)
        } else {
          setActiveCampaign(null)
          setActiveId(null)
        }
      } else {
        setError(`Failed to fetch campaigns: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      console.error('fetch running campaigns error:', e)
      setError(`Failed to fetch campaigns: ${e.message}`)
    }
  }

  const fetchCampaignStatus = async (campaignId) => {
    try {
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}/status`)
      const data = await response.json()
      console.log('Campaign status data:', data)
      
      if (response.ok) {
        setCampaignStatus(data)
        if (data.status === 'completed') {
          setProgress(100)
        } else if (
          typeof data.progress_percent === 'number' &&
          data.total_recipients > 0
        ) {
          setProgress(data.progress_percent)
        } else {
          setProgress(0)
        }
        
      } else {
        console.error('Failed to fetch campaign status:', data.error)
      }
    } catch (e) {
      console.error('fetch campaign status error:', e)
    }
  }

  const fetchCampaignLogs = async (campaignId) => {
    try {
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}/logs`)
      const data = await response.json()
      console.log('Campaign logs data:', data)
      if (response.ok) {
        const formattedLogs = Array.isArray(data.logs) ? data.logs : []
        setLogs(formattedLogs)
      } else {
        console.error('Failed to fetch campaign logs:', data.error)
      }
    } catch (e) {
      console.error('fetch campaign logs error:', e)
    }
  }

  useEffect(() => {
    if (initialMount.current) {
      setActiveId(null)
      setActiveCampaign(null)
      initialMount.current = false
    }
  }, [])

  useEffect(() => {
    if (!accountId) return
    fetchRunningCampaigns()
    const interval = setInterval(fetchRunningCampaigns, 5000)
    return () => clearInterval(interval)
  }, [accountId])

  useEffect(() => {
    if (!activeId) return
    fetchCampaignStatus(activeId)
    fetchCampaignLogs(activeId)
    const statusInterval = setInterval(() => fetchCampaignStatus(activeId), 2000)
    const logsInterval = setInterval(() => fetchCampaignLogs(activeId), 3000)
    return () => {
      clearInterval(statusInterval)
      clearInterval(logsInterval)
    }
  }, [activeId])

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch (e) {
      return timestamp
    }
  }

  const resumeCampaign = async (id) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/campaigns/${id}/resume`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      console.log('Resume campaign response:', data)
      if (response.ok) {
        // Refresh the running campaigns list
        fetchRunningCampaigns()
      } else {
        setError(`Failed to resume campaign: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      console.error('resume campaign error:', e)
      setError(`Failed to resume campaign: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl mb-2 font-semibold">Campaign Monitor</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}
      {!activeCampaign ? (
        <p className="text-sm text-gray-500">No running campaigns</p>
      ) : activeId ? (
        <div className="flex flex-col md:flex-row gap-6 border rounded p-4 bg-white shadow">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-medium mb-1">Live Sending Status</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progress || 0}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {progress > 0 ? `${progress}% complete` : 'Not started'}
              </p>

              {campaignStatus.status === 'completed' && (
                <p className="text-green-600 text-sm font-semibold">Campaign finished</p>
              )}

              {campaignStatus.status === 'running' && campaignStatus.neglected_count > 0 && (
                <p className="text-orange-600 text-xs">Neglecting {campaignStatus.neglected_count} chats</p>
              )}


              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-500">
                  {campaignStatus.sent_count || 0} sent, {campaignStatus.failed_count || 0} failed
                </div>
              </div>

              {campaignStatus.current_recipient && (
                <p className="text-xs text-blue-600 mt-1">
                  Currently sending to: {campaignStatus.current_recipient}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-1">Campaign Details</h3>
              <div className="text-sm space-y-1">
                <p><strong>Status:</strong> {campaignStatus.status || 'Unknown'}</p>
                <p><strong>Started:</strong> {formatTimestamp(campaignStatus.started_at)}</p>
                {campaignStatus.completed_at && (
                  <p><strong>Completed:</strong> {formatTimestamp(campaignStatus.completed_at)}</p>
                )}
                <p><strong>Total Recipients:</strong> {campaignStatus.total_recipients || 0}</p>
                <p><strong>Success Rate:</strong> {campaignStatus.success_rate || '0%'}</p>
              </div>
            </div>


            <div>
              <h3 className="font-medium mb-1">Live Logs</h3>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">No logs yet</p>
              ) : (
                <div className="max-h-40 overflow-y-auto">
                  <ul className="text-sm space-y-1">
                    {logs.slice(-10).reverse().map((l, i) => (
                      <li key={i} className={`p-1 rounded ${l.status === 'sent' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <span className="text-xs text-gray-500">{formatTimestamp(l.timestamp)}</span>
                        <br />
                        <span className="font-mono">{l.phone}</span>: {l.status}
                        {l.error && <span className="text-red-600"> - {l.error}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
