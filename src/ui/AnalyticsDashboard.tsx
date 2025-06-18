import React, { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('/analytics/revenue').then(r => r.json()).then(setMetrics).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Analytics</h2>
      {metrics ? (
        <div>
          <div>Revenue: ${metrics.revenue ?? 0}</div>
          <div>Clicks: {metrics.clicks ?? 0}</div>
        </div>
      ) : (
        <div id="metrics">Loading metrics...</div>
      )}
    </div>
  );
}
