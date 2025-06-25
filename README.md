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
