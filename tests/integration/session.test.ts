import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import session from '../../src/workers/session';
import * as telegram from '../../src/lib/telegram';
vi.mock('hono/jwt', () => ({ verify: vi.fn(() => Promise.resolve({ sub: 1 })) }));

let app: Hono;
let kv: Map<string, string>;
let kvNs: any;

beforeEach(() => {
  app = new Hono();
  app.route('/session', session);
  kv = new Map();
  kvNs = {
    get: async (k: string) => kv.get(k) || null,
    put: async (k: string, v: string) => { kv.set(k, v); }
  };
  vi.spyOn(telegram, 'sendLoginCode').mockResolvedValue({ phoneCodeHash: 'hash' });
  vi.spyOn(telegram, 'verifyLoginCode').mockResolvedValue('session');
});

describe('session', () => {
  it('stores session after verify', async () => {
    const connect = new Request('http://test/session/connect', { method: 'POST', body: JSON.stringify({ phone: '1' }), headers: { Authorization: 'Bearer token' } });
    const verifyReq = new Request('http://test/session/verify', { method: 'POST', body: JSON.stringify({ phone: '1', code: '111' }), headers: { Authorization: 'Bearer token' } });
    const env = {
      SESSION_KV: kvNs,
      SESSION_SECRET: '0123456789abcdef0123456789abcdef',
      TELEGRAM_API_ID: '1',
      TELEGRAM_API_HASH: 'h',
      JWT_SECRET: 'jwt'
    } as any;
    await app.fetch(connect, env);
    const res = await app.fetch(verifyReq, env);
    expect(res.status).toBe(200);
    expect(kv.has('session:1')).toBe(true);
  });
});
