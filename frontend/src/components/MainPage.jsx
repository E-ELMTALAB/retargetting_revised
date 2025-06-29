import React from 'react'
import { Link, Routes, Route, Navigate } from 'react-router-dom'
import CampaignEditor from './CampaignEditor'
import AnalyticsDashboard from './AnalyticsDashboard'
import CampaignMonitor from './CampaignMonitor'

export default function MainPage({ onLogout }) {
  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-100 p-4">
        <h2 className="text-xl mb-2">Menu</h2>
        <ul className="space-y-2">
          <li>
            <Link className="text-blue-600" to="/editor">Campaign Editor</Link>
          </li>
          <li>
            <Link className="text-blue-600" to="/analytics">Analytics</Link>
          </li>
          <li>
            <Link className="text-blue-600" to="/monitor">Monitor</Link>
          </li>
          <li>
            <button className="text-red-600" onClick={onLogout}>Logout</button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-4 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/editor" element={<CampaignEditor />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/monitor" element={<CampaignMonitor />} />
        </Routes>
      </main>
    </div>
  )
}
