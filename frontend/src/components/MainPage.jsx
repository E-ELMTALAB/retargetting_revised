import React from 'react'
import { Link, Routes, Route, Navigate } from 'react-router-dom'
import CampaignEditor from './CampaignEditor'
import AnalyticsDashboard from './AnalyticsDashboard'
import CampaignMonitor from './CampaignMonitor'

export default function MainPage({ onLogout }) {
  return (
    <div className="main-layout">
      <aside className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li><Link to="/editor">Campaign Editor</Link></li>
          <li><Link to="/analytics">Analytics</Link></li>
          <li><Link to="/monitor">Monitor</Link></li>
          <li><button onClick={onLogout}>Logout</button></li>
        </ul>
      </aside>
      <main className="content">
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
