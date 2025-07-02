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

export default function AnalyticsDashboard() {
  const API_BASE =
    import.meta.env.VITE_API_BASE ||
    'https://retargetting-worker.elmtalabx.workers.dev'

  const [metrics, setMetrics] = useState([])
  const [revenueData, setRevenueData] = useState({ labels: [], datasets: [] })
  const [categoryData, setCategoryData] = useState({ labels: [], datasets: [] })
  const [campaignData, setCampaignData] = useState({ labels: [], datasets: [] })
  const [topLines, setTopLines] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await fetch(`${API_BASE}/analytics/summary`)
        const data = await resp.json()
        const m = data.metrics || {}
        const ctr =
          m.messages_sent && m.successes
            ? ((m.successes / m.messages_sent) * 100).toFixed(1) + '%'
            : '0%'
        setMetrics([
          { label: 'Messages Sent', value: m.messages_sent || 0 },
          { label: 'Successes', value: m.successes || 0 },
          { label: 'Failures', value: m.failures || 0 },
          { label: 'CTR', value: ctr },
          { label: 'Revenue', value: `$${m.revenue || 0}` },
        ])
        const revLabels = (data.revenueByDay || []).map((r) => r.day)
        const revValues = (data.revenueByDay || []).map((r) => r.rev)
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
        setCategoryData({
          labels: (data.categories || []).map((c) => c.category),
          datasets: [
            {
              label: 'Distribution',
              data: (data.categories || []).map((c) => c.count),
              backgroundColor: [
                'rgb(34,197,94)',
                'rgb(59,130,246)',
                'rgb(239,68,68)',
              ],
            },
          ],
        })
        setCampaignData({
          labels: (data.campaigns || []).map((c) => `#${c.id}`),
          datasets: [
            {
              label: 'Messages Sent',
              data: (data.campaigns || []).map((c) => c.total_sent),
              backgroundColor: 'rgba(16,185,129,0.6)',
            },
          ],
        })
        const lines = []
        for (const c of data.campaigns || []) {
          if (c.best_performing_lines) {
            try {
              lines.push(...JSON.parse(c.best_performing_lines))
            } catch (_) {
              /* ignore */
            }
          }
        }
        setTopLines(lines.slice(0, 3))
      } catch (err) {
        console.error('analytics fetch', err)
      }
    }
    fetchData()
  }, [])

  return (

    <div className="p-4 space-y-6">
      <h2 className="text-2xl mb-4 font-semibold">Analytics Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map(m => (
          <div
            key={m.label}
            className="bg-white p-4 rounded shadow text-center space-y-1"
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
              <li key={i}>{l}</li>
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
