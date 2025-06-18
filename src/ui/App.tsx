import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SessionConnect from './SessionConnect';
import CampaignEditor from './CampaignEditor';
import AnalyticsDashboard from './AnalyticsDashboard';
import CampaignMonitor from './CampaignMonitor';
import { StateProvider } from './Store';
import ErrorBoundary from './ErrorBoundary';

type Page = 'login' | 'session' | 'editor' | 'monitor' | 'analytics';

export default function App() {
  const [page, setPage] = useState<Page>('login');

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginForm onSuccess={() => setPage('session')} />;
      case 'session':
        return <SessionConnect onSuccess={() => setPage('editor')} />;
      case 'editor':
        return <CampaignEditor />;
      case 'monitor':
        return <CampaignMonitor />;
      case 'analytics':
        return <AnalyticsDashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <StateProvider>
        <div className="max-w-3xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Telegram Retargeting Platform</h1>
          <nav className="flex space-x-4 mb-4">
            <a className="text-blue-500 underline cursor-pointer" onClick={() => setPage('editor')}>Editor</a>
            <a className="text-blue-500 underline cursor-pointer" onClick={() => setPage('monitor')}>Monitor</a>
            <a className="text-blue-500 underline cursor-pointer" onClick={() => setPage('analytics')}>Analytics</a>
          </nav>
          {renderPage()}
        </div>
      </StateProvider>
    </ErrorBoundary>
  );
}
