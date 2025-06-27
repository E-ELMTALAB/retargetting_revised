import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import campaigns from '../../src/workers/campaigns';

let app: Hono;

beforeEach(() => {
  app = new Hono();
  app.route('/campaigns', campaigns);
});

it('creates and starts campaign', async () => {
  const fd = new FormData();
  fd.set('message_text', 'hi');
  const res = await app.request('http://test/campaigns', { method: 'POST', body: fd });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.id).toBeTruthy();

  const start = await app.request(`http://test/campaigns/${data.id}/start`, { method: 'POST' });
  expect(start.status).toBe(200);
});
