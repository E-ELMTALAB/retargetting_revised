import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import CampaignEditor from './CampaignEditor'
import AnalyticsDashboard from './AnalyticsDashboard'
import CampaignMonitor from './CampaignMonitor'

export default function MainPage({ onLogout }) {
  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-100 p-4">

        <h2 className="text-xl mb-2 font-semibold">Menu</h2>
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/editor"
              className={({ isActive }) =>
                `block px-2 py-1 rounded ${isActive ? 'bg-blue-500 text-white' : 'text-blue-600'}`
              }
            >
              Campaign Editor
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `block px-2 py-1 rounded ${isActive ? 'bg-blue-500 text-white' : 'text-blue-600'}`
              }
            >
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/monitor"
              className={({ isActive }) =>
                `block px-2 py-1 rounded ${isActive ? 'bg-blue-500 text-white' : 'text-blue-600'}`
              }
            >
              Monitor
            </NavLink>

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
