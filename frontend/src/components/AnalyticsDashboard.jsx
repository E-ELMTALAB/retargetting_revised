import React from 'react'
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
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [20, 40, 35, 50, 55, 60, 65],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
      },
    ],
  }

  const categoryData = {
    labels: ['Buyer', 'Browser', 'Refund Risk'],
    datasets: [
      {
        label: 'Distribution',
        data: [60, 30, 10],
        backgroundColor: [
          'rgb(34,197,94)',
          'rgb(59,130,246)',
          'rgb(239,68,68)',
        ],
      },
    ],
  }

  const campaignData = {
    labels: ['Spring', 'Summer', 'Fall'],
    datasets: [
      {
        label: 'Messages Sent',
        data: [500, 800, 650],
        backgroundColor: 'rgba(16,185,129,0.6)',
      },
    ],
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl mb-4 font-semibold">Analytics Dashboard</h2>
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
            <li>"Limited time discount ends today"</li>
            <li>"You left items in your cart"</li>
            <li>"VIP early access just for you"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
