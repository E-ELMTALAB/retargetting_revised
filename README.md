# retargetting-platform

## Development

Install dependencies and run the frontend (Vite dev server) and backend worker separately:

```bash
npm install
npm run backend # starts Cloudflare worker on :8787
npm run frontend # starts Vite dev server for the UI
```

Run tests with:

```bash
npm test
```

### Deployment

The React frontend can be deployed to **Cloudflare Pages** by building the UI:

```bash
npm run build
```

Upload the contents of `dist/` to your Pages project. The API routes in
`src/workers` can be deployed to **Cloudflare Workers** using Wrangler:

```bash
wrangler deploy src/workers/index.ts
```

### Connecting Your Telegram Account

Use the Session page in the UI or call the following API endpoints to link your account:

1. `POST /session/connect` with `{ phone: "+123456789" }` – sends an OTP to your Telegram.
2. `POST /session/verify` with `{ phone, code, password? }` – verify the OTP (and 2FA password if enabled). Your encrypted session is stored in KV.
3. `GET /session/status` – returns `{ loggedIn: true }` when a session is present.


The worker uses GramJS with WebSocket transport alongside Node compatibility mode so Telegram logins work on Cloudflare Workers.

