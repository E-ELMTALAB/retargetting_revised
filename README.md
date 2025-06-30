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

### Cloudflare Worker
```
cd worker
npm install
npm run build
wrangler dev
```

The frontend provides placeholder components for editing campaigns, viewing analytics, and monitoring progress.
