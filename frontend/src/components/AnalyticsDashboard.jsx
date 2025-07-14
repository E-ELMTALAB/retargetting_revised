import React, { useEffect, useState } from 'react'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Pie, Bar } from 'react-chartjs-2'

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
)

export default function AnalyticsDashboard({ accountId, sessionId }) {
  const API_BASE =
    import.meta.env.VITE_API_BASE ||
    'https://retargetting-worker.elmtalabx.workers.dev'

  const [metrics, setMetrics] = useState([])
  const [revenueData, setRevenueData] = useState({ labels: [], datasets: [] })
  const [categoryData, setCategoryData] = useState({ labels: [], datasets: [] })
  const [campaignData, setCampaignData] = useState({ labels: [], datasets: [] })
  const [topLines, setTopLines] = useState([])
  const [chatStats, setChatStats] = useState({ total: 0, growth: 0 })
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
      try {
        console.log('Fetching analytics summary...')
        const url = `${API_BASE}/analytics/summary?account_id=${accountId}&session_id=${sessionId || ''}`
        console.log('fetching', url)
        const resp = await fetch(url)
        console.log('Fetch response:', resp)
        const data = await resp.json()
        console.log('Fetched data:', data)
        const m = data.metrics || {}
        const ctr =
          m.messages_sent && m.successes
            ? ((m.successes / m.messages_sent) * 100).toFixed(1) + '%'
            : '0%'
        console.log('Metrics:', m, 'CTR:', ctr)
        setMetrics([
          { label: 'Messages Sent', value: m.messages_sent || 0 },
          { label: 'Successes', value: m.successes || 0 },
          { label: 'Failures', value: m.failures || 0 },
          { label: 'CTR', value: ctr },
          { label: 'Revenue', value: `$${m.revenue || 0}` },
        ])
        const safeRevenueByDay = Array.isArray(data.revenueByDay) ? data.revenueByDay : []
        console.log('safeRevenueByDay:', safeRevenueByDay)
        const revLabels = safeRevenueByDay.map((r) => r.day)
        const revValues = safeRevenueByDay.map((r) => r.rev)
        console.log('revLabels:', revLabels, 'revValues:', revValues)
        setRevenueData({
          labels: revLabels,
          datasets: [
            {
              label: 'Revenue',
              data: revValues,
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
            },
          ],
        })
        const safeCategories = Array.isArray(data.categories) ? data.categories : []
        const catLabels = safeCategories.map((c) => c.category)
        const catData = safeCategories.map((c) => c.count)
        console.log('catLabels:', catLabels, 'catData:', catData)
        setCategoryData({
          labels: catLabels,
          datasets: [
            {
              label: 'Distribution',
              data: catData,
              backgroundColor: [
                'rgb(34,197,94)',
                'rgb(59,130,246)',
                'rgb(239,68,68)',
              ],
            },
          ],
        })
        const safeCampaigns = Array.isArray(data.campaigns) ? data.campaigns : []
        const campLabels = safeCampaigns.map((c) => `#${c.id}`)
        const campData = safeCampaigns.map((c) => c.total_sent)
        console.log('campLabels:', campLabels, 'campData:', campData)
        setCampaignData({
          labels: campLabels,
          datasets: [
            {
              label: 'Messages Sent',
              data: campData,
              backgroundColor: 'rgba(16,185,129,0.6)',
            },
          ],
        })
        const lines = []
        for (const c of safeCampaigns) {
          if (c.best_performing_lines) {
            try {
              const parsed = JSON.parse(c.best_performing_lines)
              console.log('Parsed best_performing_lines for campaign', c.id, ':', parsed)
              lines.push(...parsed)
            } catch (e) {
              console.log('Failed to parse best_performing_lines for campaign', c.id, ':', c.best_performing_lines)
            }
          }
        }
        console.log('Top lines:', lines)
        setTopLines(lines.slice(0, 3))
        setChatStats({
          total: data.chatOverview?.total || 0,
          growth: data.chatOverview?.growth || 0
        })
      } catch (err) {
        console.error('analytics fetch', err)
      }
    }

  useEffect(() => {
    console.log('AnalyticsDashboard mounted', accountId, sessionId)
    fetchData()
  }, [accountId, sessionId])

  const runUpdate = async () => {
    setUpdating(true)
    try {
      const resp = await fetch(`${API_BASE}/analytics/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, telegram_session_id: sessionId })
      })
      const data = await resp.json()
      console.log('Update response', data)
      fetchData()
    } catch (e) {
      console.error('update error', e)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    console.log('metrics state updated:', metrics)
  }, [metrics])
  useEffect(() => {
    console.log('revenueData state updated:', revenueData)
  }, [revenueData])
  useEffect(() => {
    console.log('categoryData state updated:', categoryData)
  }, [categoryData])
  useEffect(() => {
    console.log('campaignData state updated:', campaignData)
  }, [campaignData])
  useEffect(() => {
    console.log('topLines state updated:', topLines)
  }, [topLines])

  return (

    <div className="p-4 space-y-6">
      <h2 className="text-2xl mb-4 font-semibold">Analytics Dashboard</h2>

      <div className="bg-white p-4 rounded shadow flex items-center justify-between">
        <div>
          <p className="text-sm">Total Users: {chatStats.total}</p>
          <p className="text-sm">Growth Since Last: {chatStats.growth}</p>
        </div>
        <button
          onClick={runUpdate}
          className="px-3 py-1 bg-blue-600 text-white rounded"
          disabled={updating}
        >
          {updating ? 'Running...' : 'Update'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map(m => (
          <div
            key={m.label}
            className="bg-white p-4 rounded shadow text-center space-y-1"
            onClick={() => console.log('Metric clicked:', m)}
          >
            <div className="text-sm text-gray-500">{m.label}</div>
            <div className="text-xl font-semibold">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="mb-2 font-medium">Revenue This Week</h3>
          <Line data={revenueData} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="mb-2 font-medium">Customer Categories</h3>
          <Pie data={categoryData} />
        </div>
        <div className="bg-white p-4 rounded shadow lg:col-span-2">
          <h3 className="mb-2 font-medium">Campaign Performance</h3>
          <Bar data={campaignData} />
        </div>
        <div className="bg-white p-4 rounded shadow lg:col-span-2">
          <h3 className="mb-2 font-medium">Best Performing Lines</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {topLines.map((l, i) => (
              <li key={i} onClick={() => console.log('Top line clicked:', l)}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-2">
        <h3 className="mb-2 font-medium">Post Campaign Scorecard</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          {metrics.length > 0 && (
            <li>Response Rate: {metrics[3].value}</li>
          )}
          {topLines[0] && <li>Top Line: {topLines[0]}</li>}
          {metrics.length > 0 && <li>Revenue Attribution: {metrics[4].value}</li>}
          <li>Suggested Follow-up: Send VIP exclusive</li>
        </ul>
      </div>

    </div>
  )
}
