import React, { useEffect, useState } from 'react';

interface Monitor {
  status: string;
  errors: string;
  quiet: boolean;
  nudge: string;
  revenue: number;
}

export default function CampaignMonitor() {
  const [data, setData] = useState<Monitor>({
    status: 'Idle',
    errors: 'None',
    quiet: false,
    nudge: 'Inactive',
    revenue: 0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      fetch('/campaigns/current/status')
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">Campaign Monitor</h2>
      <div>Status: <span id="status">{data.status}</span></div>
      <div>Errors: <span id="errors">{data.errors}</span></div>
      <div>Quiet Hours: <span id="quiet">{data.quiet ? 'On' : 'Off'}</span></div>
      <div>Nudge Status: <span id="nudge">{data.nudge}</span></div>
      <div>Revenue: <span id="revenue">${data.revenue}</span></div>
    </div>
  );
}
