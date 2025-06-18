import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { query, D1Config } from '../lib/db';

interface Env {
  D1_ENDPOINT: string;
  D1_TOKEN: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/login', async (c) => {
  const { email, api_key } = await c.req.json();
  const rows = await query<{ id: number }>(
    { endpoint: c.env.D1_ENDPOINT, token: c.env.D1_TOKEN },
    'SELECT id FROM accounts WHERE email = ? AND api_key = ?',
    [email, api_key]
  );
  if (rows.length === 0) return c.text('Unauthorized', 401);
  const jwt = await sign({ sub: rows[0].id }, c.env.JWT_SECRET);
  return c.json({ token: jwt });
});

export default app;
