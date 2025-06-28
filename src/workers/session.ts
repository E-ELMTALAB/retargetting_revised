import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { SessionStore } from '../lib/session';
import { importKey } from '../lib/encryption';
import { sendLoginCode, verifyLoginCode } from '../lib/telegram';

interface Env {
  SESSION_KV: KVNamespace;
  SESSION_SECRET: string;
  TELEGRAM_API_ID: string;
  TELEGRAM_API_HASH: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env; Variables: { accountId: number } }>();

app.use('*', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth) return c.text('Unauthorized', 401);
  const token = auth.replace('Bearer ', '');
  const payload = await verify(token, c.env.JWT_SECRET).catch(() => null);
  if (!payload) return c.text('Unauthorized', 401);
  c.set('accountId', Number((payload as any).sub));
  await next();
});

app.post('/connect', async (c) => {
  const { phone } = await c.req.json<{ phone: string }>();
  const { TELEGRAM_API_ID, TELEGRAM_API_HASH } = c.env;
  const { phoneCodeHash } = await sendLoginCode(Number(TELEGRAM_API_ID), TELEGRAM_API_HASH, phone);
  await c.env.SESSION_KV.put(`otp:${c.get('accountId')}:${phone}`, phoneCodeHash, { expirationTtl: 300 });
  return c.text('OTP sent');
});

app.post('/verify', async (c) => {
  const { phone, code, password } = await c.req.json<{ phone: string; code: string; password?: string }>();
  const accountId = c.get('accountId');
  const phoneCodeHash = await c.env.SESSION_KV.get(`otp:${accountId}:${phone}`);
  if (!phoneCodeHash) {
    return c.text('No pending code', 400);
  }
  const { TELEGRAM_API_ID, TELEGRAM_API_HASH } = c.env;
  const sessionStr = await verifyLoginCode(
    Number(TELEGRAM_API_ID),
    TELEGRAM_API_HASH,
    phone,
    phoneCodeHash,
    code,
    password
  );
  const secret = await importKey(new TextEncoder().encode(c.env.SESSION_SECRET));
  const store = new SessionStore(c.env.SESSION_KV, secret);
  await store.set(accountId, sessionStr);
  return c.text('Session stored');
});

export default app;
