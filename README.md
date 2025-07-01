# Retargeting Platform Skeleton

This repository contains the initial structure of a multi-tenant Telegram retargeting platform as outlined in `retargetting_plan.txt`.

## Components

- **worker/** – Cloudflare Worker responsible for API endpoints, scheduling jobs and orchestrating the platform.
- **python_api/** – Flask-based service performing Telegram operations using Telethon.
- **db/** – Database schema supporting multi-tenant operation.
- **frontend/** – React UI with campaign editor, analytics dashboard, and monitor skeletons.

## Running

### Python API
```
cd python_api
pip install -r requirements.txt
export API_ID=YOUR_TELEGRAM_API_ID
export API_HASH=YOUR_TELEGRAM_API_HASH
python app.py
```

### Create D1 Database
```bash
wrangler d1 create retargetting
wrangler d1 execute retargetting --file=../db/schema.sql
```

### Cloudflare Worker
```
cd worker
npm install
npm run build
wrangler dev
```

The worker will be available locally at `http://localhost:8787`. Set
`VITE_API_BASE=http://localhost:8787` when running the React dev server so it
calls the worker correctly. In production the worker is hosted at
`https://retargetting-worker.elmtalabx.workers.dev/` and forwards requests to the
Python API at
`https://retargetting-slave-api-production.up.railway.app`.

The frontend is served from `https://retargetting-revised.pages.dev`. If
`VITE_API_BASE` is not provided, it will default to the production worker URL.

### Frontend
```bash
npm --prefix frontend install
npm --prefix frontend run start
```

The frontend provides placeholder components for editing campaigns, viewing analytics, and monitoring progress.

## Testing APIs

Basic connectivity tests can be run with:

```bash
./tests/run_all.sh
```

Environment variables `FRONTEND_BASE`, `WORKER_BASE` and `PYTHON_API_BASE` can
be set to override the default production endpoints when testing locally.
