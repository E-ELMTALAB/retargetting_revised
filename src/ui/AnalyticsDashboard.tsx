import React, { useEffect, useState } from 'react';

interface RevenueMetrics {
  revenue: number;
  clicks: number;
  daily: { date: string; revenue: number }[];
}

interface CategoryMetrics {
  [key: string]: number;
}

interface CampaignAnalytics {
  id: number;
  total_sent: number;
  total_clicks: number;
  total_revenue: number;
  best_performing_lines: string[];
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [categories, setCategories] = useState<CategoryMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);

  useEffect(() => {
    const load = () => {
      fetch('/analytics/revenue')
        .then(r => r.json() as Promise<RevenueMetrics>)
        .then(setMetrics)
        .catch(() => {});

      fetch('/analytics/categories')
        .then(r => r.json() as Promise<CategoryMetrics>)
        .then(setCategories)
        .catch(() => {});

      Promise.all([
        fetch('/campaigns/1/analytics').then(r => r.json() as Promise<CampaignAnalytics>).catch(() => null),
        fetch('/campaigns/2/analytics').then(r => r.json() as Promise<CampaignAnalytics>).catch(() => null)
      ]).then(res => setCampaigns(res.filter(Boolean) as CampaignAnalytics[]));
    };

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const renderRevenueChart = () => {
    if (!metrics || metrics.daily.length === 0) return null;
    const max = Math.max(...metrics.daily.map(d => d.revenue));
    const points = metrics.daily
      .map((d, i) => `${i * 40},${80 - (d.revenue / max) * 80}`)
      .join(' ');
    return (
      <svg width="200" height="80" className="border">
        <polyline
          fill="none"
          stroke="blue"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  const renderCategories = () => {
    if (!categories) return null;
    const max = Math.max(...Object.values(categories));
    return (
      <div className="flex space-x-4 items-end h-32">
        {Object.entries(categories).map(([cat, val]) => (
          <div key={cat} className="flex flex-col items-center">
            <div
              className="bg-green-500 w-8"
              style={{ height: `${(val / max) * 100}%` }}
            />
            <span className="text-xs mt-1">{cat}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analytics</h2>
      {metrics ? (
        <div className="space-y-2">
          <div>Revenue: ${metrics.revenue}</div>
          <div>Clicks: {metrics.clicks}</div>
          {renderRevenueChart()}
        </div>
      ) : (
        <div id="metrics">Loading metrics...</div>
      )}

      {renderCategories()}

      {campaigns.length > 0 && (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Campaign</th>
              <th>Sent</th>
              <th>Clicks</th>
              <th>Revenue</th>
              <th>Best Lines</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} className="border-b">
                <td>{c.id}</td>
                <td>{c.total_sent}</td>
                <td>{c.total_clicks}</td>
                <td>${c.total_revenue}</td>
                <td>
                  <ul className="list-disc list-inside">
                    {c.best_performing_lines.map(line => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
