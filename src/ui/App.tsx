import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SessionConnect from './SessionConnect';
import CampaignEditor from './CampaignEditor';
import AnalyticsDashboard from './AnalyticsDashboard';
import CampaignMonitor from './CampaignMonitor';
import { StateProvider, useAppState } from './Store';
import ErrorBoundary from './ErrorBoundary';

type Page = 'dashboard' | 'session' | 'editor' | 'monitor' | 'analytics';

function MainLayout() {
  const [page, setPage] = useState<Page>('dashboard');
  const { token } = useAppState();

  if (!token) {
    return (
      <div className="max-w-sm mx-auto p-4">
        <LoginForm onSuccess={() => setPage('dashboard')} />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'session':
        return <SessionConnect onSuccess={() => setPage('dashboard')} />;
      case 'editor':
        return <CampaignEditor />;
      case 'monitor':
        return <CampaignMonitor />;
      case 'analytics':
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 bg-gray-100 p-4 space-y-2">
        <h1 className="text-lg font-bold mb-4">Telegram Retargeting</h1>
        <nav className="flex flex-col space-y-2">
          <a className="cursor-pointer hover:underline" onClick={() => setPage('dashboard')}>Dashboard</a>
          <a className="cursor-pointer hover:underline" onClick={() => setPage('editor')}>Editor</a>
          <a className="cursor-pointer hover:underline" onClick={() => setPage('analytics')}>Analytics</a>
          <a className="cursor-pointer hover:underline" onClick={() => setPage('session')}>Session</a>
          <a className="cursor-pointer hover:underline" onClick={() => setPage('monitor')}>Monitor</a>
        </nav>
      </aside>
      <main className="flex-1 p-4">{renderPage()}</main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StateProvider>
        <MainLayout />
      </StateProvider>
    </ErrorBoundary>
  );
}
