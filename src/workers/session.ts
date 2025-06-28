import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { SessionStore } from '../lib/session';
import { importKey } from '../lib/encryption';
import { TelegramService } from '../lib/telegram';

interface Env {
  SESSION_KV: KVNamespace;
  SESSION_SECRET: string;
  TELEGRAM_API_ID: string;
  TELEGRAM_API_HASH: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

let service: TelegramService | null = null;
function getService(env: Env) {
  if (!service) {
    service = new TelegramService(
      Number(env.TELEGRAM_API_ID),
      env.TELEGRAM_API_HASH
    );
  }
  return service!;
}

async function auth(c: any) {
  const header = c.req.header('Authorization');
  if (!header) return null;
  const token = header.replace('Bearer ', '');
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    return Number(payload.sub);
  } catch {
    return null;
  }
}

app.post('/connect', async c => {
  const accountId = await auth(c);
  if (!accountId) return c.text('Unauthorized', 401);
  const { phone } = await c.req.json();
  await getService(c.env).sendCode(phone);
  return c.text('OTP sent');
});

app.post('/verify', async c => {
  const accountId = await auth(c);
  if (!accountId) return c.text('Unauthorized', 401);
  const { phone, code } = await c.req.json();
  const sessionStr = await getService(c.env).signIn(phone, code);
  const secret = await importKey(new TextEncoder().encode(c.env.SESSION_SECRET));
  const store = new SessionStore(c.env.SESSION_KV, secret);
  await store.set(accountId, sessionStr);
  return c.text('Session stored');
});

export default app;
