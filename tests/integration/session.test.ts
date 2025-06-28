import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import session from '../../src/workers/session';
import { sign } from 'hono/jwt';

vi.mock('../../src/lib/telegram', () => {
  return {
    TelegramService: vi.fn().mockImplementation(() => ({
      sendCode: vi.fn().mockResolvedValue(undefined),
      signIn: vi.fn().mockResolvedValue('sess')
    }))
  };
});

let app: Hono;
let kvPut: any;

beforeEach(() => {
  app = new Hono();
  app.route('/session', session);
  kvPut = vi.fn();
});

function env() {
  return {
    SESSION_KV: { put: kvPut, get: vi.fn() },
    SESSION_SECRET: '0123456789abcdef0123456789abcdef',
    TELEGRAM_API_ID: '1',
    TELEGRAM_API_HASH: 'h',
    JWT_SECRET: 'jwt'
  } as any;
}

it('sends code', async () => {
  const token = await sign({ sub: 1 }, 'jwt');
  const req = new Request('http://test/session/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ phone: '+1' })
  });
  const res = await app.fetch(req, env());
  expect(res.status).toBe(200);
});

it('verifies and stores session', async () => {
  const token = await sign({ sub: 1 }, 'jwt');
  const req = new Request('http://test/session/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ phone: '+1', code: '123' })
  });
  const res = await app.fetch(req, env());
  expect(res.status).toBe(200);
  expect(kvPut).toHaveBeenCalled();
});
