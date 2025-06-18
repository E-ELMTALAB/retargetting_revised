import React, { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {

    const load = () => {
      fetch('/analytics/revenue')
        .then(r => r.json())
        .then(setMetrics)
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Analytics</h2>
      {metrics ? (
        <div className="space-y-1">

          <div>Revenue: ${metrics.revenue ?? 0}</div>
          <div>Clicks: {metrics.clicks ?? 0}</div>
        </div>
      ) : (
        <div id="metrics">Loading metrics...</div>
      )}
    </div>
  );
}
