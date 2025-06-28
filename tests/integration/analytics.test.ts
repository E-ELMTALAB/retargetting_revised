import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import analytics from '../../src/workers/analytics';

let app: Hono;

beforeEach(() => {
  app = new Hono();
  app.route('/analytics', analytics);
});

function env(resultsMap: Record<string, any[]>) {
  return {
    DB: {
      prepare: (sql: string) => ({
        bind: () => ({
          all: async () => ({ results: resultsMap[sql] || [] })
        }),
        all: async () => ({ results: resultsMap[sql] || [] })
      })
    }
  } as any;
}

describe('analytics', () => {
  it('returns revenue metrics', async () => {
    const req = new Request('http://test/analytics/revenue');
    const res = await app.fetch(req, env({
      'SELECT COALESCE(SUM(total_revenue),0) AS revenue, COALESCE(SUM(total_clicks),0) AS clicks FROM campaign_analytics': [
        { revenue: 5, clicks: 2 }
      ]
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.revenue).toBe(5);
    expect(data.clicks).toBe(2);
  });

  it('returns category metrics', async () => {
    const req = new Request('http://test/analytics/categories');
    const res = await app.fetch(req, env({
      'SELECT category, COUNT(*) AS count FROM customer_categories GROUP BY category': [
        { category: 'buyer', count: 3 }
      ]
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.buyer).toBe(3);
  });
});
