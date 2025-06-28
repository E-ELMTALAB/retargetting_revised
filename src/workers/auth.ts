import { Hono } from 'hono';
import { sign } from 'hono/jwt';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/login', async (c) => {
  console.log('Received /login request');
  const { email, api_key } = await c.req.json();
  console.log('Login attempt with:', { email, api_key });
  const { results } = await c.env.DB.prepare(
    'SELECT id FROM accounts WHERE email = ? AND api_key = ?'
  ).bind(email.trim(), api_key.trim()).all();
  console.log('Query results:', results);
  if (results.length === 0) {
    console.log('Unauthorized login attempt');
    return c.text('Unauthorized', 401);
  }
  const jwt = await sign({ sub: results[0].id }, c.env.JWT_SECRET);
  console.log('Login successful, issuing JWT for user id:', results[0].id);
  return c.json({ token: jwt });
});

export default app;
