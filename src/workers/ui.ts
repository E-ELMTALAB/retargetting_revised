import { Hono } from 'hono';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../ui/App';

const app = new Hono();

app.get('/', async (c) => {
  const html = renderToString(React.createElement(App));
  return c.html(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Telegram Retargeting Platform</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script type="module" src="/src/ui/client.tsx"></script>
      </body>
    </html>`
  );
});

export default app;
