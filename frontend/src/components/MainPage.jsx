import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Campaigns from './Campaigns'
import AnalyticsDashboard from './AnalyticsDashboard'
import CampaignMonitor from './CampaignMonitor'
import ConnectTelegram from './ConnectTelegram'
import CategoryManager from './CategoryManager'
import CampaignEditor from './CampaignEditor'

/* hi */

export default function MainPage({ onLogout, accountId, sessionId, onSelectSession }) {
  const [campaignId, setCampaignId] = React.useState(null)
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100 p-6 space-y-4">

        <h2 className="text-2xl font-bold text-gray-700">Menu</h2>
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/campaigns"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'
                }`
              }
            >
              Campaigns
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'
                }`
              }
            >
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/monitor"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'
                }`
              }
            >
              Monitor
            </NavLink>

          </li>
          <li>
            <NavLink
              to="/categories"
              className={({ isActive }) =>

                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'
                }`

              }
            >
              Categories
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/connect"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'
                }`
              }
            >
              Connect Telegram
            </NavLink>

          </li>
          <li>
            <button
              className="text-red-600 text-sm hover:underline"
              onClick={onLogout}
            >
              Logout
            </button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-4 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/campaigns" element={<Campaigns accountId={accountId} />} />
          <Route path="/editor" element={<CampaignEditor accountId={accountId} sessionId={sessionId} onSelectCampaign={setCampaignId} />} />
          <Route path="/analytics" element={<AnalyticsDashboard accountId={accountId} sessionId={sessionId} />} />
          <Route path="/monitor" element={<CampaignMonitor campaignId={campaignId} />} />
          <Route path="/connect" element={<ConnectTelegram accountId={accountId} sessionId={sessionId} onSelectSession={onSelectSession} />} />
          <Route path="/categories" element={<CategoryManager />} />
        </Routes>
      </main>
    </div>
  )
}
