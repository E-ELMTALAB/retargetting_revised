import { Hono } from 'hono';
import React from 'react';
import App from '../ui/App';
import { renderToString } from 'react-dom/server';
import clientScript from '../ui/client?raw';

const app = new Hono();

app.get('/', async (c) => {
  const html = renderToString(<App />);
  return c.html(
    `<!DOCTYPE html><html><body><div id="root">${html}</div><script type="module">${clientScript}</script></body></html>`
  );
});

export default app;
