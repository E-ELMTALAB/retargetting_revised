import { describe, it, expect, beforeEach } from 'vitest';
import auth from '../../src/workers/auth';
import { Hono } from 'hono';

let app: Hono;
let db: any;

beforeEach(() => {
  db = {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [{ id: 1 }] })
      })
    })
  };
  app = new Hono();
  app.route('/auth', auth);
});

it('logs in and returns jwt', async () => {
  const req = new Request('http://test/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'a', api_key: 'b' })
  });
  const res = await app.fetch(req, {
    DB: db,
    JWT_SECRET: 'secret'
  } as any);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.token).toBeTruthy();
});
