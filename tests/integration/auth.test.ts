import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import auth from '../../src/workers/auth';
import { Hono } from 'hono';

let app: Hono;

beforeEach(() => {
  global.fetch = async (url: string, init: any) => {
    expect(init.method).toBe('POST');
    return new Response(JSON.stringify({ results: [{ id: 1 }] }), { status: 200 });
  };
  app = new Hono();
  app.route('/auth', auth);
});

afterEach(() => {
  delete (global as any).fetch;
});

it('logs in and returns jwt', async () => {
  const req = new Request('http://test/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'a', api_key: 'b' })
  });
  const res = await app.fetch(req, {
    D1_ENDPOINT: 'http://d1',
    D1_TOKEN: 't',
    JWT_SECRET: 'secret'
  } as any);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.token).toBeTruthy();
});
