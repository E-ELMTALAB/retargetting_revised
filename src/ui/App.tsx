import React from 'react';
import LoginForm from './LoginForm';
import SessionConnect from './SessionConnect';
import CampaignEditor from './CampaignEditor';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function App() {
  return (
    <div>
      <h1>Telegram Retargeting Platform</h1>
      <LoginForm />
      <SessionConnect />
      <CampaignEditor />
      <AnalyticsDashboard />
    </div>
  );
}
