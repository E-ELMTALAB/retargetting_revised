import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { SessionStore } from '../lib/session';
import { importKey } from '../lib/encryption';

interface Env {
  SESSION_KV: KVNamespace;
  SESSION_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/session/connect', async (c) => {
  // placeholder: would call Telegram login
  return c.text('OTP sent');
});

app.post('/session/verify', async (c) => {
  const { token } = await c.req.json();
  // normally verify OTP and store session
  const secret = await importKey(new TextEncoder().encode(c.env.SESSION_SECRET));
  const store = new SessionStore(c.env.SESSION_KV, secret);
  await store.set(1, token); // placeholder accountId 1
  return c.text('Session stored');
});

export default app;
