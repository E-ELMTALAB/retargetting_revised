import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/revenue', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(total_revenue),0) AS revenue, COALESCE(SUM(total_clicks),0) AS clicks FROM campaign_analytics'
  ).all();
  const row = (results as any[])[0] || { revenue: 0, clicks: 0 };
  return c.json({ revenue: row.revenue, clicks: row.clicks, daily: [] });
});

app.get('/categories', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT category, COUNT(*) AS count FROM customer_categories GROUP BY category'
  ).all();
  const categories: Record<string, number> = {};
  for (const r of results as any[]) {
    categories[r.category] = r.count;
  }
  return c.json(categories);
});

export default app;
